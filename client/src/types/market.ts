export interface MarketAsset {
  symbol: string;
  name: string;
  currentPrice: number;
  volatility: number;
  trend: number;
  volume: number;
  isActive: boolean;
}

export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: number;
}

export interface HistoricalData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSummary {
  totalAssets: number;
  totalVolume: number;
  avgVolatility: number;
  marketSentiment: 'BULLISH' | 'BEARISH';
  bullishCount: number;
  bearishCount: number;
  topGainers: Array<{ symbol: string; change: number }>;
  topLosers: Array<{ symbol: string; change: number }>;
}

// Add these to your existing market types

export interface MarketNews {
  id: number;
  title: string;
  summary: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}