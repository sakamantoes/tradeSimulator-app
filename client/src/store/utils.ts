import { useAuthStore, useUserStore, useMarketStore, useTradeStore } from './index';

// Reset all stores (useful for logout)
export const resetAllStores = () => {
  useAuthStore.getState().clearAuth();
  useUserStore.getState().resetUserState();
  useMarketStore.getState().resetMarketState();
  useTradeStore.getState().resetTradeState();
};

// Get complete application state (for debugging)
export const getAppState = () => {
  return {
    auth: useAuthStore.getState(),
    user: useUserStore.getState(),
    market: useMarketStore.getState(),
    trade: useTradeStore.getState(),
  };
};

// Middleware for logging state changes
export const logStateChanges = (store: any, storeName: string) => {
  store.subscribe((state: any) => {
    console.log(`[${storeName}] State updated:`, state);
  });
};

// Persist middleware configuration
export const persistConfig = {
  name: 'app-storage',
  getStorage: () => localStorage,
  partialize: (state: any) => {
    // Remove sensitive data
    const { sensitiveData, ...rest } = state;
    return rest;
  },
};