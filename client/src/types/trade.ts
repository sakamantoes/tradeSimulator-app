export interface Trade  {
  id: number;
  userId: number;
  asset: string;
  amount: number;
  prediction: 'UP' | 'DOWN';
  openPrice: number;
  closePrice: number | null;
  result: 'win' | 'loss' | 'pending';
  profit: number;
  duration: number;
  status: 'open' | 'closed' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenTradeData {
  asset: string;
  amount: number;
  prediction: 'UP' | 'DOWN';
  duration: number;
}


export interface CloseTradeData {
  tradeId: number;
} 


export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
}

export interface Trade {
  id: number;
  userId: number;
  asset: string;
  amount: number;
  prediction: 'UP' | 'DOWN';
  openPrice: number;
  closePrice: number | null;
  result: 'win' | 'loss' | 'pending';
  profit: number;
  duration: number;
  status: 'open' | 'closed' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpenTradeData {
  asset: string;
  amount: number;
  prediction: 'UP' | 'DOWN';
  duration: number;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  avgProfit: number;
  bestTrade: number;
  worstTrade: number;
  currentExposure: number;
}

export interface TradeFilters {
  asset: string;
  result: string;
  startDate: Date | null;
  endDate: Date | null;
  limit: number;
  offset: number;
}