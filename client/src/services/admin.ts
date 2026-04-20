import api from './api';
import { User, Wallet } from '@/types/user';
import { Trade } from '@/types/trade';
import { DepositResponse } from './deposit';
import { WithdrawalResponse } from './withdrawal';
import { MarketAsset } from '@/types/market';

export interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  totalVolume: number;
  platformRevenue: number;
  activeUsers: number;
  pendingWithdrawals: number;
  pendingDeposits: number;
}

export interface UserWithWallet extends User {
  Wallet: Wallet;
}

export interface AdminSettings {
  depositPlatformFee: number;
  depositCompanyFee: number;
  withdrawalFee: number;
  minWithdrawal: number;
  maxOpenTrades: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  winProbability?: number;
  marketVolatility?: number;
}

export const adminService = {
  // User Management
  /**
   * Get all users
   */
  getAllUsers: async (page?: number, limit?: number): Promise<UserWithWallet[]> => {
    const { data } = await api.get<UserWithWallet[]>('/admin/users', {
      params: { page, limit },
    });
    return data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: number): Promise<UserWithWallet> => {
    const { data } = await api.get<UserWithWallet>(`/admin/users/${userId}`);
    return data;
  },

  /**
   * Update user balance
   */
  updateUserBalance: async (userId: number, balance: number): Promise<Wallet> => {
    const { data } = await api.put<Wallet>(`/admin/users/${userId}/balance`, { balance });
    return data;
  },

  /**
   * Update user account level
   */
  updateUserLevel: async (userId: number, accountLevel: 'Basic' | 'Pro' | 'VIP'): Promise<User> => {
    const { data } = await api.put<User>(`/admin/users/${userId}/level`, { accountLevel });
    return data;
  },

  /**
   * Suspend user account
   */
  suspendUser: async (userId: number, reason: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/admin/users/${userId}/suspend`, { reason });
    return data;
  },

  /**
   * Activate user account
   */
  activateUser: async (userId: number): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(`/admin/users/${userId}/activate`);
    return data;
  },

  /**
   * Delete user account
   */
  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/admin/users/${userId}`);
    return data;
  },

  // Deposit Management
  /**
   * Get all deposits
   */
  getAllDeposits: async (status?: string, page?: number, limit?: number): Promise<DepositResponse[]> => {
    const { data } = await api.get<DepositResponse[]>('/admin/deposits', {
      params: { status, page, limit },
    });
    return data;
  },

  /**
   * Get pending deposits
   */
  getPendingDeposits: async (): Promise<DepositResponse[]> => {
    const { data } = await api.get<DepositResponse[]>('/admin/deposits/pending');
    return data;
  },

  /**
   * Confirm deposit manually
   */
  confirmDeposit: async (depositId: number): Promise<DepositResponse> => {
    const { data } = await api.put<DepositResponse>(`/admin/deposits/${depositId}/confirm`);
    return data;
  },

  /**
   * Reject deposit
   */
  rejectDeposit: async (depositId: number, reason: string): Promise<{ message: string }> => {
    const { data } = await api.put<{ message: string }>(`/admin/deposits/${depositId}/reject`, { reason });
    return data;
  },

  // Withdrawal Management
  /**
   * Get all withdrawals
   */
  getAllWithdrawals: async (status?: string, page?: number, limit?: number): Promise<WithdrawalResponse[]> => {
    const { data } = await api.get<WithdrawalResponse[]>('/admin/withdrawals', {
      params: { status, page, limit },
    });
    return data;
  },

  /**
   * Get pending withdrawals
   */
  getPendingWithdrawals: async (): Promise<WithdrawalResponse[]> => {
    const { data } = await api.get<WithdrawalResponse[]>('/admin/withdrawals/pending');
    return data;
  },

  /**
   * Approve withdrawal
   */
  approveWithdrawal: async (withdrawalId: number, transactionId?: string): Promise<WithdrawalResponse> => {
    const { data } = await api.put<WithdrawalResponse>(`/admin/withdrawals/${withdrawalId}/approve`, { transactionId });
    return data;
  },

  /**
   * Reject withdrawal
   */
  rejectWithdrawal: async (withdrawalId: number, reason: string): Promise<{ message: string }> => {
    const { data } = await api.put<{ message: string }>(`/admin/withdrawals/${withdrawalId}/reject`, { reason });
    return data;
  },

  /**
   * Mark withdrawal as completed
   */
  completeWithdrawal: async (withdrawalId: number, transactionHash: string): Promise<WithdrawalResponse> => {
    const { data } = await api.put<WithdrawalResponse>(`/admin/withdrawals/${withdrawalId}/complete`, { transactionHash });
    return data;
  },

  // Trade Management
  /**
   * Get all trades
   */
  getAllTrades: async (status?: string, page?: number, limit?: number): Promise<Trade[]> => {
    const { data } = await api.get<Trade[]>('/admin/trades', {
      params: { status, page, limit },
    });
    return data;
  },

  /**
   * Cancel trade
   */
  cancelTrade: async (tradeId: number, reason: string): Promise<{ message: string }> => {
    const { data } = await api.put<{ message: string }>(`/admin/trades/${tradeId}/cancel`, { reason });
    return data;
  },

  // Market Management
  /**
   * Create new market asset
   */
  createAsset: async (assetData: Partial<MarketAsset>): Promise<MarketAsset> => {
    const { data } = await api.post<MarketAsset>('/admin/assets', assetData);
    return data;
  },

  /**
   * Update market asset
   */
  updateAsset: async (symbol: string, assetData: Partial<MarketAsset>): Promise<MarketAsset> => {
    const { data } = await api.put<MarketAsset>(`/admin/assets/${symbol}`, assetData);
    return data;
  },

  /**
   * Delete asset
   */
  deleteAsset: async (symbol: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/admin/assets/${symbol}`);
    return data;
  },

  /**
   * Bulk update assets
   */
  bulkUpdateAssets: async (updates: Array<{ symbol: string; volatility?: number; trend?: number }>): Promise<MarketAsset[]> => {
    const { data } = await api.post<MarketAsset[]>('/admin/assets/bulk-update', { updates });
    return data;
  },

  /**
   * Set market volatility
   */
  setMarketVolatility: async (volatility: number): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/admin/market/volatility', { volatility });
    return data;
  },

  /**
   * Set market trend
   */
  setMarketTrend: async (trend: number): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/admin/market/trend', { trend });
    return data;
  },

  // Settings Management
  /**
   * Get admin settings
   */
  getSettings: async (): Promise<AdminSettings> => {
    const { data } = await api.get<AdminSettings>('/admin/settings');
    return data;
  },

  /**
   * Update admin settings
   */
  updateSettings: async (settings: Partial<AdminSettings>): Promise<AdminSettings> => {
    const { data } = await api.put<AdminSettings>('/admin/settings', settings);
    return data;
  },

  /**
   * Update withdrawal settings
   */
  updateWithdrawalSettings: async (settings: {
    minWithdrawal?: number;
    withdrawalFee?: number;
    autoApprove?: boolean;
  }): Promise<{ message: string }> => {
    const { data } = await api.put<{ message: string }>('/admin/settings/withdrawal', settings);
    return data;
  },

  // Statistics & Reports
  /**
   * Get admin dashboard stats
   */
  getDashboardStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/admin/stats');
    return data;
  },

  /**
   * Get platform earnings
   */
  getPlatformEarnings: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    total: number;
    deposits: number;
    withdrawals: number;
    fees: number;
    history: Array<{ date: string; amount: number }>;
  }> => {
    const { data } = await api.get('/admin/earnings', {
      params: { period },
    });
    return data;
  },

  /**
   * Get user registration stats
   */
  getUserStats: async (period: 'day' | 'week' | 'month' = 'week'): Promise<{
    total: number;
    active: number;
    newUsers: number;
    history: Array<{ date: string; count: number }>;
  }> => {
    const { data } = await api.get('/admin/stats/users', {
      params: { period },
    });
    return data;
  },

  /**
   * Export data
   */
  exportData: async (type: 'users' | 'trades' | 'deposits' | 'withdrawals', format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    const response = await api.get(`/admin/export/${type}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // System Management
  /**
   * Toggle maintenance mode
   */
  toggleMaintenance: async (enabled: boolean, message?: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/admin/system/maintenance', { enabled, message });
    return data;
  },

  /**
   * Broadcast announcement
   */
  broadcastAnnouncement: async (title: string, message: string, type: 'info' | 'warning' | 'success' | 'error'): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/admin/announcements', { title, message, type });
    return data;
  },

  /**
   * Get system logs
   */
  getSystemLogs: async (level?: string, limit?: number): Promise<any[]> => {
    const { data } = await api.get('/admin/logs', {
      params: { level, limit },
    });
    return data;
  },
};

export default adminService;