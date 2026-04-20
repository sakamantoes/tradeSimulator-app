import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'

interface Trade {
  id: number
  asset: string
  amount: number
  prediction: 'UP' | 'DOWN'
  result: 'win' | 'loss' | 'pending'
  profit: number
  createdAt: string
}

interface RecentTradesProps {
  trades: Trade[]
  limit?: number
  onViewAll?: () => void
}

export const RecentTrades: React.FC<RecentTradesProps> = ({
  trades,
  limit = 5,
  onViewAll,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'pending'>('all')

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true
    return trade.result === filter
  })

  const displayedTrades = filteredTrades.slice(0, limit)

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return (
          <div className="badge badge-success gap-1">
            <span>🏆</span> WIN
          </div>
        )
      case 'loss':
        return (
          <div className="badge badge-error gap-1">
            <span>💔</span> LOSS
          </div>
        )
      default:
        return (
          <div className="badge badge-warning gap-1">
            <span>⏳</span> PENDING
          </div>
        )
    }
  }

  const getPredictionBadge = (prediction: string) => {
    return prediction === 'UP' ? (
      <div className="badge badge-success badge-outline">UP 📈</div>
    ) : (
      <div className="badge badge-error badge-outline">DOWN 📉</div>
    )
  }

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getProfitColor = (profit: number): string => {
    if (profit > 0) return 'text-success'
    if (profit < 0) return 'text-error'
    return 'text-gray-500'
  }

  const formatProfit = (profit: number): string => {
    const formatted = formatAmount(Math.abs(profit))
    return profit > 0 ? `+${formatted}` : `-${formatted}`
  }

  if (trades.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No Trades Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start trading to see your history here
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-bold">Recent Trades</h3>
        
        <div className="flex gap-2">
          <div className="join">
            <button
              onClick={() => setFilter('all')}
              className={`join-item btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('win')}
              className={`join-item btn btn-sm ${filter === 'win' ? 'btn-success' : 'btn-ghost'}`}
            >
              Wins
            </button>
            <button
              onClick={() => setFilter('loss')}
              className={`join-item btn btn-sm ${filter === 'loss' ? 'btn-error' : 'btn-ghost'}`}
            >
              Losses
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`join-item btn btn-sm ${filter === 'pending' ? 'btn-warning' : 'btn-ghost'}`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="text-sm">
              <th>Asset</th>
              <th>Amount</th>
              <th>Prediction</th>
              <th>Result</th>
              <th>Profit/Loss</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {displayedTrades.map((trade, index) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-base-300 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                >
                  <td className="font-mono font-bold">{trade.asset}</td>
                  <td>${formatAmount(trade.amount)}</td>
                  <td>{getPredictionBadge(trade.prediction)}</td>
                  <td>{getResultBadge(trade.result)}</td>
                  <td className={`font-bold ${getProfitColor(trade.profit)}`}>
                    ${formatProfit(trade.profit)}
                  </td>
                  <td className="text-sm text-gray-500">
                    {format(new Date(trade.createdAt), 'HH:mm:ss')}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-xs">
                      {expandedId === trade.id ? '▲' : '▼'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Expanded trade details */}
      <AnimatePresence>
        {expandedId !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-base-300 rounded-lg"
          >
            {(() => {
              const trade = trades.find(t => t.id === expandedId)
              if (!trade) return null
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Trade ID</p>
                    <p className="font-mono text-xs">#{trade.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-bold">${formatAmount(trade.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prediction</p>
                    <p>{trade.prediction}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Result</p>
                    <p className="capitalize">{trade.result}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Profit/Loss</p>
                    <p className={`font-bold ${getProfitColor(trade.profit)}`}>
                      ${formatProfit(trade.profit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p>{format(new Date(trade.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time</p>
                    <p>{format(new Date(trade.createdAt), 'HH:mm:ss')}</p>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {filteredTrades.length > limit && onViewAll && (
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={onViewAll}>
            View All Trades ({filteredTrades.length})
          </Button>
        </div>
      )}

      {filteredTrades.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No {filter} trades found</p>
        </div>
      )}

      {/* Summary stats */}
      {filteredTrades.length > 0 && (
        <div className="mt-4 pt-4 border-t border-base-300">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Win Rate</p>
              <p className="text-lg font-bold text-success">
                {((trades.filter(t => t.result === 'win').length / trades.length) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Profit</p>
              <p className={`text-lg font-bold ${trades.reduce((sum, t) => sum + t.profit, 0) >= 0 ? 'text-success' : 'text-error'}`}>
                ${formatAmount(trades.reduce((sum, t) => sum + t.profit, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Trades</p>
              <p className="text-lg font-bold">{trades.length}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}