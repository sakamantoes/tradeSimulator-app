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
import { formatCurrency, formatDate } from '@/utils/formatters'

export const Route = createFileRoute('/admin/deposits')({
  component: DepositsManagement,
})

interface Deposit {
  id: number
  userId: number
  user?: {
    id: number
    email: string
    fullName: string
  }
  amount: number
  currency: string
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed'
  walletAddress: string
  platformFee: number
  companyFee: number
  netAmount: number
  confirmations: number
  createdAt: string
  updatedAt: string
}

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'failed']),
  transactionId: z.string().optional(),
})

type UpdateStatusForm = z.infer<typeof updateStatusSchema>

function DepositsManagement() {
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all')
  const queryClient = useQueryClient()

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['admin-deposits', filter],
    queryFn: () => adminService.getDeposits(filter),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStatusForm }) =>
      adminService.updateDepositStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] })
      toast.success('Deposit status updated successfully')
      setIsModalOpen(false)
      setSelectedDeposit(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update deposit status')
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateStatusForm>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: 'pending',
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'badge-success'
      case 'pending':
        return 'badge-warning'
      case 'failed':
        return 'badge-error'
      default:
        return 'badge-ghost'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  const handleUpdateStatus = (data: UpdateStatusForm) => {
    if (selectedDeposit) {
      updateStatusMutation.mutate({ id: selectedDeposit.id, data })
    }
  }

  const stats = {
    total: deposits?.length || 0,
    pending: deposits?.filter(d => d.status === 'pending').length || 0,
    confirmed: deposits?.filter(d => d.status === 'confirmed').length || 0,
    failed: deposits?.filter(d => d.status === 'failed').length || 0,
    totalAmount: deposits?.reduce((sum, d) => sum + d.amount, 0) || 0,
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
        <h1 className="text-3xl font-bold">Deposits Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Deposits</div>
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
            <div className="stat-title">Confirmed</div>
            <div className="stat-value text-success">{stats.confirmed}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Failed</div>
            <div className="stat-value text-error">{stats.failed}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Fees</div>
            <div className="stat-value text-info">
              {formatCurrency(deposits?.reduce((sum, d) => sum + d.platformFee + d.companyFee, 0) || 0)}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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
          variant={filter === 'confirmed' ? 'primary' : 'secondary'}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed
        </Button>
        <Button
          variant={filter === 'failed' ? 'primary' : 'secondary'}
          onClick={() => setFilter('failed')}
        >
          Failed
        </Button>
      </div>

      {/* Deposits Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Fees</th>
              <th>Net Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits?.map((deposit) => (
              <tr key={deposit.id}>
                <td>#{deposit.id}</td>
                <td>
                  <div>
                    <div className="font-bold">{deposit.user?.fullName}</div>
                    <div className="text-sm text-gray-500">{deposit.user?.email}</div>
                  </div>
                </td>
                <td className="font-bold">{formatCurrency(deposit.amount)}</td>
                <td>{deposit.currency}</td>
                <td>
                  <span className={`badge ${getStatusColor(deposit.status)}`}>
                    {getStatusText(deposit.status)}
                  </span>
                </td>
                <td>
                  <div className="text-sm">
                    <div>Platform: {formatCurrency(deposit.platformFee)}</div>
                    <div>Company: {formatCurrency(deposit.companyFee)}</div>
                  </div>
                </td>
                <td className="font-bold text-success">{formatCurrency(deposit.netAmount)}</td>
                <td>{formatDate(deposit.createdAt)}</td>
                <td>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDeposit(deposit)
                      setIsModalOpen(true)
                    }}
                  >
                    Update Status
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDeposit(null)
        }}
        title="Update Deposit Status"
      >
        <form onSubmit={handleSubmit(handleUpdateStatus)} className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select
              {...register('status')}
              className="select select-bordered w-full"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="label">Transaction ID (Optional)</label>
            <input
              {...register('transactionId')}
              className="input input-bordered w-full"
              placeholder="Blockchain transaction ID"
            />
          </div>

          {selectedDeposit && (
            <div className="bg-base-300 p-3 rounded-lg">
              <p className="text-sm">
                <strong>User:</strong> {selectedDeposit.user?.fullName} ({selectedDeposit.user?.email})
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> {formatCurrency(selectedDeposit.amount)}
              </p>
              <p className="text-sm">
                <strong>Current Status:</strong> {getStatusText(selectedDeposit.status)}
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
              Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}