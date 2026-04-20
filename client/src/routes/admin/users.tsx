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

export const Route = createFileRoute('/admin/users')({
  component: UsersManagement,
})

interface User {
  id: number
  email: string
  fullName: string
  role: 'user' | 'admin'
  accountLevel: 'Basic' | 'Pro' | 'VIP'
  isVerified: boolean
  createdAt: string
  Wallet?: {
    balance: number
    totalDeposits: number
    totalWithdrawals: number
  }
}

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  accountLevel: z.enum(['Basic', 'Pro', 'VIP']).optional(),
  balance: z.number().min(0).optional(),
  isVerified: z.boolean().optional(),
})

type UpdateUserForm = z.infer<typeof updateUserSchema>

function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserForm }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated successfully')
      setIsModalOpen(false)
      setSelectedUser(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user')
    },
  })

  const suspendUserMutation = useMutation({
    mutationFn: (id: number) => adminService.suspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User suspended successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to suspend user')
    },
  })

  const activateUserMutation = useMutation({
    mutationFn: (id: number) => adminService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User activated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate user')
    },
  })

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  })

  const handleUpdateUser = (data: UpdateUserForm) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data })
    }
  }

  const filteredUsers = users?.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    verified: users?.filter(u => u.isVerified).length || 0,
    totalBalance: users?.reduce((sum, u) => sum + (u.Wallet?.balance || 0), 0) || 0,
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
        <h1 className="text-3xl font-bold">Users Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Admins</div>
            <div className="stat-value">{stats.admins}</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Verified Users</div>
            <div className="stat-value">{stats.verified}</div>
            <div className="stat-desc">{((stats.verified / stats.total) * 100).toFixed(1)}%</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Balance</div>
            <div className="stat-value">{formatCurrency(stats.totalBalance)}</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search users by name or email..."
          className="input input-bordered flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Role</th>
              <th>Account Level</th>
              <th>Balance</th>
              <th>Total Deposits</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>
                  <div>
                    <div className="font-bold">{user.fullName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    user.accountLevel === 'VIP' ? 'badge-warning' :
                    user.accountLevel === 'Pro' ? 'badge-info' :
                    'badge-ghost'
                  }`}>
                    {user.accountLevel}
                  </span>
                </td>
                <td className="font-bold">{formatCurrency(user.Wallet?.balance || 0)}</td>
                <td>{formatCurrency(user.Wallet?.totalDeposits || 0)}</td>
                <td>
                  <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setValue('role', user.role)
                        setValue('accountLevel', user.accountLevel)
                        setValue('isVerified', user.isVerified)
                        setValue('balance', user.Wallet?.balance)
                        setIsModalOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    {user.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm('Are you sure you want to suspend this user?')) {
                            suspendUserMutation.mutate(user.id)
                          }
                        }}
                        isLoading={suspendUserMutation.isPending}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        title="Edit User"
      >
        <form onSubmit={handleSubmit(handleUpdateUser)} className="space-y-4">
          <div>
            <label className="label">Role</label>
            <select
              {...register('role')}
              className="select select-bordered w-full"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="label">Account Level</label>
            <select
              {...register('accountLevel')}
              className="select select-bordered w-full"
            >
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div>
            <label className="label">Balance</label>
            <input
              type="number"
              step="0.01"
              {...register('balance', { valueAsNumber: true })}
              className="input input-bordered w-full"
            />
            {errors.balance && (
              <p className="text-red-500 text-sm mt-1">{errors.balance.message}</p>
            )}
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Email Verified</span>
              <input
                type="checkbox"
                {...register('isVerified')}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {selectedUser && (
            <div className="bg-base-300 p-3 rounded-lg">
              <p className="text-sm">
                <strong>User:</strong> {selectedUser.fullName} ({selectedUser.email})
              </p>
              <p className="text-sm">
                <strong>Current Balance:</strong> {formatCurrency(selectedUser.Wallet?.balance || 0)}
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
              isLoading={updateUserMutation.isPending}
            >
              Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}