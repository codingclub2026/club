import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireClerkUser, AuthenticatedRequest } from '../middleware/requireClerkUser';
import { validate } from '../middleware/validate';
import { studentAuthLimiter } from '../middleware/rateLimit';

const router = Router();

const syncSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  college: z.string().max(200).optional(),
  branch: z.string().max(100).optional(),
  year: z.number().int().min(1).max(6).optional(),
  phone: z.string().max(15).optional(),
  avatar_url: z.string().url().optional(),
});

const updateSchema = syncSchema.partial().omit({ email: true });

// ─── POST /auth/sync ──────────────────────────────────────────────────────────

router.post('/sync', studentAuthLimiter, requireClerkUser, validate(syncSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { name, email, college, branch, year, phone, avatar_url } = req.body;

    const user = await prisma.user.upsert({
      where: { clerk_user_id: clerkUserId },
      update: { name, college, branch, year, phone, avatar_url },
      create: { clerk_user_id: clerkUserId, email, name, college, branch, year, phone, avatar_url },
    });

    res.json({ success: true, data: user, requestId: req.requestId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to sync profile.', requestId: req.requestId });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get('/me', requireClerkUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: req.clerkUserId! },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'Profile not found. Please sync first.', requestId: req.requestId });
      return;
    }

    res.json({ success: true, data: user, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch profile.', requestId: req.requestId });
  }
});

// ─── PATCH /auth/me ───────────────────────────────────────────────────────────

router.patch('/me', requireClerkUser, validate(updateSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { clerk_user_id: req.clerkUserId! },
      data: req.body,
    });

    res.json({ success: true, data: user, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update profile.', requestId: req.requestId });
  }
});

export default router;
