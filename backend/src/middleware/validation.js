import { body, validationResult } from 'express-validator';

// Validation rules
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateDeposit = [
  body('amount')
    .isFloat({ min: 20, max: 1000 })
    .withMessage('Amount must be between $20 and $1000'),
  body('currency')
    .isIn(['USDT', 'BTC', 'ETH', 'BUSD', 'USDC'])
    .withMessage('Invalid currency'),
];

export const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 30 })
    .withMessage('Minimum withdrawal is $30'),
  body('currency')
    .isIn(['USDT', 'BTC', 'ETH', 'BUSD', 'USDC'])
    .withMessage('Invalid currency'),
  body('walletAddress')
    .trim()
    .isLength({ min: 26, max: 62 })
    .withMessage('Invalid wallet address format')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Wallet address contains invalid characters'),
];

export const validateTrade = [
  body('asset')
    .isIn(['AAC', 'TBC', 'ZNX', 'QRT', 'LMX', 'OPX', 'VTR'])
    .withMessage('Invalid asset'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Trade amount must be at least $1'),
  body('prediction')
    .isIn(['UP', 'DOWN'])
    .withMessage('Prediction must be UP or DOWN'),
  body('duration')
    .isInt({ min: 1, max: 10 })
    .withMessage('Duration must be between 1 and 10 minutes'),
];

export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number'),
];

export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
];

// Admin validation
export const validateAdminUserUpdate = [
  body('balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Balance must be a positive number'),
  body('accountLevel')
    .optional()
    .isIn(['Basic', 'Pro', 'VIP'])
    .withMessage('Invalid account level'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role'),
];

export const validateMarketAsset = [
  body('symbol')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Symbol must be between 2 and 10 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Symbol must be uppercase letters only'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name must be less than 50 characters'),
  body('currentPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be at least 0.01'),
  body('volatility')
    .optional()
    .isFloat({ min: 0, max: 0.5 })
    .withMessage('Volatility must be between 0 and 0.5'),
  body('trend')
    .optional()
    .isFloat({ min: -0.1, max: 0.1 })
    .withMessage('Trend must be between -0.1 and 0.1'),
];

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().replace(/<[^>]*>/g, '');
      }
    });
  }
  next();
};