import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { adminService } from '@/services/admin'
import { Button } from '@/components/UI/Button'
import { Card } from '@/components/UI/Card'
import { Modal } from '@/components/UI/Modal'
import { formatCurrency, formatDate, maskWalletAddress } from '@/utils/formatters'

export const Route = createFileRoute('/admin/withdrawals')({
  component: WithdrawalsManagement,
})

interface Withdrawal {
  id: number
  userId: number
  user?: {
    id: number
    email: string
    fullName: string
  }
  amount: number
  currency: string
  walletAddress: string
  fee: number
  netAmount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  transactionId: string
  transactionHash: string
  rejectionReason: string
  processedAt: string
  completedAt: string
  createdAt: string
}

const updateWithdrawalSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
  transactionHash: z.string().optional(),
  rejectionReason: z.string().optional(),
})

type UpdateWithdrawalForm = z.infer<typeof updateWithdrawalSchema>

function WithdrawalsManagement() {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all')
  const queryClient = useQueryClient()

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', filter],
    queryFn: () => adminService.getWithdrawals(filter),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWithdrawalForm }) =>
      adminService.updateWithdrawalStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      toast.success('Withdrawal status updated successfully')
      setIsModalOpen(false)
      setSelectedWithdrawal(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update withdrawal status')
    },
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UpdateWithdrawalForm>({
    resolver: zodResolver(updateWithdrawalSchema),
    defaultValues: {
      status: 'approved',
    },
  })

  const selectedStatus = watch('status')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'approved':
        return 'badge-info'
      case 'pending':
        return 'badge-warning'
      case 'rejected':
        return 'badge-error'
      case 'cancelled':
        return 'badge-ghost'
      default:
        return 'badge-ghost'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'approved':
        return 'Approved'
      case 'pending':
        return 'Pending'
      case 'rejected':
        return 'Rejected'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const handleUpdateStatus = (data: UpdateWithdrawalForm) => {
    if (selectedWithdrawal) {
      updateStatusMutation.mutate({ id: selectedWithdrawal.id, data })
    }
  }

  const stats = {
    total: withdrawals?.length || 0,
    pending: withdrawals?.filter(w => w.status === 'pending').length || 0,
    approved: withdrawals?.filter(w => w.status === 'approved').length || 0,
    completed: withdrawals?.filter(w => w.status === 'completed').length || 0,
    rejected: withdrawals?.filter(w => w.status === 'rejected').length || 0,
    totalAmount: withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
    totalFees: withdrawals?.reduce((sum, w) => sum + w.fee, 0) || 0,
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
        <h1 className="text-3xl font-bold">Withdrawals Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Withdrawals</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-desc">{formatCurrency(stats.totalAmount)}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Pending</div>
            <div className="stat-value text-warning">{stats.pending}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Approved</div>
            <div className="stat-value text-info">{stats.approved}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Completed</div>
            <div className="stat-value text-success">{stats.completed}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Rejected</div>
            <div className="stat-value text-error">{stats.rejected}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Fees</div>
            <div className="stat-value text-info">{formatCurrency(stats.totalFees)}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'primary' : 'secondary'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'approved' ? 'primary' : 'secondary'}
          onClick={() => setFilter('approved')}
        >
          Approved
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'secondary'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
        <Button
          variant={filter === 'rejected' ? 'primary' : 'secondary'}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </Button>
      </div>

      {/* Withdrawals Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Wallet Address</th>
              <th>Status</th>
              <th>Fee</th>
              <th>Net Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals?.map((withdrawal) => (
              <tr key={withdrawal.id}>
                <td>#{withdrawal.id}</td>
                <td>
                  <div>
                    <div className="font-bold">{withdrawal.user?.fullName}</div>
                    <div className="text-sm text-gray-500">{withdrawal.user?.email}</div>
                  </div>
                </td>
                <td className="font-bold">{formatCurrency(withdrawal.amount)}</td>
                <td>{withdrawal.currency}</td>
                <td>
                  <span className="text-sm font-mono">
                    {maskWalletAddress(withdrawal.walletAddress)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getStatusColor(withdrawal.status)}`}>
                    {getStatusText(withdrawal.status)}
                  </span>
                </td>
                <td className="text-error">-{formatCurrency(withdrawal.fee)}</td>
                <td className="font-bold text-success">{formatCurrency(withdrawal.netAmount)}</td>
                <td>{formatDate(withdrawal.createdAt)}</td>
                <td>
                  {withdrawal.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal)
                        setIsModalOpen(true)
                      }}
                    >
                      Process
                    </Button>
                  )}
                  {withdrawal.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal)
                        setIsModalOpen(true)
                      }}
                    >
                      Complete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Process Withdrawal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedWithdrawal(null)
        }}
        title={selectedWithdrawal?.status === 'pending' ? 'Process Withdrawal' : 'Complete Withdrawal'}
      >
        <form onSubmit={handleSubmit(handleUpdateStatus)} className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select
              {...register('status')}
              className="select select-bordered w-full"
            >
              {selectedWithdrawal?.status === 'pending' ? (
                <>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </>
              ) : (
                <option value="completed">Mark as Completed</option>
              )}
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          {selectedStatus === 'rejected' && (
            <div>
              <label className="label">Rejection Reason</label>
              <textarea
                {...register('rejectionReason')}
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Explain why this withdrawal is being rejected..."
              />
            </div>
          )}

          {selectedStatus === 'completed' && (
            <div>
              <label className="label">Transaction Hash</label>
              <input
                {...register('transactionHash')}
                className="input input-bordered w-full"
                placeholder="Blockchain transaction hash"
              />
            </div>
          )}

          {selectedWithdrawal && (
            <div className="bg-base-300 p-3 rounded-lg space-y-2">
              <p className="text-sm font-bold">Withdrawal Details:</p>
              <p className="text-sm">
                <strong>User:</strong> {selectedWithdrawal.user?.fullName} ({selectedWithdrawal.user?.email})
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
              </p>
              <p className="text-sm">
                <strong>Wallet Address:</strong> {selectedWithdrawal.walletAddress}
              </p>
              <p className="text-sm">
                <strong>Current Status:</strong> {getStatusText(selectedWithdrawal.status)}
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updateStatusMutation.isPending}
            >
              {selectedWithdrawal?.status === 'pending' ? 'Process' : 'Complete'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}