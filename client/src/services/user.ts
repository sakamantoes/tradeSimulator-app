import api from './api';
import { User, Wallet, Transaction, UserStats, UpdateProfileData } from '@/types/user';

export const userService = {
  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  /**
   * Get user wallet
   */
  getWallet: async (): Promise<Wallet> => {
    const { data } = await api.get<Wallet>('/users/wallet');
    return data;
  },

  /**
   * Get user transactions
   */
  getTransactions: async (limit?: number, offset?: number): Promise<Transaction[]> => {
    const { data } = await api.get<Transaction[]>('/users/transactions', {
      params: { limit, offset },
    });
    return data;
  },

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<UserStats> => {
    const { data } = await api.get<UserStats>('/users/stats');
    return data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData: UpdateProfileData): Promise<User> => {
    const { data } = await api.put<User>('/users/profile', profileData);
    return data;
  },

  /**
   * Request account deletion
   */
  requestAccountDeletion: async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/users/request-deletion');
    return data;
  },

  /**
   * Confirm account deletion
   */
  confirmAccountDeletion: async (token: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/users/confirm-deletion', { token });
    return data;
  },

  /**
   * Get user activity log
   */
  getActivityLog: async (limit?: number): Promise<any[]> => {
    const { data } = await api.get('/users/activity', {
      params: { limit },
    });
    return data;
  },

  /**
   * Get user referral info
   */
  getReferralInfo: async (): Promise<any> => {
    const { data } = await api.get('/users/referral');
    return data;
  },

  /**
   * Get user achievements
   */
  getAchievements: async (): Promise<any[]> => {
    const { data } = await api.get('/users/achievements');
    return data;
  },
};

export default userService;