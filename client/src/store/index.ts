// Export all stores
export { useAuthStore, useAuthUser, useAuthToken, useIsAuthenticated, useAuthLoading } from './authStore';
export { useUserStore, useWallet, useBalance, useTransactions, useUserStats, useUserPreferences, useNetProfit, useWinRate } from './ userStore';
export { 
  useMarketStore, 
  useAssets, 
  useSelectedAsset, 
  useCurrentPrice, 
  usePriceData,
  useMarketSummary,
  useTradingEnabled,
  useAssetPerformance,
  useTopGainers,
  useTopLosers,
  getAssetBySymbol,
  getCurrentPriceForAsset
} from './ marketStore';
export { 
  useTradeStore, 
  useActiveTrades, 
  useTradeHistory, 
  usePendingTrades,
  useTotalTradesCount,
  useOpenTradesValue,
  useTotalProfitLoss
} from './tradeStore';

// Types
export type { AuthState } from './authStore';
export type { UserState } from './ userStore';
export type { MarketState } from './ marketStore';
export type { TradeState } from './ tradeStore';