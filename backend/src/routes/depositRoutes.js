import express from "express";
import { createDeposit, ipnHandler } from "../controllers/depositController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateDeposit, handleValidationErrors, sanitizeInput } from '../middleware/validation.js';
import { transactionLimiter, webhookLimiter } from '../middleware/rateLimiter.js';


const router = express.Router();

router.post(
  "/",
  protect,
  transactionLimiter, // Limit transactions per day
  sanitizeInput,
  validateDeposit,
  handleValidationErrors,
  createDeposit,
);
router.post("/ipn", webhookLimiter, ipnHandler); // no auth, webhook

export default router;
