import api from './api';
import { Trade, OpenTradeData, TradeStats, CloseTradeData } from '@/types/trade';

export const tradeService = {
  /**
   * Open a new trade
   */
  openTrade: async (data: OpenTradeData): Promise<Trade> => {
    const response = await api.post<Trade>('/trades', data);
    return response.data;
  },

  /**
   * Get user trades
   */
  getTrades: async (limit?: number, offset?: number, status?: string): Promise<Trade[]> => {
    const { data } = await api.get<Trade[]>('/trades', {
      params: { limit, offset, status },
    });
    return data;
  },

  /**
   * Get user trade statistics
   */
  getTradeStats: async (): Promise<TradeStats> => {
    const { data } = await api.get<TradeStats>('/users/stats');
    return data;
  },

  /**
   * Get open trades
   */
  getOpenTrades: async (): Promise<Trade[]> => {
    const { data } = await api.get<Trade[]>('/trades/open');
    return data;
  },

  /**
   * Get closed trades
   */
  getClosedTrades: async (limit?: number, offset?: number): Promise<Trade[]> => {
    const { data } = await api.get<Trade[]>('/trades/closed', {
      params: { limit, offset },
    });
    return data;
  },

  /**
   * Cancel an open trade
   */
  cancelTrade: async (tradeId: number): Promise<{ message: string }> => {
    const { data } = await api.put<{ message: string }>(`/trades/${tradeId}/cancel`);
    return data;
  },

  /**
   * Get trade by ID
   */
  getTradeById: async (tradeId: number): Promise<Trade> => {
    const { data } = await api.get<Trade>(`/trades/${tradeId}`);
    return data;
  },

  /**
   * Get trade history for a specific asset
   */
  getTradeHistoryByAsset: async (asset: string, limit?: number): Promise<Trade[]> => {
    const { data } = await api.get<Trade[]>(`/trades/asset/${asset}`, {
      params: { limit },
    });
    return data;
  },

  /**
   * Get today's trades summary
   */
  getTodayTrades: async (): Promise<{ total: number; wins: number; losses: number; profit: number }> => {
    const { data } = await api.get('/trades/today');
    return data;
  },

  /**
   * Export trade history
   */
  exportTradeHistory: async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    const response = await api.get('/trades/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default tradeService;