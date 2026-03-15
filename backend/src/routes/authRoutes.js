import express from "express";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  changePassword,
} from "../controllers/authController.js";
import {
  validateRegistration,
  validateLogin,
  validateEmail,
  validateResetPassword,
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Example login route
router.post(
  "/register",
  authLimiter,
  validateRegistration,
  sanitizeInput,
  handleValidationErrors,
  register,
);
router.post(
  "/login",
  authLimiter,
  sanitizeInput,
  validateLogin,
  handleValidationErrors,
  login,
);
router.get("/verify-email", verifyEmail);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  sanitizeInput,
  validateEmail,
  handleValidationErrors,
  forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  sanitizeInput,
  validateResetPassword,
  handleValidationErrors,
  resetPassword,
);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/change-password", protect, passwordResetLimiter, changePassword);

export default router;
