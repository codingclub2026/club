import rateLimit from 'express-rate-limit';

// Public endpoints: 100 req / min
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

// Student auth-adjacent (profile sync, etc): 30 req / min
export const studentAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Slow down.' },
});

// Admin login: 5 req / 15 min per IP
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip ?? 'unknown';
    const adminId = (req.body?.adminId as string) ?? '';
    return `${ip}:${adminId}`;
  },
  message: {
    success: false,
    error: 'Too many login attempts. Account may be locked. Try again in 15 minutes.',
  },
});

// Authenticated admin routes: 200 req / min
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many admin requests.' },
});
