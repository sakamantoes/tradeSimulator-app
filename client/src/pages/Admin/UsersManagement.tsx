import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminService } from '@/services/admin';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/hooks/useToast';
import { User, Wallet } from '@/types/user';

interface UserWithWallet extends User {
  Wallet: Wallet;
}

const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    accountLevel: 'Basic',
    role: 'user',
    balance: 0,
  });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: users, isLoading } = useQuery<UserWithWallet[]>({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      adminService.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('User updated successfully', 'success');
      setIsEditModalOpen(false);
    },
    onError: () => {
      showToast('Failed to update user', 'error');
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, suspended }: { userId: number; suspended: boolean }) =>
      adminService.suspendUser(userId, suspended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('User status updated', 'success');
      setIsSuspendModalOpen(false);
    },
    onError: () => {
      showToast('Failed to update user status', 'error');
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user: UserWithWallet) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      accountLevel: user.accountLevel,
      role: user.role,
      balance: user.Wallet.balance,
    });
    setIsEditModalOpen(true);
  };

  const handleSuspendClick = (user: UserWithWallet) => {
    setSelectedUser(user);
    setIsSuspendModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        data: editForm,
      });
    }
  };

  const handleSuspendUser = () => {
    if (selectedUser) {
      suspendUserMutation.mutate({
        userId: selectedUser.id,
        suspended: true,
      });
    }
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-base-content/70 mt-1">
            Manage all registered users, view details, and modify accounts
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            className="input input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="secondary">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Account Level</th>
              <th>Balance</th>
              <th>Total Deposits</th>
              <th>Total Withdrawals</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-10">
                        <span>{user.fullName.charAt(0)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{user.fullName}</div>
                      <div className="text-sm opacity-50">{user.role}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${
                    user.accountLevel === 'VIP' ? 'badge-primary' :
                    user.accountLevel === 'Pro' ? 'badge-secondary' : 'badge-ghost'
                  }`}>
                    {user.accountLevel}
                  </span>
                </td>
                <td className="font-mono">${user.Wallet.balance.toFixed(2)}</td>
                <td className="font-mono text-green-500">
                  ${user.Wallet.totalDeposits.toFixed(2)}
                </td>
                <td className="font-mono text-red-500">
                  ${user.Wallet.totalWithdrawals.toFixed(2)}
                </td>
                <td>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</td>
                <td>
                  <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-xs btn-info"
                      onClick={() => handleEditClick(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleSuspendClick(user)}
                    >
                      Suspend
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input input-bordered"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            />
          </div>
          <div className="form-control">
            <label className="label">Email</label>
            <input
              type="email"
              className="input input-bordered"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
          <div className="form-control">
            <label className="label">Account Level</label>
            <select
              className="select select-bordered"
              value={editForm.accountLevel}
              onChange={(e) => setEditForm({ ...editForm, accountLevel: e.target.value })}
            >
              <option>Basic</option>
              <option>Pro</option>
              <option>VIP</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label">Role</label>
            <select
              className="select select-bordered"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label">Balance</label>
            <input
              type="number"
              className="input input-bordered"
              value={editForm.balance}
              onChange={(e) => setEditForm({ ...editForm, balance: parseFloat(e.target.value) })}
              step="0.01"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} isLoading={updateUserMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend User Modal */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title="Suspend User"
      >
        <div className="space-y-4">
          <p>Are you sure you want to suspend user <strong>{selectedUser?.fullName}</strong>?</p>
          <p className="text-sm text-warning">
            This will prevent the user from logging in and placing trades.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSuspendUser} isLoading={suspendUserMutation.isPending}>
              Suspend User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersManagement;