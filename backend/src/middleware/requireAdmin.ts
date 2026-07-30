import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../config/env';

export interface AdminRequest extends Request {
  adminId?: string;
  adminDbId?: string;
  adminRole?: string;
}

const SECRET = new TextEncoder().encode(env.ADMIN_JWT_SECRET);

/**
 * requireAdmin — verifies cv_admin_at HttpOnly cookie or Authorization Bearer Admin JWT.
 * 
 * SECURITY:
 * - Accepts Admin JWTs from HttpOnly cookie (cv_admin_at) OR Authorization: Bearer <admin_token>.
 * - Validates aud=codeved-admin and iss=codeved-api claims.
 * - Rejects invalid JWTs, expired JWTs, or Clerk student tokens.
 */
export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = req.cookies?.cv_admin_at || bearerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Admin session required.',
      requestId: req.requestId,
    });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET, {
      audience: 'codeved-admin',
      issuer: 'codeved-api',
    });

    req.adminDbId = payload.sub as string;
    req.adminId = payload.aid as string;
    req.adminRole = payload.role as string;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired admin session.',
      requestId: req.requestId,
    });
  }
}
