import express from 'express';
import { 
  requestWithdrawal, 
  getUserWithdrawals, 
  cancelWithdrawal,
  getAllWithdrawals,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  updateWithdrawalSettings
} from '../controllers/withdrawalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, logAdminAction } from '../middleware/adminMiddleware.js';
import { transactionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// User routes
router.use(protect);
router.post('/', transactionLimiter, requestWithdrawal);
router.get('/', getUserWithdrawals);
router.put('/:id/cancel', cancelWithdrawal);

// Admin routes
router.get('/admin/all', isAdmin, logAdminAction, getAllWithdrawals);
router.get('/admin/pending', isAdmin, logAdminAction, getPendingWithdrawals);
router.put('/admin/:id/approve', isAdmin, logAdminAction, approveWithdrawal);
router.put('/admin/:id/reject', isAdmin, logAdminAction, rejectWithdrawal);
router.put('/admin/:id/complete', isAdmin, logAdminAction, completeWithdrawal);
router.put('/admin/settings', isAdmin, logAdminAction, updateWithdrawalSettings);

export default router;