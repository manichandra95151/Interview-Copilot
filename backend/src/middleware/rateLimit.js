/**
 * rateLimit.js — rate limiters.
 * - globalLimiter: coarse protection on all traffic.
 * - userLimiter: per-authenticated-user limit (keyed by req.userId), so one
 *   user cannot exhaust the budget for everyone. Must run after requireAuth.
 */
import { rateLimit } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  // Runs only after requireAuth, so req.userId is always present.
  keyGenerator: (req) => req.userId,
  message: { error: 'Too many requests — please slow down.' },
});
