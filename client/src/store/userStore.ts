import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, Transaction, UserStats } from '@/types/user';

interface UserState {
  // Wallet data
  wallet: Wallet | null;
  walletLoading: boolean;
  walletError: string | null;
  
  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  
  // User stats
  stats: UserStats | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Settings
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    soundEffects: boolean;
    autoTrade: boolean;
  };
  
  // Actions
  setWallet: (wallet: Wallet) => void;
  updateBalance: (newBalance: number) => void;
  setWalletLoading: (loading: boolean) => void;
  setWalletError: (error: string | null) => void;
  
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setTransactionsLoading: (loading: boolean) => void;
  setTransactionsError: (error: string | null) => void;
  
  setStats: (stats: UserStats) => void;
  setStatsLoading: (loading: boolean) => void;
  setStatsError: (error: string | null) => void;
  
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void;
  
  resetUserState: () => void;
}

const initialState = {
  wallet: null,
  walletLoading: false,
  walletError: null,
  
  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  
  stats: null,
  statsLoading: false,
  statsError: null,
  
  preferences: {
    theme: 'dark' as const,
    notifications: true,
    soundEffects: true,
    autoTrade: false,
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setWallet: (wallet: Wallet) => {
        set({ wallet, walletError: null });
      },
      
      updateBalance: (newBalance: number) => {
        set((state) => ({
          wallet: state.wallet ? { ...state.wallet, balance: newBalance } : null
        }));
      },
      
      setWalletLoading: (loading: boolean) => {
        set({ walletLoading: loading });
      },
      
      setWalletError: (error: string | null) => {
        set({ walletError: error });
      },
      
      setTransactions: (transactions: Transaction[]) => {
        set({ transactions, transactionsError: null });
      },
      
      addTransaction: (transaction: Transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions].slice(0, 100) // Keep last 100
        }));
      },
      
      setTransactionsLoading: (loading: boolean) => {
        set({ transactionsLoading: loading });
      },
      
      setTransactionsError: (error: string | null) => {
        set({ transactionsError: error });
      },
      
      setStats: (stats: UserStats) => {
        set({ stats, statsError: null });
      },
      
      setStatsLoading: (loading: boolean) => {
        set({ statsLoading: loading });
      },
      
      setStatsError: (error: string | null) => {
        set({ statsError: error });
      },
      
      updatePreferences: (preferences: Partial<UserState['preferences']>) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        }));
      },
      
      resetUserState: () => {
        set(initialState);
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        preferences: state.preferences 
      }),
    }
  )
);

// Selectors
export const useWallet = () => useUserStore((state) => state.wallet);
export const useBalance = () => useUserStore((state) => state.wallet?.balance || 0);
export const useTransactions = () => useUserStore((state) => state.transactions);
export const useUserStats = () => useUserStore((state) => state.stats);
export const useUserPreferences = () => useUserStore((state) => state.preferences);

// Computed selectors
export const useNetProfit = () => {
  const stats = useUserStore((state) => state.stats);
  return stats ? stats.netProfit : 0;
};

export const useWinRate = () => {
  const stats = useUserStore((state) => state.stats);
  return stats ? stats.winRate : 0;
};