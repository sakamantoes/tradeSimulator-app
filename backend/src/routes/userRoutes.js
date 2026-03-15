import express from 'express';
import { 
  getMe, 
  getWallet, 
  getTransactionHistory, 
  updateProfile, 
  changePassword,
  getUserStats,
  requestAccountDeletion,
  confirmAccountDeletion
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All user routes are protected
router.use(protect);

router.get('/me', getMe);
router.get('/wallet', getWallet);
router.get('/transactions', getTransactionHistory);
router.get('/stats', getUserStats);
router.put('/profile', updateProfile);
router.post('/change-password', apiLimiter, changePassword);
router.post('/request-deletion', apiLimiter, requestAccountDeletion);
router.post('/confirm-deletion', confirmAccountDeletion);

export default router;