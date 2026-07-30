import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  adminLogin,
  adminLogout,
  rotateRefreshToken,
} from '../services/adminAuth.service';
import { requireAdmin, AdminRequest } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { adminLoginLimiter } from '../middleware/rateLimit';
import prisma from '../config/db';

const router = Router();

const ACCESS_COOKIE = 'cv_admin_at';
const REFRESH_COOKIE = 'cv_admin_rt';
const ACCESS_MAX_AGE = 15 * 60; // 15 min seconds
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 days seconds

const loginSchema = z.object({
  adminId: z.string().min(1).max(50),
  password: z.string().min(8).max(128),
});

// ─── POST /admin/auth/login ────────────────────────────────────────────────────

router.post('/login', adminLoginLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { adminId, password } = req.body;
    const { tokens, admin } = await adminLogin(adminId, password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });

    // HttpOnly Secure cookies — admin access token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',  // 'none' required for cross-domain (Vercel → Render)
      path: '/',
      maxAge: ACCESS_MAX_AGE * 1000,
    });

    // Refresh token only accessible on refresh endpoint path
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',  // 'none' required for cross-domain
      path: '/api/v1/admin/auth',
      maxAge: REFRESH_MAX_AGE * 1000,
    });

    res.json({
      success: true,
      data: {
        admin_id: admin.admin_id,
        display_name: admin.display_name,
        role: admin.role,
      },
      requestId: req.requestId,
    });
  } catch (err: any) {
    const msg = err.message;
    if (msg === 'ACCOUNT_LOCKED') {
      res.status(423).json({ success: false, error: 'Account locked. Try again in 15 minutes.', requestId: req.requestId });
    } else if (msg === 'INVALID_CREDENTIALS') {
      res.status(401).json({ success: false, error: 'Invalid credentials.', requestId: req.requestId });
    } else {
      res.status(500).json({ success: false, error: 'Login failed.', requestId: req.requestId });
    }
  }
});

// ─── POST /admin/auth/refresh ─────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) {
    res.status(401).json({ success: false, error: 'Refresh token missing.', requestId: req.requestId });
    return;
  }

  try {
    const tokens = await rotateRefreshToken(refreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: ACCESS_MAX_AGE * 1000,
    });

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/admin/auth',
      maxAge: REFRESH_MAX_AGE * 1000,
    });

    res.json({ success: true, data: { refreshed: true }, requestId: req.requestId });
  } catch (err: any) {
    const msg = err.message;
    if (msg === 'TOKEN_REUSE') {
      res.clearCookie(ACCESS_COOKIE);
      res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/admin/auth' });
      res.status(401).json({ success: false, error: 'Session invalidated. Please login again.', requestId: req.requestId });
    } else {
      res.status(401).json({ success: false, error: 'Invalid or expired session.', requestId: req.requestId });
    }
  }
});

// ─── POST /admin/auth/logout ──────────────────────────────────────────────────

router.post('/logout', requireAdmin, async (req: AdminRequest, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  await adminLogout(refreshToken, req.adminDbId);

  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(ACCESS_COOKIE, { path: '/', sameSite: isProduction ? 'none' : 'lax', secure: isProduction });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/admin/auth', sameSite: isProduction ? 'none' : 'lax', secure: isProduction });
  res.json({ success: true, data: { message: 'Logged out.' }, requestId: req.requestId });
});

// ─── GET /admin/auth/me ───────────────────────────────────────────────────────

router.get('/me', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminDbId },
      select: { id: true, admin_id: true, display_name: true, role: true, last_login_at: true, created_at: true },
    });

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found.', requestId: req.requestId });
      return;
    }

    res.json({ success: true, data: admin, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch profile.', requestId: req.requestId });
  }
});

export default router;
