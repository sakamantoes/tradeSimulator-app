import { format, formatDistance, formatRelative, differenceInDays, parseISO } from 'date-fns'
import { DATE_FORMATS } from './constants'

// Currency Formatter
export const formatCurrency = (
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Compact Currency Formatter (e.g., 1.2K, 1.5M)
export const formatCompactCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return formatter.format(amount)
}

// Percentage Formatter
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  includeSign: boolean = true
): string => {
  const formatted = (value * 100).toFixed(decimals)
  const sign = includeSign && value > 0 ? '+' : ''
  return `${sign}${formatted}%`
}

// Number Formatter
export const formatNumber = (
  value: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Compact Number Formatter
export const formatCompactNumber = (
  value: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value)
}

// Date Formatter
export const formatDate = (
  date: string | Date,
  formatString: string = DATE_FORMATS.FULL,
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString, { locale: require(`date-fns/locale/${locale}`) })
}

// Relative Time Formatter
export const formatRelativeTime = (
  date: string | Date,
  baseDate: Date = new Date(),
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, baseDate, { addSuffix: true, locale: require(`date-fns/locale/${locale}`) })
}

// Time Ago Formatter
export const formatTimeAgo = (
  date: string | Date,
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: require(`date-fns/locale/${locale}`) })
}

// Format Duration (minutes to human readable)
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  return `${hours}h ${remainingMinutes}m`
}

// Format Trade Result
export const formatTradeResult = (
  result: 'win' | 'loss' | 'pending',
  profit: number
): { text: string; color: string; icon: string } => {
  switch (result) {
    case 'win':
      return {
        text: `+${formatCurrency(profit)}`,
        color: 'text-success',
        icon: '📈',
      }
    case 'loss':
      return {
        text: `-${formatCurrency(Math.abs(profit))}`,
        color: 'text-error',
        icon: '📉',
      }
    default:
      return {
        text: 'Pending',
        color: 'text-warning',
        icon: '⏳',
      }
  }
}

// Format Wallet Address (masked)
export const formatWalletAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

// Alias for backward compatibility
export const maskWalletAddress = formatWalletAddress

// Format Email (masked)
export const formatEmail = (email: string): string => {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const maskedLocal = local.length > 2 
    ? local.substring(0, 2) + '*'.repeat(local.length - 2)
    : local + '*'.repeat(2)
  return `${maskedLocal}@${domain}`
}

// Format Phone Number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{4})$/)
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]}`
  }
  return phone
}

// Format File Size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format Percentage Change with Arrow
export const formatPercentageChange = (
  change: number,
  decimals: number = 2
): { text: string; color: string; arrow: string } => {
  const isPositive = change > 0
  const isNegative = change < 0
  const formattedValue = formatPercentage(Math.abs(change) / 100, decimals, false)
  
  return {
    text: `${isPositive ? '+' : ''}${formattedValue}`,
    color: isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-neutral',
    arrow: isPositive ? '▲' : isNegative ? '▼' : '•',
  }
}

// Format Chart Data
export const formatChartData = (data: any[]) => {
  return data.map(item => ({
    ...item,
    time: typeof item.time === 'number' ? item.time : new Date(item.time).getTime() / 1000,
  }))
}

// Format Trade Amount with Fee
export const formatTradeWithFee = (
  amount: number,
  feePercentage: number = 0.1
): { netAmount: number; fee: number; formattedNet: string; formattedFee: string } => {
  const fee = amount * feePercentage
  const netAmount = amount + fee
  return {
    netAmount,
    fee,
    formattedNet: formatCurrency(netAmount),
    formattedFee: formatCurrency(fee),
  }
}

// Format Withdrawal Amount with Fee
export const formatWithdrawalWithFee = (
  amount: number,
  feePercentage: number = 0.005
): { netAmount: number; fee: number; formattedNet: string; formattedFee: string } => {
  const fee = amount * feePercentage
  const netAmount = amount - fee
  return {
    netAmount,
    fee,
    formattedNet: formatCurrency(netAmount),
    formattedFee: formatCurrency(fee),
  }
}

// Format Deposit Amount with Fees
export const formatDepositWithFees = (
  amount: number,
  platformFee: number = 0.001,
  companyFee: number = 0.01
): { netAmount: number; platformFeeAmount: number; companyFeeAmount: number; formattedNet: string } => {
  const platformFeeAmount = amount * platformFee
  const companyFeeAmount = amount * companyFee
  const netAmount = amount - platformFeeAmount - companyFeeAmount
  return {
    netAmount,
    platformFeeAmount,
    companyFeeAmount,
    formattedNet: formatCurrency(netAmount),
  }
}

// Format Transaction Type
export const formatTransactionType = (type: string): { text: string; icon: string; color: string } => {
  const types: Record<string, { text: string; icon: string; color: string }> = {
    deposit: { text: 'Deposit', icon: '💰', color: 'text-success' },
    withdrawal: { text: 'Withdrawal', icon: '💸', color: 'text-error' },
    trade: { text: 'Trade', icon: '📊', color: 'text-info' },
    fee: { text: 'Fee', icon: '💵', color: 'text-warning' },
    trade_open: { text: 'Trade Opened', icon: '🎯', color: 'text-info' },
    trade_close: { text: 'Trade Closed', icon: '🏁', color: 'text-info' },
    withdrawal_request: { text: 'Withdrawal Request', icon: '📝', color: 'text-warning' },
    withdrawal_approved: { text: 'Withdrawal Approved', icon: '✅', color: 'text-success' },
    withdrawal_rejected: { text: 'Withdrawal Rejected', icon: '❌', color: 'text-error' },
  }
  return types[type] || { text: type, icon: '📋', color: 'text-neutral' }
}

// Format Asset Symbol with Name
export const formatAsset = (symbol: string, assets: any[]): string => {
  const asset = assets.find(a => a.symbol === symbol)
  return asset ? `${asset.symbol} (${asset.name})` : symbol
}

// Format Account Level
export const formatAccountLevel = (level: string): { name: string; color: string; badge: string } => {
  const levels: Record<string, { name: string; color: string; badge: string }> = {
    Basic: { name: 'Basic', color: 'text-gray-500', badge: 'badge-ghost' },
    Pro: { name: 'Pro', color: 'text-blue-500', badge: 'badge-primary' },
    VIP: { name: 'VIP', color: 'text-yellow-500', badge: 'badge-warning' },
  }
  return levels[level] || levels.Basic
}

// Format Trade Duration Text
export const formatTradeDuration = (duration: number): string => {
  if (duration < 1) return `${duration * 60} seconds`
  if (duration === 1) return '1 minute'
  return `${duration} minutes`
}

// Format Status Badge
export const formatStatusBadge = (status: string): { text: string; color: string; bg: string } => {
  const statuses: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: 'Pending', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    confirmed: { text: 'Confirmed', color: 'text-green-500', bg: 'bg-green-500/10' },
    approved: { text: 'Approved', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    rejected: { text: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10' },
    completed: { text: 'Completed', color: 'text-green-500', bg: 'bg-green-500/10' },
    cancelled: { text: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-500/10' },
    open: { text: 'Open', color: 'text-green-500', bg: 'bg-green-500/10' },
    closed: { text: 'Closed', color: 'text-gray-500', bg: 'bg-gray-500/10' },
    win: { text: 'Win', color: 'text-green-500', bg: 'bg-green-500/10' },
    loss: { text: 'Loss', color: 'text-red-500', bg: 'bg-red-500/10' },
  }
  return statuses[status] || { text: status, color: 'text-gray-500', bg: 'bg-gray-500/10' }
}

// Format Timeframe Label
export const formatTimeframe = (timeframe: string): string => {
  const timeframes: Record<string, string> = {
    '1m': '1 Minute',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '1h': '1 Hour',
    '4h': '4 Hours',
    '1d': '1 Day',
  }
  return timeframes[timeframe] || timeframe
}

// Format Error Message
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  if (error.response?.data?.message) return error.response.data.message
  if (error.message) return error.message
  return 'An unexpected error occurred'
}

// Format Success Message
export const formatSuccessMessage = (action: string): string => {
  const messages: Record<string, string> = {
    login: 'Login successful! Welcome back.',
    register: 'Registration successful! Please verify your email.',
    deposit: 'Deposit initiated successfully!',
    withdrawal: 'Withdrawal request submitted successfully!',
    trade: 'Trade opened successfully!',
    profile: 'Profile updated successfully!',
    password: 'Password changed successfully!',
  }
  return messages[action] || `${action} completed successfully!`
}