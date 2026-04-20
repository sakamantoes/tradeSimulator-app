import { z } from 'zod'
import { 
  TRADE_CONFIG, 
  TRANSACTION_LIMITS, 
  CRYPTO_CURRENCIES, 
  TRADING_ASSETS 
} from './ constants'

// Email Validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')

// Password Validation
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, 'Password contains invalid characters')

// Full Name Validation
export const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(50, 'Full name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces')

// Trade Amount Validation
export const tradeAmountSchema = z
  .number()
  .min(TRADE_CONFIG.MIN_AMOUNT, `Minimum trade amount is $${TRADE_CONFIG.MIN_AMOUNT}`)
  .max(TRADE_CONFIG.MAX_AMOUNT, `Maximum trade amount is $${TRADE_CONFIG.MAX_AMOUNT}`)

// Trade Duration Validation
export const tradeDurationSchema = z
  .number()
  .int('Duration must be a whole number')
  .min(TRADE_CONFIG.MIN_DURATION, `Minimum duration is ${TRADE_CONFIG.MIN_DURATION} minute`)
  .max(TRADE_CONFIG.MAX_DURATION, `Maximum duration is ${TRADE_CONFIG.MAX_DURATION} minutes`)

// Trade Prediction Validation
export const tradePredictionSchema = z.enum(['UP', 'DOWN'], {
  errorMap: () => ({ message: 'Prediction must be UP or DOWN' }),
})

// Trade Asset Validation
export const tradeAssetSchema = z.enum(
  TRADING_ASSETS.map(asset => asset.symbol) as [string, ...string[]],
  {
    errorMap: () => ({ message: 'Invalid trading asset' }),
  }
)

// Complete Trade Schema
export const tradeSchema = z.object({
  asset: tradeAssetSchema,
  amount: tradeAmountSchema,
  prediction: tradePredictionSchema,
  duration: tradeDurationSchema,
})

// Deposit Validation
export const depositSchema = z.object({
  amount: z
    .number()
    .min(TRANSACTION_LIMITS.MIN_DEPOSIT, `Minimum deposit is $${TRANSACTION_LIMITS.MIN_DEPOSIT}`)
    .max(TRANSACTION_LIMITS.MAX_DEPOSIT, `Maximum deposit is $${TRANSACTION_LIMITS.MAX_DEPOSIT}`),
  currency: z.enum(
    CRYPTO_CURRENCIES.map(c => c.code) as [string, ...string[]],
    {
      errorMap: () => ({ message: 'Invalid cryptocurrency' }),
    }
  ),
})

// Withdrawal Validation
export const withdrawalSchema = z.object({
  amount: z
    .number()
    .min(TRANSACTION_LIMITS.MIN_WITHDRAWAL, `Minimum withdrawal is $${TRANSACTION_LIMITS.MIN_WITHDRAWAL}`)
    .max(TRANSACTION_LIMITS.MAX_WITHDRAWAL, `Maximum withdrawal is $${TRANSACTION_LIMITS.MAX_WITHDRAWAL}`),
  currency: z.enum(
    CRYPTO_CURRENCIES.map(c => c.code) as [string, ...string[]],
    {
      errorMap: () => ({ message: 'Invalid cryptocurrency' }),
    }
  ),
  walletAddress: z
    .string()
    .min(26, 'Wallet address is too short')
    .max(62, 'Wallet address is too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Wallet address contains invalid characters'),
})

// Wallet Address Validation by Currency
export const validateWalletAddress = (address: string, currency: string): boolean => {
  const patterns: Record<string, RegExp> = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDT: /^(0x[a-fA-F0-9]{40}|[T][a-zA-Z0-9]{33})$/,
    BUSD: /^0x[a-fA-F0-9]{40}$/,
    USDC: /^0x[a-fA-F0-9]{40}$/,
  }

  const pattern = patterns[currency]
  return pattern ? pattern.test(address) : /^[a-zA-Z0-9]{26,62}$/.test(address)
}

// Login Validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Registration Validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Password Change Validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
})

// Profile Update Validation
export const profileUpdateSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: emailSchema.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be updated",
})

// Forgot Password Validation
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// Reset Password Validation
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
})

// Admin Settings Validation
export const adminSettingsSchema = z.object({
  depositPlatformFee: z.number().min(0).max(10).optional(),
  depositCompanyFee: z.number().min(0).max(10).optional(),
  withdrawalFee: z.number().min(0).max(10).optional(),
  minDeposit: z.number().min(1).optional(),
  maxDeposit: z.number().min(1).optional(),
  minWithdrawal: z.number().min(1).optional(),
  maxWithdrawal: z.number().min(1).optional(),
  maxOpenTrades: z.number().int().min(1).optional(),
  maintenanceMode: z.boolean().optional(),
})

// Market Asset Validation
export const marketAssetSchema = z.object({
  symbol: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Symbol must be uppercase letters'),
  name: z.string().min(2).max(50).optional(),
  currentPrice: z.number().positive().optional(),
  volatility: z.number().min(0).max(0.5).optional(),
  trend: z.number().min(-0.1).max(0.1).optional(),
  volume: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

// Date Range Validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Start date must be before end date",
  path: ["startDate"],
})

// Pagination Validation
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

// Validation Helper Functions
export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success
}

export const isValidPassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success
}

export const isValidAmount = (amount: number, min?: number, max?: number): boolean => {
  const minAmount = min ?? TRANSACTION_LIMITS.MIN_DEPOSIT
  const maxAmount = max ?? TRANSACTION_LIMITS.MAX_DEPOSIT
  return amount >= minAmount && amount <= maxAmount
}

export const isValidTradeAmount = (amount: number): boolean => {
  return amount >= TRADE_CONFIG.MIN_AMOUNT && amount <= TRADE_CONFIG.MAX_AMOUNT
}

export const isValidTradeDuration = (duration: number): boolean => {
  return duration >= TRADE_CONFIG.MIN_DURATION && duration <= TRADE_CONFIG.MAX_DURATION
}

export const isValidAsset = (asset: string): boolean => {
  return TRADING_ASSETS.some(a => a.symbol === asset)
}

export const isValidCurrency = (currency: string): boolean => {
  return CRYPTO_CURRENCIES.some(c => c.code === currency)
}

// Custom Validation Function
export const validateWithdrawalLimit = (
  amount: number, 
  dailyWithdrawn: number, 
  dailyLimit: number
): { valid: boolean; message?: string } => {
  if (amount > dailyLimit) {
    return { valid: false, message: `Maximum withdrawal per day is $${dailyLimit}` }
  }
  if (dailyWithdrawn + amount > dailyLimit) {
    const remaining = dailyLimit - dailyWithdrawn
    return { valid: false, message: `You can only withdraw $${remaining} more today` }
  }
  return { valid: true }
}

// Check if user can open new trade
export const canOpenTrade = (
  openTradesCount: number, 
  maxOpenTrades: number
): { valid: boolean; message?: string } => {
  if (openTradesCount >= maxOpenTrades) {
    return { valid: false, message: `Maximum ${maxOpenTrades} open trades allowed` }
  }
  return { valid: true }
}

// Check if user can deposit
export const canDeposit = (
  amount: number
): { valid: boolean; message?: string } => {
  if (amount < TRANSACTION_LIMITS.MIN_DEPOSIT) {
    return { valid: false, message: `Minimum deposit is $${TRANSACTION_LIMITS.MIN_DEPOSIT}` }
  }
  if (amount > TRANSACTION_LIMITS.MAX_DEPOSIT) {
    return { valid: false, message: `Maximum deposit is $${TRANSACTION_LIMITS.MAX_DEPOSIT}` }
  }
  return { valid: true }
}

// Check if user can withdraw
export const canWithdraw = (
  amount: number,
  balance: number,
  dailyWithdrawn: number,
  dailyLimit: number
): { valid: boolean; message?: string } => {
  if (amount > balance) {
    return { valid: false, message: 'Insufficient balance' }
  }
  if (amount < TRANSACTION_LIMITS.MIN_WITHDRAWAL) {
    return { valid: false, message: `Minimum withdrawal is $${TRANSACTION_LIMITS.MIN_WITHDRAWAL}` }
  }
  if (amount > TRANSACTION_LIMITS.MAX_WITHDRAWAL) {
    return { valid: false, message: `Maximum withdrawal is $${TRANSACTION_LIMITS.MAX_WITHDRAWAL}` }
  }
  if (amount > dailyLimit) {
    return { valid: false, message: `Maximum withdrawal per day is $${dailyLimit}` }
  }
  if (dailyWithdrawn + amount > dailyLimit) {
    const remaining = dailyLimit - dailyWithdrawn
    return { valid: false, message: `You can only withdraw $${remaining} more today` }
  }
  return { valid: true }
}