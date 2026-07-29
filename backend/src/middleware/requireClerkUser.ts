import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  clerkUserId?: string;
  clerkUser?: { id: string; email: string; firstName?: string | null; lastName?: string | null };
}

/**
 * requireClerkUser — verifies Clerk JWT Bearer token.
 * Uses @clerk/backend verifyToken to check signature and expiration.
 */
export async function requireClerkUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing Clerk authorization token.',
      requestId: req.requestId,
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    res.status(401).json({
      success: false,
      error: 'Invalid Clerk token format.',
      requestId: req.requestId,
    });
    return;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      res.status(401).json({
        success: false,
        error: 'Invalid Clerk token payload.',
        requestId: req.requestId,
      });
      return;
    }

    req.clerkUserId = payload.sub;
    next();
  } catch (err: any) {
    console.error('❌ Clerk token verification failed:', err.message || err);
    res.status(401).json({
      success: false,
      error: 'Clerk token verification failed. Please sign in again.',
      requestId: req.requestId,
    });
  }
}
