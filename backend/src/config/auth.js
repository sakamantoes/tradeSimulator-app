import dotenv from 'dotenv';
dotenv.config();

export const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn:  '7d',
    refreshExpiresIn:  '30d',
    algorithm: 'HS256',
  },

  // Password Configuration
  password: {
    minLength: 6,
    requireNumbers: true,
    requireLetters: true,
    requireUppercase: false,
    requireSpecialChars: false,
    hashRounds: 10,
  },

  // Session Configuration
  session: {
    maxConcurrentSessions: 3,
    inactivityTimeout: 24 * 60 * 60 * 1000, // 24 hours
    absoluteTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Email Verification
  emailVerification: {
    required: true,
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    resendCooldown: 60 * 1000, // 1 minute
  },

  // Password Reset
  passwordReset: {
    tokenExpiry: 1 * 60 * 60 * 1000, // 1 hour
    maxRequestsPerDay: 3,
  },

  // Two-Factor Authentication (2FA)
  twoFactorAuth: {
    enabled: false,
    issuer: 'waverup trade',
    window: 1, // Time window for TOTP
  },

  // Rate Limiting (requests per window)
  rateLimits: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
    },
    trades: {
      windowMs: 60 * 1000, // 1 minute
      max: 10,
    },
  },

  // Cookie Configuration
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Security Headers
  securityHeaders: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
  },

  // IP Whitelist for Admin (optional)
  adminIpWhitelist: process.env.ADMIN_IP_WHITELIST ? 
    process.env.ADMIN_IP_WHITELIST.split(',') : [],

  // Account Lockout
  accountLockout: {
    enabled: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // OAuth Providers (if needed)
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: '/api/auth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: '/api/auth/github/callback',
    },
  },

  // Helper functions
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Get JWT options
  getJwtOptions: () => ({
    expiresIn: authConfig.jwt.expiresIn,
    algorithm: authConfig.jwt.algorithm,
  }),

  // Get cookie options
  getCookieOptions: () => ({
    httpOnly: authConfig.cookie.httpOnly,
    secure: authConfig.cookie.secure,
    sameSite: authConfig.cookie.sameSite,
    maxAge: authConfig.cookie.maxAge,
  }),

  // Validate password strength
  validatePassword: (password) => {
    const errors = [];
    
    if (password.length < authConfig.password.minLength) {
      errors.push(`Password must be at least ${authConfig.password.minLength} characters long`);
    }
    
    if (authConfig.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (authConfig.password.requireLetters && !/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }
    
    if (authConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (authConfig.password.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default authConfig;