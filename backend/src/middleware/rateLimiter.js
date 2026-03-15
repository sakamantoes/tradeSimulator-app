import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

/*
  Create Redis client if Redis is configured.
  If REDIS_URL is not provided, express-rate-limit will
  automatically use the default in-memory store.
*/

let redisClient;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL
  });

  redisClient.connect().catch(console.error);
}

/* ================================
   GENERAL API LIMITER
================================ */

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,

  message: {
    message: "Too many requests from this IP, please try again after 15 minutes"
  },

  standardHeaders: true,
  legacyHeaders: false,

  store: redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args)
      })
    : undefined,

  skip: (req) => req.path === "/health" || req.path === "/"
});


/* ================================
   AUTH LIMITER
================================ */

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,

  skipSuccessfulRequests: true,

  message: {
    message: "Too many failed login attempts, please try again after an hour"
  },

  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);

    return req.body?.email
      ? `${ip}-${req.body.email}`
      : ip;
  }
});


/* ================================
   TRADE LIMITER
================================ */

export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,

  message: {
    message: "Trade limit reached, please wait a moment"
  },

  keyGenerator: (req) => {
    if (req.user) {
      return `user-${req.user.id}`;
    }

    return ipKeyGenerator(req);
  }
});


/* ================================
   TRANSACTION LIMITER
================================ */

export const transactionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,

  message: {
    message: "Daily transaction limit reached"
  },

  keyGenerator: (req) => {
    if (req.user) {
      return `user-${req.user.id}`;
    }

    return ipKeyGenerator(req);
  }
});


/* ================================
   ADMIN LIMITER
================================ */

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,

  message: {
    message: "Too many admin actions, please slow down"
  },

  keyGenerator: (req) => {
    if (req.user) {
      return `admin-${req.user.id}`;
    }

    return ipKeyGenerator(req);
  }
});


/* ================================
   WEBHOOK LIMITER
================================ */

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,

  message: {
    message: "Too many webhook requests"
  },

  keyGenerator: (req) => {
    return `${ipKeyGenerator(req)}-${req.path}`;
  }
});


/* ================================
   PASSWORD RESET LIMITER
================================ */

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts per hour

  skipSuccessfulRequests: true,

  message: {
    message: "Too many password reset attempts, please try again later"
  },

  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return req.body?.email ? `${ip}-${req.body.email}` : ip;
  }
});


/* ================================
   CUSTOM LIMITER FACTORY
================================ */

export const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,

    message: { message },

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => ipKeyGenerator(req)
  });
};