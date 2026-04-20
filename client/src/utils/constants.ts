// Asset Configuration
export const TRADING_ASSETS = [
  { symbol: 'AAC', name: 'Aureus Asset Coin', basePrice: 100, volatility: 0.02, color: '#10b981' },
  { symbol: 'TBC', name: 'Terra Blockchain', basePrice: 150, volatility: 0.025, color: '#3b82f6' },
  { symbol: 'ZNX', name: 'Zenith Exchange', basePrice: 75, volatility: 0.03, color: '#f59e0b' },
  { symbol: 'QRT', name: 'Quartile Token', basePrice: 200, volatility: 0.035, color: '#ef4444' },
  { symbol: 'LMX', name: 'LumenX', basePrice: 50, volatility: 0.04, color: '#8b5cf6' },
  { symbol: 'OPX', name: 'OptionX Protocol', basePrice: 120, volatility: 0.022, color: '#ec489a' },
  { symbol: 'VTR', name: 'Vector Chain', basePrice: 90, volatility: 0.028, color: '#14b8a6' },
] as const

// Trading Parameters
export const TRADE_CONFIG = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 10000,
  MIN_DURATION: 1,
  MAX_DURATION: 10,
  PROFIT_PERCENTAGE: 0.10, // 10%
  DEFAULT_DURATION: 1,
  DEFAULT_AMOUNT: 10,
} as const

// Deposit/Withdrawal Limits
export const TRANSACTION_LIMITS = {
  MIN_DEPOSIT: 20,
  MAX_DEPOSIT: 1000,
  MIN_WITHDRAWAL: 30,
  MAX_WITHDRAWAL: 10000,
  DEPOSIT_PLATFORM_FEE: 0.001, // 0.1%
  DEPOSIT_COMPANY_FEE: 0.01, // 1%
  WITHDRAWAL_FEE: 0.005, // 0.5%
} as const

// Account Levels
export const ACCOUNT_LEVELS = {
  BASIC: {
    name: 'Basic',
    minDeposit: 0,
    maxDailyWithdrawal: 500,
    tradeLimit: 10,
    profitMultiplier: 1,
  },
  PRO: {
    name: 'Pro',
    minDeposit: 500,
    maxDailyWithdrawal: 2000,
    tradeLimit: 25,
    profitMultiplier: 1.05,
  },
  VIP: {
    name: 'VIP',
    minDeposit: 2000,
    maxDailyWithdrawal: 10000,
    tradeLimit: 50,
    profitMultiplier: 1.10,
  },
} as const

// Supported Cryptocurrencies
export const CRYPTO_CURRENCIES = [
  { code: 'USDT', name: 'Tether USD', network: 'ERC20', minConfirmations: 12 },
  { code: 'BTC', name: 'Bitcoin', network: 'Bitcoin', minConfirmations: 3 },
  { code: 'ETH', name: 'Ethereum', network: 'ERC20', minConfirmations: 12 },
  { code: 'BUSD', name: 'Binance USD', network: 'BEP20', minConfirmations: 15 },
  { code: 'USDC', name: 'USD Coin', network: 'ERC20', minConfirmations: 12 },
] as const

// Chart Timeframes
export const TIMEFRAMES = [
  { value: '1m', label: '1 Minute', interval: 60000, duration: 60 },
  { value: '5m', label: '5 Minutes', interval: 300000, duration: 300 },
  { value: '15m', label: '15 Minutes', interval: 900000, duration: 900 },
  { value: '1h', label: '1 Hour', interval: 3600000, duration: 3600 },
  { value: '4h', label: '4 Hours', interval: 14400000, duration: 14400 },
  { value: '1d', label: '1 Day', interval: 86400000, duration: 86400 },
] as const

// Chart Colors
export const CHART_COLORS = {
  UP: '#10b981',
  DOWN: '#ef4444',
  NEUTRAL: '#6b7280',
  VOLUME: '#3b82f6',
  MA_7: '#f59e0b',
  MA_25: '#8b5cf6',
  MA_99: '#ec489a',
  GRID: '#334155',
  BACKGROUND: '#1e293b',
  TEXT: '#94a3b8',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    ME: '/users/me',
    WALLET: '/users/wallet',
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    TRANSACTIONS: '/users/transactions',
    STATS: '/users/stats',
  },
  TRADE: {
    OPEN: '/trades',
    HISTORY: '/trades',
    OPEN_TRADES: '/trades/open',
    CANCEL: (id: number) => `/trades/${id}/cancel`,
  },
  DEPOSIT: {
    CREATE: '/deposits',
    HISTORY: '/deposits',
    STATUS: (id: number) => `/deposits/${id}`,
  },
  WITHDRAWAL: {
    CREATE: '/withdrawals',
    HISTORY: '/withdrawals',
    CANCEL: (id: number) => `/withdrawals/${id}/cancel`,
  },
  MARKET: {
    ASSETS: '/market/assets',
    PRICE: (symbol: string) => `/market/price/${symbol}`,
    PRICES: '/market/prices',
    HISTORY: (symbol: string) => `/market/history/${symbol}`,
    SUMMARY: '/market/summary',
    NEWS: '/market/news',
  },
  ADMIN: {
    USERS: '/admin/users',
    DEPOSITS: '/admin/deposits',
    WITHDRAWALS: '/admin/withdrawals',
    TRADES: '/admin/trades',
    SETTINGS: '/admin/settings',
    ASSETS: '/admin/assets',
    STATS: '/admin/stats',
  },
} as const

// WebSocket Events
export const WS_EVENTS = {
  PRICE_UPDATE: 'price_update',
  TRADE_UPDATE: 'trade_update',
  BALANCE_UPDATE: 'balance_update',
  MARKET_NEWS: 'market_news',
  ADMIN_BROADCAST: 'admin_broadcast',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance to perform this action.',
  TRADE_LIMIT_REACHED: 'Maximum number of open trades reached.',
  DAILY_LIMIT_REACHED: 'Daily transaction limit reached.',
  MAINTENANCE_MODE: 'Site is under maintenance. Please try again later.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful! Welcome back.',
  REGISTER: 'Registration successful! Please verify your email.',
  DEPOSIT: 'Deposit initiated. Please send funds to the provided address.',
  WITHDRAWAL: 'Withdrawal request submitted successfully.',
  TRADE_OPEN: 'Trade opened successfully!',
  TRADE_CLOSED: 'Trade closed.',
  PROFILE_UPDATE: 'Profile updated successfully.',
  PASSWORD_CHANGE: 'Password changed successfully.',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'trade_simulator_token',
  USER: 'trade_simulator_user',
  THEME: 'trade_simulator_theme',
  LANGUAGE: 'trade_simulator_language',
  LAST_VISIT: 'trade_simulator_last_visit',
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// Date Formats
export const DATE_FORMATS = {
  FULL: 'PPPpp',
  DATE_ONLY: 'PPP',
  TIME_ONLY: 'p',
  RELATIVE: 'PPp',
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

// Theme Configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

// Chart Defaults
export const CHART_DEFAULTS = {
  TIMEFRAME: '1m',
  CANDLES_COUNT: 100,
  SHOW_VOLUME: true,
  SHOW_MA: false,
  MA_PERIODS: [7, 25, 99],
} as const

// Trading View Defaults
export const TRADING_VIEW = {
  HEIGHT: 500,
  WIDTH: '100%',
  THEME: 'dark',
  LOCALE: 'en',
  TOOLBAR_BG: '#1e293b',
  ENABLE_PUBLISHING: false,
  HIDE_TOP_TOOLBAR: false,
  SAVE_LOAD_OPTIONS: false,
} as const

// Referral Program
export const REFERRAL_CONFIG = {
  ENABLED: true,
  DIRECT_BONUS: 0.05, // 5%
  SECOND_LEVEL_BONUS: 0.02, // 2%
  THIRD_LEVEL_BONUS: 0.01, // 1%
  MIN_WITHDRAWAL: 10,
} as const

// Security Settings
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15, // minutes
  SESSION_TIMEOUT: 30, // minutes
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_LETTER: true,
  TWO_FA_ENABLED: false,
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const

// Activity Types
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRADE_OPEN: 'trade_open',
  TRADE_CLOSE: 'trade_close',
  PROFILE_UPDATE: 'profile_update',
  PASSWORD_CHANGE: 'password_change',
} as const