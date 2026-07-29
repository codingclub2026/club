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
 * requireAdmin — verifies cv_admin_at HttpOnly cookie JWT.
 * 
 * SECURITY:
 * - Rejects requests that have Authorization: Bearer (Clerk tokens).
 *   Admin routes must NEVER accept a Clerk JWT as identity proof.
 * - Validates aud=codeved-admin and iss=codeved-api claims.
 */
export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Confused-deputy prevention: reject if Authorization header is present
  if (req.headers.authorization) {
    res.status(401).json({
      success: false,
      error: 'Admin routes do not accept Bearer tokens.',
      requestId: req.requestId,
    });
    return;
  }

  const token = req.cookies?.cv_admin_at;
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
