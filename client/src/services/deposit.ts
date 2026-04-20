import api from './api';

export interface DepositData {
  amount: number;
  currency: string;
}

export interface DepositResponse {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  transactionId: string;
  walletAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
  platformFee: number;
  companyFee: number;
  netAmount: number;
  confirmations: number;
  createdAt: string;
  updatedAt: string;
  payment?: {
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
    payment_id: string;
    qr_code?: string;
  };
}

export interface DepositStats {
  totalDeposits: number;
  totalAmount: number;
  pendingDeposits: number;
  confirmedDeposits: number;
  failedDeposits: number;
}

export const depositService = {
  /**
   * Create a new deposit request
   */
  createDeposit: async (data: DepositData): Promise<DepositResponse> => {
    const response = await api.post<DepositResponse>('/deposits', data);
    return response.data;
  },

  /**
   * Get all user deposits
   */
  getDeposits: async (limit?: number, offset?: number): Promise<DepositResponse[]> => {
    const { data } = await api.get<DepositResponse[]>('/deposits', {
      params: { limit, offset },
    });
    return data;
  },

  /**
   * Get deposit by ID
   */
  getDepositById: async (id: number): Promise<DepositResponse> => {
    const { data } = await api.get<DepositResponse>(`/deposits/${id}`);
    return data;
  },

  /**
   * Get deposit status
   */
  getDepositStatus: async (id: number): Promise<DepositResponse> => {
    const { data } = await api.get<DepositResponse>(`/deposits/${id}/status`);
    return data;
  },

  /**
   * Get deposit statistics
   */
  getDepositStats: async (): Promise<DepositStats> => {
    const { data } = await api.get<DepositStats>('/deposits/stats');
    return data;
  },

  /**
   * Get supported cryptocurrencies
   */
  getSupportedCurrencies: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>('/deposits/currencies');
    return data;
  },

  /**
   * Get deposit fee information
   */
  getDepositFees: async (amount: number): Promise<{
    amount: number;
    platformFee: number;
    companyFee: number;
    netAmount: number;
  }> => {
    const { data } = await api.get('/deposits/fees', {
      params: { amount },
    });
    return data;
  },
};

export default depositService;