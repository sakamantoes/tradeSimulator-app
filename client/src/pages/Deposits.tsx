import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { depositService } from '@/services/deposit'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card } from '@/components/UI/Card'
import { Button } from '@/components/UI/Button'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

const Deposits: React.FC = () => {
  const navigate = useNavigate()
  const { data: deposits, isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => depositService.getDeposits(),
  })

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
        <h1 className="text-3xl font-bold">Deposit History</h1>
        <Button onClick={() => navigate({ to: '/deposit' })}>
          Make New Deposit
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
                <th>Status</th>
                <th>Date</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {deposits && deposits.length > 0 ? (
                deposits.map((deposit, index) => (
                  <motion.tr
                    key={deposit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>#{deposit.id}</td>
                    <td className="font-medium">{formatCurrency(deposit.amount)}</td>
                    <td>{deposit.currency}</td>
                    <td>
                      <span
                        className={`badge ${
                          deposit.status === 'confirmed'
                            ? 'badge-success'
                            : deposit.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </td>
                    <td>{formatDate(deposit.createdAt)}</td>
                    <td className="text-sm font-mono">
                      {deposit.transactionId?.slice(0, 10)}...
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="text-gray-500">No deposits found</div>
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => navigate({ to: '/deposit' })}
                    >
                      Make Your First Deposit
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

export default Deposits