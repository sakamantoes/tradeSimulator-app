import express from 'express';
import { 
  isAdmin, 
  isSuperAdmin, 
  logAdminAction, 
  ipWhitelist,
  validateAdminSession,
  adminActionLimiter,
  hasPermission 
} from '../middleware/adminMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { validateAdminUserUpdate, validateMarketAsset, handleValidationErrors } from '../middleware/validation.js';

// Import admin controllers
import {
  getAllUsers,
  updateUserBalance,
  updateSetting,
  createMarketAsset,
} from '../controllers/adminController.js';

import {
  getAllWithdrawals,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} from '../controllers/withdrawalController.js';

import {
  createAsset,
  updateAsset,
  deleteAsset,
  setMarketVolatility,
  getMarketStats
} from '../controllers/marketController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);
router.use(ipWhitelist); // IP whitelist check
router.use(validateAdminSession); // Session validation
router.use(logAdminAction); // Log all admin actions
router.use(adminLimiter); // Rate limiting for admin actions
router.use(adminActionLimiter); // Mark sensitive actions

// User management
router.get('/users', 
  hasPermission('manage_users'),
  getAllUsers
);

router.put('/users/:userId/balance',
  hasPermission('manage_users'),
  validateAdminUserUpdate,
  handleValidationErrors,
  updateUserBalance
);

// Withdrawal management
router.get('/withdrawals',
  hasPermission('manage_withdrawals'),
  getAllWithdrawals
);

router.get('/withdrawals/pending',
  hasPermission('manage_withdrawals'),
  getPendingWithdrawals
);

router.put('/withdrawals/:id/approve',
  hasPermission('manage_withdrawals'),
  approveWithdrawal
);

router.put('/withdrawals/:id/reject',
  hasPermission('manage_withdrawals'),
  rejectWithdrawal
);

// Market management
router.post('/assets',
  hasPermission('manage_market'),
  validateMarketAsset,
  handleValidationErrors,
  createAsset
);

router.put('/assets/:symbol',
  hasPermission('manage_market'),
  updateAsset
);

router.delete('/assets/:symbol',
  hasPermission('manage_market'),
  deleteAsset
);

router.post('/market/volatility',
  hasPermission('manage_market'),
  setMarketVolatility
);

router.get('/market/stats',
  hasPermission('view_reports'),
  getMarketStats
);

// Settings (super admin only)
router.post('/settings',
  isSuperAdmin,
  hasPermission('manage_settings'),
  updateSetting
);

export default router;