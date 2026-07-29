import argon2 from 'argon2';
import { SignJWT } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db';
import { env } from '../config/env';

const SECRET = new TextEncoder().encode(env.ADMIN_JWT_SECRET);
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Hash / verify ────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export async function issueAccessToken(payload: {
  sub: string;
  aid: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ aid: payload.aid, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setAudience('codeved-admin')
    .setIssuer('codeved-api')
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(SECRET);
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export function generateOpaqueToken(): string {
  return randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(
  adminUserId: string,
  token: string,
  familyId: string,
  meta: { userAgent?: string; ip?: string }
): Promise<void> {
  await prisma.adminRefreshToken.create({
    data: {
      admin_user_id: adminUserId,
      token_hash: hashToken(token),
      family_id: familyId,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      user_agent: meta.userAgent,
      ip: meta.ip,
    },
  });
}

// ─── Login ─────────────────────────────────────────────────────────────────────

export async function adminLogin(
  adminId: string,
  password: string,
  meta: { ip?: string; userAgent?: string; requestId?: string }
): Promise<{ tokens: AdminTokens; admin: { id: string; admin_id: string; role: string; display_name: string } }> {
  const admin = await prisma.adminUser.findUnique({ where: { admin_id: adminId } });

  // Always do a dummy verify to avoid timing attacks even if user not found
  const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  if (!admin || !admin.is_active) {
    await argon2.verify(dummyHash, password).catch(() => {});
    await logAudit({
      actorType: 'admin',
      actorId: adminId,
      action: 'admin.login.fail',
      resource: 'admin_users',
      meta: { reason: admin ? 'inactive' : 'not_found' },
      ip: meta.ip,
      requestId: meta.requestId,
    });
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check lockout
  if (admin.locked_until && admin.locked_until > new Date()) {
    throw new Error('ACCOUNT_LOCKED');
  }

  const valid = await verifyPassword(admin.password_hash, password);

  if (!valid) {
    const newFailedAttempts = admin.failed_attempts + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failed_attempts: newFailedAttempts,
        locked_until: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : undefined,
      },
    });

    await logAudit({
      actorType: 'admin',
      actorId: admin.id,
      action: 'admin.login.fail',
      resource: `admin_users:${admin.id}`,
      meta: { attempt: newFailedAttempts, locked: shouldLock },
      ip: meta.ip,
      requestId: meta.requestId,
    });

    if (shouldLock) throw new Error('ACCOUNT_LOCKED');
    throw new Error('INVALID_CREDENTIALS');
  }

  // Successful login — reset failed attempts
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
    },
  });

  const accessToken = await issueAccessToken({
    sub: admin.id,
    aid: admin.admin_id,
    role: admin.role,
  });

  const refreshToken = generateOpaqueToken();
  const familyId = uuidv4();
  await storeRefreshToken(admin.id, refreshToken, familyId, meta);

  await logAudit({
    actorType: 'admin',
    actorId: admin.id,
    action: 'admin.login.success',
    resource: `admin_users:${admin.id}`,
    ip: meta.ip,
    requestId: meta.requestId,
  });

  return {
    tokens: { accessToken, refreshToken },
    admin: { id: admin.id, admin_id: admin.admin_id, role: admin.role, display_name: admin.display_name },
  };
}

// ─── Refresh ───────────────────────────────────────────────────────────────────

export async function rotateRefreshToken(
  incomingToken: string,
  meta: { ip?: string; userAgent?: string; requestId?: string }
): Promise<AdminTokens> {
  const tokenHash = hashToken(incomingToken);
  const stored = await prisma.adminRefreshToken.findUnique({ where: { token_hash: tokenHash } });

  if (!stored) throw new Error('INVALID_TOKEN');

  // Reuse detection — token already revoked
  if (stored.revoked_at) {
    // Revoke entire family
    await prisma.adminRefreshToken.updateMany({
      where: { family_id: stored.family_id },
      data: { revoked_at: new Date() },
    });
    await logAudit({
      actorType: 'admin',
      actorId: stored.admin_user_id,
      action: 'admin.refresh.reuse_detected',
      resource: `admin_refresh_tokens:${stored.id}`,
      ip: meta.ip,
      requestId: meta.requestId,
    });
    throw new Error('TOKEN_REUSE');
  }

  if (stored.expires_at < new Date()) throw new Error('EXPIRED_TOKEN');

  // Revoke old token
  await prisma.adminRefreshToken.update({
    where: { id: stored.id },
    data: { revoked_at: new Date() },
  });

  const admin = await prisma.adminUser.findUnique({ where: { id: stored.admin_user_id } });
  if (!admin || !admin.is_active) throw new Error('INVALID_TOKEN');

  const accessToken = await issueAccessToken({
    sub: admin.id,
    aid: admin.admin_id,
    role: admin.role,
  });

  const newRefreshToken = generateOpaqueToken();
  await storeRefreshToken(admin.id, newRefreshToken, stored.family_id, meta);

  return { accessToken, refreshToken: newRefreshToken };
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export async function adminLogout(refreshToken?: string, adminDbId?: string): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.adminRefreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }
  if (adminDbId) {
    await logAudit({
      actorType: 'admin',
      actorId: adminDbId,
      action: 'admin.logout',
    });
  }
}

// ─── Audit Log ─────────────────────────────────────────────────────────────────

export async function logAudit(data: {
  actorType?: 'admin' | 'student' | 'system';
  actorId: string;
  action: string;
  resource?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  requestId?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor_type: data.actorType ?? 'admin',
        actor_id: data.actorId,
        action: data.action,
        resource: data.resource,
        meta: data.meta as any,
        ip: data.ip,
        request_id: data.requestId,
      },
    });
  } catch {
    // Never throw from audit log — non-critical
  }
}
