import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate unique transaction ID
export const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `TX-${timestamp}-${random}`.toUpperCase();
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Calculate percentage change
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return 100;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

// Mask email for privacy
export const maskEmail = (email) => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = local.length > 2 
    ? local.substring(0, 2) + '*'.repeat(local.length - 2)
    : local + '*'.repeat(2);
  
  return `${maskedLocal}@${domain}`;
};

// Mask wallet address
export const maskWalletAddress = (address, visibleChars = 6) => {
  if (!address || address.length < visibleChars * 2) return address;
  return `${address.substring(0, visibleChars)}...${address.substring(address.length - visibleChars)}`;
};

// Generate random price movement
export const generatePriceMovement = (currentPrice, volatility = 0.02) => {
  const change = (Math.random() - 0.5) * 2 * volatility;
  const newPrice = currentPrice * (1 + change);
  return Math.max(newPrice, 0.01);
};

// Calculate moving average
export const calculateMovingAverage = (prices, period = 20) => {
  if (prices.length < period) return null;
  
  const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
  return sum / period;
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate wallet address (basic)
export const isValidWalletAddress = (address, currency = 'USDT') => {
  // Basic validation based on currency
  const patterns = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDT: /^[T][a-zA-Z0-9]{33}$|^0x[a-fA-F0-9]{40}$/,
  };
  
  const pattern = patterns[currency] || /^[a-zA-Z0-9]{26,62}$/;
  return pattern.test(address);
};

// Calculate trade profit/loss
export const calculateTradeResult = (amount, prediction, openPrice, closePrice) => {
  const profitPercentage = 0.1; // 10%
  
  if (prediction === 'UP' && closePrice > openPrice) {
    return {
      result: 'win',
      profit: amount * profitPercentage
    };
  } else if (prediction === 'DOWN' && closePrice < openPrice) {
    return {
      result: 'win',
      profit: amount * profitPercentage
    };
  } else {
    return {
      result: 'loss',
      profit: -amount
    };
  }
};

// Pagination helper
export const paginateResults = (data, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const results = {};
  
  if (endIndex < data.length) {
    results.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit
    };
  }
  
  results.data = data.slice(startIndex, endIndex);
  results.total = data.length;
  results.page = page;
  results.totalPages = Math.ceil(data.length / limit);
  
  return results;
};

// Sleep/delay function
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Generate unique referral code
export const generateReferralCode = (userId, email) => {
  const hash = crypto.createHash('md5').update(`${userId}-${email}-${Date.now()}`).digest('hex');
  return hash.substring(0, 8).toUpperCase();
};

// Calculate referral commission
export const calculateReferralCommission = (amount, level = 1) => {
  const rates = {
    1: 0.05, // 5% for direct referrals
    2: 0.02, // 2% for second level
    3: 0.01, // 1% for third level
  };
  
  return amount * (rates[level] || 0);
};

// Sanitize object (remove null/undefined/empty)
export const sanitizeObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => 
      v !== null && v !== undefined && v !== ''
    )
  );
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Parse user agent
export const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  const isMobile = /mobile/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return { isMobile, isTablet, isDesktop, browser, os };
};

// Get client IP from request
export const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip;
};

// Validate date range
export const validateDateRange = (startDate, endDate, maxDays = 30) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  
  return {
    valid: start <= end && diffDays <= maxDays,
    start,
    end,
    diffDays
  };
};