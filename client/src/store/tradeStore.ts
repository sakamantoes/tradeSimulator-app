import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trade, TradeStats, OpenTradeData, TradeFilters } from '@/types/trade';

interface TradeState {
  // Active trades (open positions)
  activeTrades: Trade[];
  activeTradesLoading: boolean;
  activeTradesError: string | null;
  
  // Trade history (closed trades)
  tradeHistory: Trade[];
  tradeHistoryLoading: boolean;
  tradeHistoryError: string | null;
  tradeHistoryFilters: TradeFilters;
  tradeHistoryTotal: number;
  
  // Trade statistics
  stats: TradeStats | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Trade settings
  autoTradeEnabled: boolean;
  defaultTradeAmount: number;
  defaultTradeDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  
  // Actions
  setActiveTrades: (trades: Trade[]) => void;
  addActiveTrade: (trade: Trade) => void;
  updateActiveTrade: (tradeId: number, updates: Partial<Trade>) => void;
  removeActiveTrade: (tradeId: number) => void;
  clearActiveTrades: () => void;
  setActiveTradesLoading: (loading: boolean) => void;
  setActiveTradesError: (error: string | null) => void;
  
  setTradeHistory: (trades: Trade[], total?: number) => void;
  addToHistory: (trade: Trade) => void;
  setTradeHistoryLoading: (loading: boolean) => void;
  setTradeHistoryError: (error: string | null) => void;
  setTradeHistoryFilters: (filters: Partial<TradeFilters>) => void;
  resetTradeHistoryFilters: () => void;
  
  setStats: (stats: TradeStats) => void;
  setStatsLoading: (loading: boolean) => void;
  setStatsError: (error: string | null) => void;
  updateStats: () => void;
  
  setAutoTrade: (enabled: boolean) => void;
  setDefaultTradeAmount: (amount: number) => void;
  setDefaultTradeDuration: (duration: number) => void;
  setRiskLevel: (level: 'low' | 'medium' | 'high') => void;
  
  resetTradeState: () => void;
  
  // Computed values (derived)
  getTotalActiveVolume: () => number;
  getWinRate: () => number;
  getTotalProfitLoss: () => number;
  getPendingTradesCount: () => number;
}

const initialState = {
  activeTrades: [],
  activeTradesLoading: false,
  activeTradesError: null,
  
  tradeHistory: [],
  tradeHistoryLoading: false,
  tradeHistoryError: null,
  tradeHistoryFilters: {
    asset: '',
    result: '',
    startDate: null,
    endDate: null,
    limit: 20,
    offset: 0,
  },
  tradeHistoryTotal: 0,
  
  stats: null,
  statsLoading: false,
  statsError: null,
  
  autoTradeEnabled: false,
  defaultTradeAmount: 10,
  defaultTradeDuration: 1,
  riskLevel: 'medium' as const,
};

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Active trades actions
      setActiveTrades: (trades: Trade[]) => {
        set({ activeTrades: trades, activeTradesError: null });
        get().updateStats();
      },
      
      addActiveTrade: (trade: Trade) => {
        set((state) => ({
          activeTrades: [trade, ...state.activeTrades]
        }));
        get().updateStats();
      },
      
      updateActiveTrade: (tradeId: number, updates: Partial<Trade>) => {
        set((state) => ({
          activeTrades: state.activeTrades.map(trade =>
            trade.id === tradeId ? { ...trade, ...updates } : trade
          )
        }));
        
        // Check if trade is closed and move to history
        const updatedTrade = get().activeTrades.find(t => t.id === tradeId);
        if (updatedTrade && updatedTrade.status === 'closed') {
          get().removeActiveTrade(tradeId);
          get().addToHistory(updatedTrade);
        }
        
        get().updateStats();
      },
      
      removeActiveTrade: (tradeId: number) => {
        set((state) => ({
          activeTrades: state.activeTrades.filter(trade => trade.id !== tradeId)
        }));
        get().updateStats();
      },
      
      clearActiveTrades: () => {
        set({ activeTrades: [] });
        get().updateStats();
      },
      
      setActiveTradesLoading: (loading: boolean) => {
        set({ activeTradesLoading: loading });
      },
      
      setActiveTradesError: (error: string | null) => {
        set({ activeTradesError: error });
      },
      
      // Trade history actions
      setTradeHistory: (trades: Trade[], total?: number) => {
        set({ 
          tradeHistory: trades, 
          tradeHistoryError: null,
          tradeHistoryTotal: total !== undefined ? total : trades.length 
        });
        get().updateStats();
      },
      
      addToHistory: (trade: Trade) => {
        set((state) => ({
          tradeHistory: [trade, ...state.tradeHistory].slice(0, 200) // Keep last 200 trades
        }));
        get().updateStats();
      },
      
      setTradeHistoryLoading: (loading: boolean) => {
        set({ tradeHistoryLoading: loading });
      },
      
      setTradeHistoryError: (error: string | null) => {
        set({ tradeHistoryError: error });
      },
      
      setTradeHistoryFilters: (filters: Partial<TradeFilters>) => {
        set((state) => ({
          tradeHistoryFilters: { ...state.tradeHistoryFilters, ...filters }
        }));
      },
      
      resetTradeHistoryFilters: () => {
        set({ tradeHistoryFilters: initialState.tradeHistoryFilters });
      },
      
      // Stats actions
      setStats: (stats: TradeStats) => {
        set({ stats, statsError: null });
      },
      
      setStatsLoading: (loading: boolean) => {
        set({ statsLoading: loading });
      },
      
      setStatsError: (error: string | null) => {
        set({ statsError: error });
      },
      
      updateStats: () => {
        const { activeTrades, tradeHistory } = get();
        const allClosedTrades = tradeHistory.filter(t => t.status === 'closed');
        
        const totalTrades = activeTrades.length + allClosedTrades.length;
        const wins = allClosedTrades.filter(t => t.result === 'win').length;
        const losses = allClosedTrades.filter(t => t.result === 'loss').length;
        const winRate = totalTrades > 0 ? (wins / allClosedTrades.length) * 100 : 0;
        
        const totalProfit = allClosedTrades
          .filter(t => t.result === 'win')
          .reduce((sum, t) => sum + t.profit, 0);
        
        const totalLoss = allClosedTrades
          .filter(t => t.result === 'loss')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const netProfit = totalProfit - totalLoss;
        
        // Calculate average profit per trade
        const avgProfit = allClosedTrades.length > 0 
          ? netProfit / allClosedTrades.length 
          : 0;
        
        // Calculate best and worst trades
        const bestTrade = allClosedTrades.length > 0
          ? Math.max(...allClosedTrades.map(t => t.profit))
          : 0;
        
        const worstTrade = allClosedTrades.length > 0
          ? Math.min(...allClosedTrades.map(t => t.profit))
          : 0;
        
        // Calculate current exposure (total amount in open trades)
        const currentExposure = activeTrades.reduce((sum, t) => sum + t.amount, 0);
        
        const stats: TradeStats = {
          totalTrades,
          wins,
          losses,
          winRate,
          totalProfit,
          totalLoss,
          netProfit,
          avgProfit,
          bestTrade,
          worstTrade,
          currentExposure,
        };
        
        set({ stats });
      },
      
      // Settings actions
      setAutoTrade: (enabled: boolean) => {
        set({ autoTradeEnabled: enabled });
      },
      
      setDefaultTradeAmount: (amount: number) => {
        set({ defaultTradeAmount: amount });
      },
      
      setDefaultTradeDuration: (duration: number) => {
        set({ defaultTradeDuration: duration });
      },
      
      setRiskLevel: (level: 'low' | 'medium' | 'high') => {
        set({ riskLevel: level });
        
        // Adjust default trade amount based on risk level
        const { defaultTradeAmount } = get();
        if (level === 'low') {
          set({ defaultTradeAmount: Math.min(defaultTradeAmount, 5) });
        } else if (level === 'high') {
          set({ defaultTradeAmount: Math.max(defaultTradeAmount, 20) });
        }
      },
      
      resetTradeState: () => {
        set(initialState);
      },
      
      // Computed values
      getTotalActiveVolume: () => {
        return get().activeTrades.reduce((sum, trade) => sum + trade.amount, 0);
      },
      
      getWinRate: () => {
        const { stats } = get();
        return stats?.winRate || 0;
      },
      
      getTotalProfitLoss: () => {
        const { stats } = get();
        return stats?.netProfit || 0;
      },
      
      getPendingTradesCount: () => {
        return get().activeTrades.filter(t => t.status === 'open').length;
      },
    }),
    {
      name: 'trade-storage',
      partialize: (state) => ({
        autoTradeEnabled: state.autoTradeEnabled,
        defaultTradeAmount: state.defaultTradeAmount,
        defaultTradeDuration: state.defaultTradeDuration,
        riskLevel: state.riskLevel,
        tradeHistoryFilters: state.tradeHistoryFilters,
      }),
    }
  )
);

// Selectors for better performance
export const useActiveTrades = () => useTradeStore((state) => state.activeTrades);
export const useActiveTradesLoading = () => useTradeStore((state) => state.activeTradesLoading);
export const useActiveTradesError = () => useTradeStore((state) => state.activeTradesError);

export const useTradeHistory = () => useTradeStore((state) => state.tradeHistory);
export const useTradeHistoryLoading = () => useTradeStore((state) => state.tradeHistoryLoading);
export const useTradeHistoryError = () => useTradeStore((state) => state.tradeHistoryError);
export const useTradeHistoryFilters = () => useTradeStore((state) => state.tradeHistoryFilters);
export const useTradeHistoryTotal = () => useTradeStore((state) => state.tradeHistoryTotal);

export const useTradeStats = () => useTradeStore((state) => state.stats);
export const useTradeStatsLoading = () => useTradeStore((state) => state.statsLoading);
export const useTradeStatsError = () => useTradeStore((state) => state.statsError);

export const useAutoTrade = () => useTradeStore((state) => state.autoTradeEnabled);
export const useDefaultTradeAmount = () => useTradeStore((state) => state.defaultTradeAmount);
export const useDefaultTradeDuration = () => useTradeStore((state) => state.defaultTradeDuration);
export const useRiskLevel = () => useTradeStore((state) => state.riskLevel);

// Computed selectors
export const useTotalActiveVolume = () => {
  return useTradeStore((state) => state.getTotalActiveVolume());
};

export const useWinRate = () => {
  return useTradeStore((state) => state.getWinRate());
};

export const useTotalProfitLoss = () => {
  return useTradeStore((state) => state.getTotalProfitLoss());
};

export const usePendingTradesCount = () => {
  return useTradeStore((state) => state.getPendingTradesCount());
};

export const useTradePerformance = () => {
  const stats = useTradeStore((state) => state.stats);
  const activeTrades = useTradeStore((state) => state.activeTrades);
  
  if (!stats) return null;
  
  return {
    ...stats,
    hasActiveTrades: activeTrades.length > 0,
    isProfitable: stats.netProfit > 0,
    profitLossPercentage: stats.totalTrades > 0 
      ? (stats.netProfit / stats.totalTrades) * 100 
      : 0,
  };
};

// Filtered trade history selector
export const useFilteredTradeHistory = () => {
  const trades = useTradeStore((state) => state.tradeHistory);
  const filters = useTradeStore((state) => state.tradeHistoryFilters);
  
  return trades.filter(trade => {
    // Filter by asset
    if (filters.asset && trade.asset !== filters.asset) {
      return false;
    }
    
    // Filter by result
    if (filters.result && trade.result !== filters.result) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate && new Date(trade.createdAt) < new Date(filters.startDate)) {
      return false;
    }
    
    if (filters.endDate && new Date(trade.createdAt) > new Date(filters.endDate)) {
      return false;
    }
    
    return true;
  });
};

// Group trades by date for charting
export const useTradeHistoryByDate = () => {
  const trades = useFilteredTradeHistory();
  
  const grouped = trades.reduce((acc, trade) => {
    const date = new Date(trade.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = {
        date,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        volume: 0,
      };
    }
    
    acc[date].totalTrades++;
    if (trade.result === 'win') {
      acc[date].wins++;
      acc[date].profit += trade.profit;
    } else if (trade.result === 'loss') {
      acc[date].losses++;
      acc[date].profit -= trade.amount;
    }
    acc[date].volume += trade.amount;
    
    return acc;
  }, {} as Record<string, {
    date: string;
    totalTrades: number;
    wins: number;
    losses: number;
    profit: number;
    volume: number;
  }>);
  
  return Object.values(grouped).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

// Group trades by asset
export const useTradePerformanceByAsset = () => {
  const trades = useFilteredTradeHistory();
  
  const grouped = trades.reduce((acc, trade) => {
    if (!acc[trade.asset]) {
      acc[trade.asset] = {
        asset: trade.asset,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        volume: 0,
      };
    }
    
    acc[trade.asset].totalTrades++;
    if (trade.result === 'win') {
      acc[trade.asset].wins++;
      acc[trade.asset].profit += trade.profit;
    } else if (trade.result === 'loss') {
      acc[trade.asset].losses++;
      acc[trade.asset].profit -= trade.amount;
    }
    acc[trade.asset].volume += trade.amount;
    
    return acc;
  }, {} as Record<string, {
    asset: string;
    totalTrades: number;
    wins: number;
    losses: number;
    profit: number;
    volume: number;
    winRate?: number;
  }>);
  
  // Calculate win rate for each asset
  return Object.values(grouped).map(asset => ({
    ...asset,
    winRate: asset.totalTrades > 0 ? (asset.wins / asset.totalTrades) * 100 : 0,
  })).sort((a, b) => b.profit - a.profit);
};

// Helper functions
export const calculateTradeResult = (
  amount: number,
  prediction: 'UP' | 'DOWN',
  openPrice: number,
  closePrice: number
) => {
  if (prediction === 'UP' && closePrice > openPrice) {
    return {
      result: 'win' as const,
      profit: amount * 0.1, // 10% profit
    };
  } else if (prediction === 'DOWN' && closePrice < openPrice) {
    return {
      result: 'win' as const,
      profit: amount * 0.1,
    };
  } else {
    return {
      result: 'loss' as const,
      profit: -amount,
    };
  }
};

export const validateTradeAmount = (amount: number, balance: number, minAmount: number = 1, maxAmount: number = 1000) => {
  const errors: string[] = [];
  
  if (amount < minAmount) {
    errors.push(`Minimum trade amount is $${minAmount}`);
  }
  
  if (amount > maxAmount) {
    errors.push(`Maximum trade amount is $${maxAmount}`);
  }
  
  if (amount > balance) {
    errors.push('Insufficient balance');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Auto-trade strategy (simplified)
export const getAutoTradeDecision = (
  currentPrice: number,
  movingAverage: number,
  rsi: number,
  volatility: number
): 'UP' | 'DOWN' | null => {
  // Simple strategy based on price vs moving average and RSI
  if (currentPrice > movingAverage && rsi < 70) {
    return 'UP';
  } else if (currentPrice < movingAverage && rsi > 30) {
    return 'DOWN';
  }
  return null;
};