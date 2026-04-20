import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { adminService } from '@/services/admin'
import { Button } from '@/components/UI/Button'
import { Card } from '@/components/UI/Card'
import { Modal } from '@/components/UI/Modal'
import { formatCurrency, formatDate } from '@/utils/formatters'

export const Route = createFileRoute('/admin/trades')({
  component: TradesManagement,
})

interface Trade {
  id: number
  userId: number
  user?: {
    id: number
    email: string
    fullName: string
  }
  asset: string
  amount: number
  prediction: 'UP' | 'DOWN'
  openPrice: number
  closePrice: number | null
  result: 'win' | 'loss' | 'pending'
  profit: number
  duration: number
  status: 'open' | 'closed' | 'cancelled'
  expiresAt: string
  createdAt: string
  updatedAt: string
}

function TradesManagement() {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'cancelled'>('all')
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'pending'>('all')
  const queryClient = useQueryClient()

  const { data: trades, isLoading } = useQuery({
    queryKey: ['admin-trades', filter, resultFilter],
    queryFn: () => adminService.getTrades(filter, resultFilter),
  })

  const cancelTradeMutation = useMutation({
    mutationFn: (id: number) => adminService.cancelTrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trades'] })
      toast.success('Trade cancelled successfully')
      setIsModalOpen(false)
      setSelectedTrade(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel trade')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'badge-success'
      case 'open':
        return 'badge-warning'
      case 'cancelled':
        return 'badge-error'
      default:
        return 'badge-ghost'
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'badge-success'
      case 'loss':
        return 'badge-error'
      case 'pending':
        return 'badge-warning'
      default:
        return 'badge-ghost'
    }
  }

  const stats = {
    total: trades?.length || 0,
    open: trades?.filter(t => t.status === 'open').length || 0,
    closed: trades?.filter(t => t.status === 'closed').length || 0,
    wins: trades?.filter(t => t.result === 'win').length || 0,
    losses: trades?.filter(t => t.result === 'loss').length || 0,
    totalVolume: trades?.reduce((sum, t) => sum + t.amount, 0) || 0,
    totalProfit: trades?.reduce((sum, t) => sum + (t.profit || 0), 0) || 0,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trades Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Trades</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Open Trades</div>
            <div className="stat-value text-warning">{stats.open}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Closed Trades</div>
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
            <div className="stat-title">Total Volume</div>
            <div className="stat-value text-info">{formatCurrency(stats.totalVolume)}</div>
            <div className="stat-desc">Profit: {formatCurrency(stats.totalProfit)}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All Status
          </Button>
          <Button
            variant={filter === 'open' ? 'primary' : 'secondary'}
            onClick={() => setFilter('open')}
          >
            Open
          </Button>
          <Button
            variant={filter === 'closed' ? 'primary' : 'secondary'}
            onClick={() => setFilter('closed')}
          >
            Closed
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'primary' : 'secondary'}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>
        <div className="divider lg:divider-horizontal"></div>
        <div className="flex gap-2">
          <Button
            variant={resultFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setResultFilter('all')}
          >
            All Results
          </Button>
          <Button
            variant={resultFilter === 'win' ? 'primary' : 'secondary'}
            onClick={() => setResultFilter('win')}
          >
            Wins
          </Button>
          <Button
            variant={resultFilter === 'loss' ? 'primary' : 'secondary'}
            onClick={() => setResultFilter('loss')}
          >
            Losses
          </Button>
          <Button
            variant={resultFilter === 'pending' ? 'primary' : 'secondary'}
            onClick={() => setResultFilter('pending')}
          >
            Pending
          </Button>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
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
              <th>Duration</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades?.map((trade) => (
              <tr key={trade.id}>
                <td>#{trade.id}</td>
                <td>
                  <div>
                    <div className="font-bold">{trade.user?.fullName}</div>
                    <div className="text-sm text-gray-500">{trade.user?.email}</div>
                  </div>
                </td>
                <td className="font-bold">{trade.asset}</td>
                <td>{formatCurrency(trade.amount)}</td>
                <td>
                  <span className={`badge ${trade.prediction === 'UP' ? 'badge-success' : 'badge-error'}`}>
                    {trade.prediction}
                  </span>
                </td>
                <td>${trade.openPrice.toFixed(2)}</td>
                <td>{trade.closePrice ? `$${trade.closePrice.toFixed(2)}` : '-'}</td>
                <td>
                  <span className={`badge ${getResultColor(trade.result)}`}>
                    {trade.result}
                  </span>
                </td>
                <td className={trade.profit >= 0 ? 'text-success' : 'text-error'}>
                  {trade.profit !== 0 ? formatCurrency(trade.profit) : '-'}
                </td>
                <td>
                  <span className={`badge ${getStatusColor(trade.status)}`}>
                    {trade.status}
                  </span>
                </td>
                <td>{trade.duration} min</td>
                <td>{formatDate(trade.createdAt)}</td>
                <td>
                  {trade.status === 'open' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setSelectedTrade(trade)
                        setIsModalOpen(true)
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Trade Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTrade(null)
        }}
        title="Cancel Trade"
      >
        {selectedTrade && (
          <div className="space-y-4">
            <div className="bg-base-300 p-4 rounded-lg space-y-2">
              <p className="font-bold">Are you sure you want to cancel this trade?</p>
              <p className="text-sm">
                <strong>User:</strong> {selectedTrade.user?.fullName} ({selectedTrade.user?.email})
              </p>
              <p className="text-sm">
                <strong>Asset:</strong> {selectedTrade.asset}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> {formatCurrency(selectedTrade.amount)}
              </p>
              <p className="text-sm">
                <strong>Prediction:</strong> {selectedTrade.prediction}
              </p>
              <p className="text-sm">
                <strong>Created:</strong> {formatDate(selectedTrade.createdAt)}
              </p>
              <p className="text-warning text-sm mt-2">
                This action will refund the trade amount to the user's balance.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Keep Trade
              </Button>
              <Button
                variant="danger"
                onClick={() => cancelTradeMutation.mutate(selectedTrade.id)}
                isLoading={cancelTradeMutation.isPending}
              >
                Cancel Trade
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}