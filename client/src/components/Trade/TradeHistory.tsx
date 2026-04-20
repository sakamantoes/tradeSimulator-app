import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '@/types/trade';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Copy, 
  Check,
  Filter,
  Calendar,
  Download
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface TradeHistoryProps {
  trades: Trade[];
  isLoading?: boolean;
  onExport?: () => void;
}

type FilterType = 'all' | 'win' | 'loss' | 'open' | 'closed';
type SortType = 'newest' | 'oldest' | 'profit_high' | 'profit_low' | 'amount_high' | 'amount_low';

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  isLoading = false,
  onExport,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    if (filter === 'win') return trade.result === 'win';
    if (filter === 'loss') return trade.result === 'loss';
    if (filter === 'open') return trade.status === 'open';
    if (filter === 'closed') return trade.status === 'closed';
    return true;
  }).filter(trade => {
    if (dateRange.start) {
      const tradeDate = new Date(trade.createdAt);
      if (tradeDate < dateRange.start) return false;
    }
    if (dateRange.end) {
      const tradeDate = new Date(trade.createdAt);
      if (tradeDate > dateRange.end) return false;
    }
    return true;
  });

  // Sort trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'profit_high':
        return b.profit - a.profit;
      case 'profit_low':
        return a.profit - b.profit;
      case 'amount_high':
        return b.amount - a.amount;
      case 'amount_low':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const copyTradeId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTradeIcon = (prediction: string, result: string) => {
    if (result === 'win') {
      return <TrendingUp className="w-5 h-5 text-success" />;
    } else if (result === 'loss') {
      return <TrendingDown className="w-5 h-5 text-error" />;
    } else {
      return prediction === 'UP' ? 
        <TrendingUp className="w-5 h-5 text-warning" /> : 
        <TrendingDown className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: string, result: string) => {
    if (status === 'open') {
      return <span className="badge badge-warning badge-sm">Open</span>;
    }
    if (result === 'win') {
      return <span className="badge badge-success badge-sm">Win</span>;
    }
    if (result === 'loss') {
      return <span className="badge badge-error badge-sm">Loss</span>;
    }
    return <span className="badge badge-ghost badge-sm">Closed</span>;
  };

  const stats = {
    total: trades.length,
    wins: trades.filter(t => t.result === 'win').length,
    losses: trades.filter(t => t.result === 'loss').length,
    totalProfit: trades.reduce((sum, t) => sum + t.profit, 0),
    winRate: trades.length > 0 
      ? (trades.filter(t => t.result === 'win').length / trades.length) * 100 
      : 0,
  };

  if (isLoading) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="skeleton h-8 w-48 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-16 w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body p-0">
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title text-lg">Trade History</h3>
            <div className="flex gap-2">
              {onExport && (
                <button onClick={onExport} className="btn btn-ghost btn-sm gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-base-content/60">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.wins}</div>
              <div className="text-xs text-base-content/60">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error">{stats.losses}</div>
              <div className="text-xs text-base-content/60">Losses</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-success' : 'text-error'}`}>
                ${stats.totalProfit.toFixed(2)}
              </div>
              <div className="text-xs text-base-content/60">Total P/L</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'win', 'loss', 'open', 'closed'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="select select-sm select-bordered"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="profit_high">Highest Profit</option>
                <option value="profit_low">Lowest Profit</option>
                <option value="amount_high">Highest Amount</option>
                <option value="amount_low">Lowest Amount</option>
              </select>
              
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'date';
                  input.onchange = (e) => {
                    const date = new Date((e.target as HTMLInputElement).value);
                    setDateRange({ ...dateRange, start: date });
                  };
                  input.click();
                }}
                className="btn btn-sm btn-ghost"
              >
                <Calendar className="w-4 h-4" />
              </button>
              
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: null, end: null })}
                  className="btn btn-sm btn-ghost"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className="divide-y divide-base-300 max-h-96 overflow-y-auto">
          {sortedTrades.length === 0 ? (
            <div className="p-8 text-center text-base-content/60">
              <p>No trades found</p>
              <p className="text-sm mt-2">Start trading to see your history here</p>
            </div>
          ) : (
            sortedTrades.map((trade) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-base-300/50 transition-all duration-150 cursor-pointer"
                onClick={() => setSelectedTrade(trade === selectedTrade ? null : trade)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTradeIcon(trade.prediction, trade.result)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{trade.asset}</span>
                        {getStatusBadge(trade.status, trade.result)}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-bold">${trade.amount.toFixed(2)}</div>
                    {trade.result !== 'pending' && (
                      <div className={`text-sm font-medium ${trade.profit >= 0 ? 'text-success' : 'text-error'}`}>
                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedTrade === trade ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedTrade === trade && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-base-300"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-base-content/60">Trade ID</div>
                          <div className="flex items-center gap-2 font-mono">
                            #{trade.id}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyTradeId(trade.id);
                              }}
                              className="btn btn-xs btn-ghost"
                            >
                              {copiedId === trade.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Prediction</div>
                          <div className={`font-medium ${trade.prediction === 'UP' ? 'text-success' : 'text-error'}`}>
                            {trade.prediction}
                          </div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Open Price</div>
                          <div className="font-mono">${trade.openPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Close Price</div>
                          <div className="font-mono">
                            {trade.closePrice ? `$${trade.closePrice.toFixed(2)}` : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Duration</div>
                          <div>{trade.duration} minute{trade.duration !== 1 ? 's' : ''}</div>
                        </div>
                        <div>
                          <div className="text-base-content/60">Expires</div>
                          <div className="text-xs">
                            {format(new Date(trade.expiresAt), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                        {trade.result !== 'pending' && (
                          <>
                            <div>
                              <div className="text-base-content/60">Profit/Loss</div>
                              <div className={`font-bold ${trade.profit >= 0 ? 'text-success' : 'text-error'}`}>
                                {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-base-content/60">Return %</div>
                              <div className={trade.profit >= 0 ? 'text-success' : 'text-error'}>
                                {((trade.profit / trade.amount) * 100).toFixed(2)}%
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};