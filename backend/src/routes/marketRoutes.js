import express from 'express';
import { 
  getAssets,
  getAssetPrice,
  getAllPrices,
  getHistoricalData,
  getMarketSummary,
 
  createAsset,
  updateAsset,
  deleteAsset,
  bulkUpdateAssets,
  setMarketVolatility,
  setMarketTrend,
  getMarketStats
} from '../controllers/marketController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, logAdminAction } from '../middleware/adminMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (some may still require authentication)
router.get('/assets', protect, apiLimiter, getAssets);
router.get('/price/:symbol', protect, apiLimiter, getAssetPrice);
router.get('/prices', protect, apiLimiter, getAllPrices);
router.get('/history/:symbol', protect, apiLimiter, getHistoricalData);
router.get('/summary', protect, apiLimiter, getMarketSummary);


// Admin routes
router.post('/admin/assets', protect, isAdmin, logAdminAction, createAsset);
router.put('/admin/assets/:symbol', protect, isAdmin, logAdminAction, updateAsset);
router.delete('/admin/assets/:symbol', protect, isAdmin, logAdminAction, deleteAsset);
router.post('/admin/bulk-update', protect, isAdmin, logAdminAction, bulkUpdateAssets);
router.post('/admin/volatility', protect, isAdmin, logAdminAction, setMarketVolatility);
router.post('/admin/trend', protect, isAdmin, logAdminAction, setMarketTrend);
router.get('/admin/stats', protect, isAdmin, logAdminAction, getMarketStats);

export default router;