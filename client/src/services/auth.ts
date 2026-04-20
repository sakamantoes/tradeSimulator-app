import api from './api';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  PasswordChangeData,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData
} from '@/types/user';

export const authService = {
  /**
   * User login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  /**
   * User registration
   */
  register: async (userData: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  /**
   * User logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: VerifyEmailData): Promise<{ message: string }> => {
    const { data } = await api.get<{ message: string }>(`/auth/verify-email?token=${token}`);
    return data;
  },

  /**
   * Request password reset   
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', { 
      token, 
      newPassword 
    });
    return data;
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return data;
  },

  /**
   * Refresh JWT token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const { data } = await api.post<{ token: string }>('/auth/refresh-token');
    return data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (data: PasswordChangeData): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/users/change-password', data);
    return response.data;
  },
};

export default authService;