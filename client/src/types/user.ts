export interface User {
  id: number;
  email: string;
  fullname: string;
  role: "user" | "admin";
  accountLevel: "Basic" | "Pro" | "Vip";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: number;
  userId: number;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  bonusBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee';
  amount: number;
  balanceAfter: number;
  description: string;
  ip: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

//these to your existing user types

export interface UserStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
}

export interface UpdateProfileData {
  fullName?: string;
  email?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface VerifyEmailData {
  token: string;
}