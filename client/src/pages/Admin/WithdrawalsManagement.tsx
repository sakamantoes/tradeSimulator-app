import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminService } from '@/services/admin';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/hooks/useToast';

interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  walletAddress: string;
  fee: number;
  netAmount: number;
  transactionId: string;
  transactionHash: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  rejectionReason: string | null;
  processedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  User: {
    id: number;
    email: string;
    fullName: string;
    Wallet: {
      balance: number;
    };
  };
}

const WithdrawalsManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: () => adminService.getWithdrawals(statusFilter),
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: (withdrawalId: number) => adminService.approveWithdrawal(withdrawalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      showToast('Withdrawal approved successfully', 'success');
      setIsDetailsModalOpen(false);
    },
    onError: () => {
      showToast('Failed to approve withdrawal', 'error');
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({ withdrawalId, reason }: { withdrawalId: number; reason: string }) =>
      adminService.rejectWithdrawal(withdrawalId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      showToast('Withdrawal rejected', 'success');
      setIsDetailsModalOpen(false);
      setRejectionReason('');
    },
    onError: () => {
      showToast('Failed to reject withdrawal', 'error');
    },
  });

  const completeWithdrawalMutation = useMutation({
    mutationFn: ({ withdrawalId, hash }: { withdrawalId: number; hash: string }) =>
      adminService.completeWithdrawal(withdrawalId, hash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      showToast('Withdrawal marked as completed', 'success');
      setIsDetailsModalOpen(false);
      setTransactionHash('');
    },
    onError: () => {
      showToast('Failed to complete withdrawal', 'error');
    },
  });

  const stats = {
    total: withdrawals?.length || 0,
    pending: withdrawals?.filter(w => w.status === 'pending').length || 0,
    approved: withdrawals?.filter(w => w.status === 'approved').length || 0,
    completed: withdrawals?.filter(w => w.status === 'completed').length || 0,
    totalAmount: withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
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
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
        <p className="text-base-content/70 mt-1">
          Process and monitor all withdrawal requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Requests</div>
            <div className="stat-value">{stats.total}</div>
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
            <div className="stat-title">Total Volume</div>
            <div className="stat-value">${stats.totalAmount.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
        <button
          className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`btn ${statusFilter === 'approved' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('approved')}
        >
          Approved
        </button>
        <button
          className={`btn ${statusFilter === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`btn ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {/* Withdrawals Table */}
      <Card className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Net Amount</th>
              <th>Fee</th>
              <th>Status</th>
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
                    <div className="font-bold">{withdrawal.User.fullName}</div>
                    <div className="text-sm opacity-50">{withdrawal.User.email}</div>
                  </div>
                </td>
                <td className="font-mono text-red-500">
                  ${withdrawal.amount.toFixed(2)}
                </td>
                <td>{withdrawal.currency}</td>
                <td className="font-mono">
                  ${withdrawal.netAmount.toFixed(2)}
                </td>
                <td className="text-sm">
                  ${withdrawal.fee.toFixed(2)}
                </td>
                <td>
                  <span className={`badge ${
                    withdrawal.status === 'completed' ? 'badge-success' :
                    withdrawal.status === 'approved' ? 'badge-info' :
                    withdrawal.status === 'pending' ? 'badge-warning' :
                    withdrawal.status === 'rejected' ? 'badge-error' : 'badge-ghost'
                  }`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td>{format(new Date(withdrawal.createdAt), 'MMM dd, HH:mm')}</td>
                <td>
                  <button
                    className="btn btn-xs btn-info"
                    onClick={() => {
                      setSelectedWithdrawal(withdrawal);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    Process
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Withdrawal Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Process Withdrawal"
        size="lg"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/70">Request ID</p>
                <p className="font-mono">#{selectedWithdrawal.id}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">User</p>
                <p>{selectedWithdrawal.User.fullName}</p>
                <p className="text-sm">{selectedWithdrawal.User.email}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Amount</p>
                <p className="text-xl font-bold text-red-500">
                  ${selectedWithdrawal.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Net Amount (after fee)</p>
                <p className="text-xl font-bold">${selectedWithdrawal.netAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Wallet Address</p>
                <p className="font-mono text-sm break-all">{selectedWithdrawal.walletAddress}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">User Balance</p>
                <p className="font-bold">${selectedWithdrawal.User.Wallet.balance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Requested</p>
                <p>{format(new Date(selectedWithdrawal.createdAt), 'PPPpp')}</p>
              </div>
              {selectedWithdrawal.processedAt && (
                <div>
                  <p className="text-sm text-base-content/70">Processed</p>
                  <p>{format(new Date(selectedWithdrawal.processedAt), 'PPPpp')}</p>
                </div>
              )}
            </div>

            {selectedWithdrawal.status === 'pending' && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-2">Approve Withdrawal</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      onClick={() => approveWithdrawalMutation.mutate(selectedWithdrawal.id)}
                      isLoading={approveWithdrawalMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          rejectWithdrawalMutation.mutate({
                            withdrawalId: selectedWithdrawal.id,
                            reason,
                          });
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedWithdrawal.status === 'approved' && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-2">Complete Withdrawal</h4>
                  <div className="form-control">
                    <label className="label">Transaction Hash</label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Enter blockchain transaction hash"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="success"
                      onClick={() => completeWithdrawalMutation.mutate({
                        withdrawalId: selectedWithdrawal.id,
                        hash: transactionHash,
                      })}
                      isLoading={completeWithdrawalMutation.isPending}
                      disabled={!transactionHash}
                    >
                      Mark as Completed
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedWithdrawal.status === 'rejected' && selectedWithdrawal.rejectionReason && (
              <div className="border-t pt-4">
                <h4 className="font-bold mb-2 text-error">Rejection Reason</h4>
                <p className="text-sm">{selectedWithdrawal.rejectionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WithdrawalsManagement;