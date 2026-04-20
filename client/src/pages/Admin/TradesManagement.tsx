import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminService } from '@/services/admin';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/hooks/useToast';

interface Trade {
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
  User: {
    id: number;
    email: string;
    fullName: string;
  };
}

const TradesManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'cancelled'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'pending'>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ['admin-trades', statusFilter, resultFilter, assetFilter],
    queryFn: () => adminService.getTrades(statusFilter, resultFilter, assetFilter),
  });

  const cancelTradeMutation = useMutation({
    mutationFn: (tradeId: number) => adminService.cancelTrade(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trades'] });
      showToast('Trade cancelled successfully', 'success');
      setIsDetailsModalOpen(false);
    },
    onError: () => {
      showToast('Failed to cancel trade', 'error');
    },
  });

  const stats = {
    total: trades?.length || 0,
    open: trades?.filter(t => t.status === 'open').length || 0,
    closed: trades?.filter(t => t.status === 'closed').length || 0,
    wins: trades?.filter(t => t.result === 'win').length || 0,
    losses: trades?.filter(t => t.result === 'loss').length || 0,
    totalVolume: trades?.reduce((sum, t) => sum + t.amount, 0) || 0,
    totalProfit: trades?.reduce((sum, t) => sum + (t.profit > 0 ? t.profit : 0), 0) || 0,
  };

  const winRate = stats.total > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(2) : '0';

  const assets = [...new Set(trades?.map(t => t.asset) || [])];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Trade Management</h1>
        <p className="text-base-content/70 mt-1">
          Monitor and manage all trading activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Trades</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Open</div>
            <div className="stat-value text-warning">{stats.open}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Closed</div>
            <div className="stat-value">{stats.closed}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Wins</div>
            <div className="stat-value text-success">{stats.wins}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Losses</div>
            <div className="stat-value text-error">{stats.losses}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Win Rate</div>
            <div className="stat-value">{winRate}%</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Volume</div>
            <div className="stat-value">${stats.totalVolume.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          className="select select-bordered select-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="select select-bordered select-sm"
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value as any)}
        >
          <option value="all">All Results</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
          <option value="pending">Pending</option>
        </select>

        <select
          className="select select-bordered select-sm"
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
        >
          <option value="all">All Assets</option>
          {assets.map(asset => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
      </div>

      {/* Trades Table */}
      <Card className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Asset</th>
              <th>Amount</th>
              <th>Prediction</th>
              <th>Open Price</th>
              <th>Close Price</th>
              <th>Result</th>
              <th>Profit/Loss</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades?.map((trade) => (
              <tr key={trade.id}>
                <td>#{trade.id}</td>
                <td>
                  <div>
                    <div className="font-bold">{trade.User.fullName}</div>
                    <div className="text-sm opacity-50">{trade.User.email}</div>
                  </div>
                </td>
                <td className="font-mono">{trade.asset}</td>
                <td className="font-mono">${trade.amount.toFixed(2)}</td>
                <td>
                  <span className={`badge ${trade.prediction === 'UP' ? 'badge-success' : 'badge-error'}`}>
                    {trade.prediction}
                  </span>
                </td>
                <td className="font-mono">${trade.openPrice.toFixed(2)}</td>
                <td className="font-mono">
                  {trade.closePrice ? `$${trade.closePrice.toFixed(2)}` : '-'}
                </td>
                <td>
                  {trade.result !== 'pending' && (
                    <span className={`badge ${
                      trade.result === 'win' ? 'badge-success' : 'badge-error'
                    }`}>
                      {trade.result}
                    </span>
                  )}
                </td>
                <td className={`font-mono ${
                  trade.profit > 0 ? 'text-success' : trade.profit < 0 ? 'text-error' : ''
                }`}>
                  {trade.profit !== 0 ? `$${Math.abs(trade.profit).toFixed(2)}` : '-'}
                </td>
                <td>
                  <span className={`badge ${
                    trade.status === 'open' ? 'badge-warning' :
                    trade.status === 'closed' ? 'badge-success' : 'badge-ghost'
                  }`}>
                    {trade.status}
                  </span>
                </td>
                <td>{format(new Date(trade.createdAt), 'MMM dd, HH:mm')}</td>
                <td>
                  <button
                    className="btn btn-xs btn-info"
                    onClick={() => {
                      setSelectedTrade(trade);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Trade Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Trade Details"
        size="lg"
      >
        {selectedTrade && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/70">Trade ID</p>
                <p className="font-mono">#{selectedTrade.id}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">User</p>
                <p>{selectedTrade.User.fullName}</p>
                <p className="text-sm">{selectedTrade.User.email}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Asset</p>
                <p className="font-bold">{selectedTrade.asset}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Amount</p>
                <p className="font-bold">${selectedTrade.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Prediction</p>
                <span className={`badge ${selectedTrade.prediction === 'UP' ? 'badge-success' : 'badge-error'}`}>
                  {selectedTrade.prediction}
                </span>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Duration</p>
                <p>{selectedTrade.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Open Price</p>
                <p className="font-mono">${selectedTrade.openPrice.toFixed(2)}</p>
              </div>
              {selectedTrade.closePrice && (
                <div>
                  <p className="text-sm text-base-content/70">Close Price</p>
                  <p className="font-mono">${selectedTrade.closePrice.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-base-content/70">Status</p>
                <span className={`badge ${
                  selectedTrade.status === 'open' ? 'badge-warning' :
                  selectedTrade.status === 'closed' ? 'badge-success' : 'badge-ghost'
                }`}>
                  {selectedTrade.status}
                </span>
              </div>
              {selectedTrade.result !== 'pending' && (
                <div>
                  <p className="text-sm text-base-content/70">Result</p>
                  <span className={`badge ${
                    selectedTrade.result === 'win' ? 'badge-success' : 'badge-error'
                  }`}>
                    {selectedTrade.result}
                  </span>
                </div>
              )}
              {selectedTrade.profit !== 0 && (
                <div>
                  <p className="text-sm text-base-content/70">Profit/Loss</p>
                  <p className={`font-bold ${
                    selectedTrade.profit > 0 ? 'text-success' : 'text-error'
                  }`}>
                    {selectedTrade.profit > 0 ? '+' : ''}${selectedTrade.profit.toFixed(2)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-base-content/70">Opened At</p>
                <p>{format(new Date(selectedTrade.createdAt), 'PPPpp')}</p>
              </div>
              {selectedTrade.expiresAt && (
                <div>
                  <p className="text-sm text-base-content/70">Expires At</p>
                  <p>{format(new Date(selectedTrade.expiresAt), 'PPPpp')}</p>
                </div>
              )}
            </div>

            {selectedTrade.status === 'open' && (
              <div className="border-t pt-4">
                <Button
                  variant="danger"
                  onClick={() => cancelTradeMutation.mutate(selectedTrade.id)}
                  isLoading={cancelTradeMutation.isPending}
                >
                  Cancel Trade
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TradesManagement;