import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminService } from '@/services/admin';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/hooks/useToast';

interface Deposit {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  walletAddress: string;
  platformFee: number;
  companyFee: number;
  netAmount: number;
  confirmations: number;
  createdAt: string;
  User: {
    id: number;
    email: string;
    fullName: string;
  };
}

const DepositsManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: deposits, isLoading } = useQuery<Deposit[]>({
    queryKey: ['admin-deposits', statusFilter],
    queryFn: () => adminService.getDeposits(statusFilter),
  });

  const confirmDepositMutation = useMutation({
    mutationFn: (depositId: number) => adminService.confirmDeposit(depositId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      showToast('Deposit confirmed successfully', 'success');
      setIsDetailsModalOpen(false);
    },
    onError: () => {
      showToast('Failed to confirm deposit', 'error');
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: (depositId: number) => adminService.rejectDeposit(depositId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deposits'] });
      showToast('Deposit rejected', 'success');
      setIsDetailsModalOpen(false);
    },
    onError: () => {
      showToast('Failed to reject deposit', 'error');
    },
  });

  const stats = {
    total: deposits?.length || 0,
    pending: deposits?.filter(d => d.status === 'pending').length || 0,
    confirmed: deposits?.filter(d => d.status === 'confirmed').length || 0,
    totalAmount: deposits?.reduce((sum, d) => sum + d.amount, 0) || 0,
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
        <h1 className="text-3xl font-bold">Deposit Management</h1>
        <p className="text-base-content/70 mt-1">
          Monitor and manage all deposit transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Deposits</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-desc">All time</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Pending</div>
            <div className="stat-value text-warning">{stats.pending}</div>
            <div className="stat-desc">Awaiting confirmation</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Confirmed</div>
            <div className="stat-value text-success">{stats.confirmed}</div>
            <div className="stat-desc">Completed deposits</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="stat">
            <div className="stat-title">Total Volume</div>
            <div className="stat-value">${stats.totalAmount.toLocaleString()}</div>
            <div className="stat-desc">All deposits</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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
          className={`btn ${statusFilter === 'confirmed' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('confirmed')}
        >
          Confirmed
        </button>
        <button
          className={`btn ${statusFilter === 'failed' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('failed')}
        >
          Failed
        </button>
      </div>

      {/* Deposits Table */}
      <Card className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Net Amount</th>
              <th>Fees</th>
              <th>Status</th>
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
                    <div className="font-bold">{deposit.User.fullName}</div>
                    <div className="text-sm opacity-50">{deposit.User.email}</div>
                  </div>
                </td>
                <td className="font-mono text-green-500">
                  ${deposit.amount.toFixed(2)}
                </td>
                <td>{deposit.currency}</td>
                <td className="font-mono">
                  ${deposit.netAmount.toFixed(2)}
                </td>
                <td>
                  <div className="text-xs">
                    <div>Platform: ${deposit.platformFee.toFixed(2)}</div>
                    <div>Company: ${deposit.companyFee.toFixed(2)}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    deposit.status === 'confirmed' ? 'badge-success' :
                    deposit.status === 'pending' ? 'badge-warning' : 'badge-error'
                  }`}>
                    {deposit.status}
                  </span>
                  {deposit.confirmations > 0 && (
                    <div className="text-xs mt-1">
                      {deposit.confirmations}/6 confirmations
                    </div>
                  )}
                </td>
                <td>{format(new Date(deposit.createdAt), 'MMM dd, HH:mm')}</td>
                <td>
                  <button
                    className="btn btn-xs btn-info"
                    onClick={() => {
                      setSelectedDeposit(deposit);
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

      {/* Deposit Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Deposit Details"
      >
        {selectedDeposit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/70">Transaction ID</p>
                <p className="font-mono text-sm">{selectedDeposit.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Wallet Address</p>
                <p className="font-mono text-sm break-all">{selectedDeposit.walletAddress}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Amount</p>
                <p className="text-xl font-bold text-green-500">
                  ${selectedDeposit.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Net Amount</p>
                <p className="text-xl font-bold">${selectedDeposit.netAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Platform Fee (0.1%)</p>
                <p>${selectedDeposit.platformFee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Company Fee (1%)</p>
                <p>${selectedDeposit.companyFee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">Date</p>
                <p>{format(new Date(selectedDeposit.createdAt), 'PPPpp')}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/70">User</p>
                <p>{selectedDeposit.User.fullName} ({selectedDeposit.User.email})</p>
              </div>
            </div>

            {selectedDeposit.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="success"
                  onClick={() => confirmDepositMutation.mutate(selectedDeposit.id)}
                  isLoading={confirmDepositMutation.isPending}
                >
                  Confirm Deposit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => rejectDepositMutation.mutate(selectedDeposit.id)}
                  isLoading={rejectDepositMutation.isPending}
                >
                  Reject Deposit
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepositsManagement;