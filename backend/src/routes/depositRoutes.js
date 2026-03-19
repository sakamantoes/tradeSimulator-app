import express from 'express';
import { 
  createDeposit, 
  ipnHandler, 
  getUserDeposits, 
  getDepositById,
  getAllDeposits,
  updateDepositStatus 
} from '../controllers/depositController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateDeposit, handleValidationErrors } from '../middleware/validation.js';
import { transactionLimiter, webhookLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public webhook (no auth)
router.post('/ipn', webhookLimiter, ipnHandler);
router.get('/ipn', webhookLimiter, ipnHandler); // CryptAPI might send GET

// Protected user routes
router.use(protect);
router.post('/', 
  transactionLimiter,
  validateDeposit,
  handleValidationErrors,
  createDeposit
);
router.get('/', getUserDeposits);
router.get('/:id', getDepositById);

// Admin routes
router.get('/admin/all', admin, getAllDeposits);
router.put('/admin/:id/status', admin, updateDepositStatus);

export default router;