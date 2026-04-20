import api from './api';

export interface WithdrawalData {
  amount: number;
  currency: string;
  walletAddress: string;
}

export interface WithdrawalResponse {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  walletAddress: string;
  fee: number;
  netAmount: number;
  transactionId?: string;
  transactionHash?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  rejectionReason?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalStats {
  totalWithdrawals: number;
  totalAmount: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  completedWithdrawals: number;
  rejectedWithdrawals: number;
}

export const withdrawalService = {
  /**
   * Request a withdrawal
   */
  requestWithdrawal: async (data: WithdrawalData): Promise<WithdrawalResponse> => {
    const response = await api.post<WithdrawalResponse>('/withdrawals', data);
    return response.data;
  },

  /**
   * Get user withdrawals
   */
  getWithdrawals: async (limit?: number, offset?: number): Promise<WithdrawalResponse[]> => {
    const { data } = await api.get<WithdrawalResponse[]>('/withdrawals', {
      params: { limit, offset },
    });
    return data;
  },

  /**
   * Get withdrawal by ID
   */
  getWithdrawalById: async (id: number): Promise<WithdrawalResponse> => {
    const { data } = await api.get<WithdrawalResponse>(`/withdrawals/${id}`);
    return data;
  },

  /**
   * Cancel pending withdrawal
   */
  cancelWithdrawal: async (id: number): Promise<{ message: string }> => {
    const { data } = await api.put<{ message: string }>(`/withdrawals/${id}/cancel`);
    return data;
  },

  /**
   * Get withdrawal statistics
   */
  getWithdrawalStats: async (): Promise<WithdrawalStats> => {
    const { data } = await api.get<WithdrawalStats>('/withdrawals/stats');
    return data;
  },

  /**
   * Get withdrawal fee
   */
  getWithdrawalFee: async (amount: number): Promise<{ fee: number; netAmount: number }> => {
    const { data } = await api.get('/withdrawals/fee', {
      params: { amount },
    });
    return data;
  },

  /**
   * Get withdrawal limits
   */
  getWithdrawalLimits: async (): Promise<{
    minWithdrawal: number;
    maxWithdrawal: number;
    dailyLimit: number;
    monthlyLimit: number;
  }> => {
    const { data } = await api.get('/withdrawals/limits');
    return data;
  },
};

export default withdrawalService;