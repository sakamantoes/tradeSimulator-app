import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { withdrawalService } from '@/services/withdrawal'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

const Withdrawals: React.FC = () => {
  const navigate = useNavigate()
  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => withdrawalService.getWithdrawals(),
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: 'badge-warning', text: 'Pending' },
      approved: { class: 'badge-info', text: 'Approved' },
      completed: { class: 'badge-success', text: 'Completed' },
      rejected: { class: 'badge-error', text: 'Rejected' },
      cancelled: { class: 'badge-secondary', text: 'Cancelled' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <span className={`badge ${config.class}`}>{config.text}</span>
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
        <h1 className="text-3xl font-bold">Withdrawal History</h1>
        <Button onClick={() => navigate({ to: '/withdraw' })}>
          Request Withdrawal
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Wallet Address</th>
                <th>Status</th>
                <th>Date</th>
                <th>Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((withdrawal, index) => (
                  <motion.tr
                    key={withdrawal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>#{withdrawal.id}</td>
                    <td className="font-medium">{formatCurrency(withdrawal.amount)}</td>
                    <td>{withdrawal.currency}</td>
                    <td className="text-sm font-mono">
                      {withdrawal.walletAddress?.slice(0, 10)}...
                    </td>
                    <td>{getStatusBadge(withdrawal.status)}</td>
                    <td>{formatDate(withdrawal.createdAt)}</td>
                    <td className="text-sm font-mono">
                      {withdrawal.transactionHash ? (
                        <span title={withdrawal.transactionHash}>
                          {withdrawal.transactionHash.slice(0, 10)}...
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">No withdrawals found</div>
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => navigate({ to: '/withdraw' })}
                    >
                      Request Your First Withdrawal
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Withdrawals