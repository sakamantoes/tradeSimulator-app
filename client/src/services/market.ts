import api from './api';
import { MarketAsset, HistoricalData, MarketSummary, MarketNews } from '@/types/market';

export const marketService = {
  /**
   * Get all market assets
   */
  getAssets: async (): Promise<MarketAsset[]> => {
    const { data } = await api.get<MarketAsset[]>('/market/assets');
    return data;
  },

  /**
   * Get single asset price
   */
  getAssetPrice: async (symbol: string): Promise<{ symbol: string; price: number; change: number; volume: number }> => {
    const { data } = await api.get(`/market/price/${symbol}`);
    return data;
  },

  /**
   * Get all current prices
   */
  getAllPrices: async (): Promise<MarketAsset[]> => {
    const { data } = await api.get<MarketAsset[]>('/market/prices');
    return data;
  },

  /**
   * Get historical data for chart
   */
  getHistoricalData: async (
    symbol: string, 
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1m', 
    limit: number = 100
  ): Promise<HistoricalData[]> => {
    const { data } = await api.get<HistoricalData[]>(`/market/history/${symbol}`, {
      params: { interval, limit },
    });
    return data;
  },

  /**
   * Get market summary
   */
  getMarketSummary: async (): Promise<MarketSummary> => {
    const { data } = await api.get<MarketSummary>('/market/summary');
    return data;
  },

  /**
   * Get market news
   */
  getMarketNews: async (): Promise<MarketNews[]> => {
    const { data } = await api.get<MarketNews[]>('/market/news');
    return data;
  },

  /**
   * Get market trends
   */
  getMarketTrends: async (): Promise<{
    trending: string[];
    volumeSpike: string[];
    newListings: string[];
  }> => {
    const { data } = await api.get('/market/trends');
    return data;
  },

  /**
   * Get asset details
   */
  getAssetDetails: async (symbol: string): Promise<MarketAsset & { 
    marketCap: number;
    volume24h: number;
    change24h: number;
    high24h: number;
    low24h: number;
  }> => {
    const { data } = await api.get(`/market/asset/${symbol}`);
    return data;
  },
};

export default marketService;