import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MarketAsset, PriceData, HistoricalData, MarketSummary } from '@/types/market';

interface MarketState {
  // Assets
  assets: MarketAsset[];
  assetsLoading: boolean;
  assetsError: string | null;
  
  // Prices
  prices: Map<string, PriceData>;
  selectedAsset: string;
  
  // Historical data cache
  historicalDataCache: Map<string, HistoricalData[]>;
  
  // Market summary
  summary: MarketSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  
  // Trading settings
  tradingEnabled: boolean;
  maxLeverage: number;
  minTradeAmount: number;
  maxTradeAmount: number;
  
  // Actions
  setAssets: (assets: MarketAsset[]) => void;
  updateAsset: (symbol: string, asset: Partial<MarketAsset>) => void;
  setAssetsLoading: (loading: boolean) => void;
  setAssetsError: (error: string | null) => void;
  
  updatePrice: (symbol: string, priceData: PriceData) => void;
  updatePrices: (pricesData: PriceData[]) => void;
  setSelectedAsset: (symbol: string) => void;
  
  setHistoricalData: (symbol: string, data: HistoricalData[]) => void;
  getHistoricalData: (symbol: string) => HistoricalData[] | undefined;
  clearHistoricalCache: (symbol?: string) => void;
  
  setSummary: (summary: MarketSummary) => void;
  setSummaryLoading: (loading: boolean) => void;
  setSummaryError: (error: string | null) => void;
  
  setTradingSettings: (settings: Partial<MarketState>) => void;
  
  resetMarketState: () => void;
}

const initialState = {
  assets: [],
  assetsLoading: false,
  assetsError: null,
  
  prices: new Map(),
  selectedAsset: 'AAC',
  
  historicalDataCache: new Map(),
  
  summary: null,
  summaryLoading: false,
  summaryError: null,
  
  tradingEnabled: true,
  maxLeverage: 1,
  minTradeAmount: 1,
  maxTradeAmount: 1000,
};

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setAssets: (assets: MarketAsset[]) => {
        set({ assets, assetsError: null });
        
        // Initialize prices map with current prices
        const priceMap = new Map();
        assets.forEach(asset => {
          priceMap.set(asset.symbol, {
            symbol: asset.symbol,
            price: asset.currentPrice,
            change: asset.trend,
            volume: asset.volume,
            timestamp: Date.now(),
          });
        });
        set({ prices: priceMap });
      },
      
      updateAsset: (symbol: string, asset: Partial<MarketAsset>) => {
        set((state) => ({
          assets: state.assets.map(a => 
            a.symbol === symbol ? { ...a, ...asset } : a
          )
        }));
      },
      
      setAssetsLoading: (loading: boolean) => {
        set({ assetsLoading: loading });
      },
      
      setAssetsError: (error: string | null) => {
        set({ assetsError: error });
      },
      
      updatePrice: (symbol: string, priceData: PriceData) => {
        set((state) => {
          const newPrices = new Map(state.prices);
          
          // Calculate price change percentage
          const oldPrice = newPrices.get(symbol);
          if (oldPrice) {
            const changePercent = ((priceData.price - oldPrice.price) / oldPrice.price) * 100;
            priceData.change = changePercent;
          }
          
          newPrices.set(symbol, {
            ...priceData,
            timestamp: Date.now(),
          });
          
          return { prices: newPrices };
        });
        
        // Also update the asset in assets array
        set((state) => ({
          assets: state.assets.map(asset =>
            asset.symbol === symbol
              ? { ...asset, currentPrice: priceData.price, volume: priceData.volume }
              : asset
          )
        }));
      },
      
      updatePrices: (pricesData: PriceData[]) => {
        pricesData.forEach(priceData => {
          get().updatePrice(priceData.symbol, priceData);
        });
      },
      
      setSelectedAsset: (symbol: string) => {
        set({ selectedAsset: symbol });
      },
      
      setHistoricalData: (symbol: string, data: HistoricalData[]) => {
        set((state) => {
          const newCache = new Map(state.historicalDataCache);
          newCache.set(symbol, data);
          return { historicalDataCache: newCache };
        });
      },
      
      getHistoricalData: (symbol: string) => {
        return get().historicalDataCache.get(symbol);
      },
      
      clearHistoricalCache: (symbol?: string) => {
        if (symbol) {
          set((state) => {
            const newCache = new Map(state.historicalDataCache);
            newCache.delete(symbol);
            return { historicalDataCache: newCache };
          });
        } else {
          set({ historicalDataCache: new Map() });
        }
      },
      
      setSummary: (summary: MarketSummary) => {
        set({ summary, summaryError: null });
      },
      
      setSummaryLoading: (loading: boolean) => {
        set({ summaryLoading: loading });
      },
      
      setSummaryError: (error: string | null) => {
        set({ summaryError: error });
      },
      
      setTradingSettings: (settings: Partial<MarketState>) => {
        set({
          tradingEnabled: settings.tradingEnabled ?? get().tradingEnabled,
          maxLeverage: settings.maxLeverage ?? get().maxLeverage,
          minTradeAmount: settings.minTradeAmount ?? get().minTradeAmount,
          maxTradeAmount: settings.maxTradeAmount ?? get().maxTradeAmount,
        });
      },
      
      resetMarketState: () => {
        set(initialState);
      },
    }),
    {
      name: 'market-storage',
      partialize: (state) => ({
        selectedAsset: state.selectedAsset,
        tradingEnabled: state.tradingEnabled,
        maxLeverage: state.maxLeverage,
        minTradeAmount: state.minTradeAmount,
        maxTradeAmount: state.maxTradeAmount,
        // Don't persist maps
      }),
    }
  )
);

// Selectors for better performance
export const useAssets = () => useMarketStore((state) => state.assets);
export const useSelectedAsset = () => useMarketStore((state) => state.selectedAsset);
export const useCurrentPrice = (symbol?: string) => {
  const selectedSymbol = symbol || useMarketStore((state) => state.selectedAsset);
  return useMarketStore((state) => state.prices.get(selectedSymbol)?.price || 0);
};
export const usePriceData = (symbol?: string) => {
  const selectedSymbol = symbol || useMarketStore((state) => state.selectedAsset);
  return useMarketStore((state) => state.prices.get(selectedSymbol));
};
export const useMarketSummary = () => useMarketStore((state) => state.summary);
export const useTradingEnabled = () => useMarketStore((state) => state.tradingEnabled);

// Computed selectors
export const useAssetPerformance = () => {
  const assets = useMarketStore((state) => state.assets);
  const prices = useMarketStore((state) => state.prices);
  
  return assets.map(asset => {
    const currentPrice = prices.get(asset.symbol)?.price || asset.currentPrice;
    const priceChange = ((currentPrice - asset.currentPrice) / asset.currentPrice) * 100;
    
    return {
      ...asset,
      currentPrice,
      priceChange,
    };
  });
};

export const useTopGainers = (limit: number = 5) => {
  const performance = useAssetPerformance();
  return performance
    .sort((a, b) => b.priceChange - a.priceChange)
    .slice(0, limit);
};

export const useTopLosers = (limit: number = 5) => {
  const performance = useAssetPerformance();
  return performance
    .sort((a, b) => a.priceChange - b.priceChange)
    .slice(0, limit);
};

// Helper functions
export const getAssetBySymbol = (symbol: string) => {
  return useMarketStore.getState().assets.find(a => a.symbol === symbol);
};

export const getCurrentPriceForAsset = (symbol: string) => {
  const priceData = useMarketStore.getState().prices.get(symbol);
  return priceData?.price || getAssetBySymbol(symbol)?.currentPrice || 0;
};