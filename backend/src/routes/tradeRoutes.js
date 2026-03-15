import express from "express";
import { openTrade, getUserTrades } from "../controllers/tradeController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  handleValidationErrors,
  validateTrade,
  sanitizeInput,
} from "../middleware/validation.js";
import { tradeLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post(
  "/",
  protect,
  validateTrade,
  handleValidationErrors,
  sanitizeInput,
  tradeLimiter,
  openTrade,
);
router.get("/", protect, getUserTrades);

export default router;
