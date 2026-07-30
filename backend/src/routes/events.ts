import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireClerkUser, AuthenticatedRequest } from '../middleware/requireClerkUser';
import { requireAdmin, AdminRequest } from '../middleware/requireAdmin';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { publicLimiter } from '../middleware/rateLimit';

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  rules: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  amount: z.coerce.number().min(0).default(0),
  membership: z.string().optional().nullable(),
  whatsapp_group_link: z.string().optional().nullable(),
  poster_url: z.string().optional().nullable(),
  payment_qr_url: z.string().optional().nullable(),
  max_participants: z.coerce.number().int().positive().optional().nullable(),
  registration_deadline: z.string().optional().nullable().transform(val => (val && val.trim() !== '' ? new Date(val) : undefined)),
  coordinator_phone: z.string().optional().nullable(),
});

const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
});

// ─── GET /events — Public list ────────────────────────────────────────────────

router.get('/', publicLimiter, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const page = (req.query.page as string) ?? '1';
    const limit = (req.query.limit as string) ?? '12';

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    else if (!status) where.status = 'published'; // public sees published only
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true, title: true, slug: true, description: true,
          status: true, amount: true, membership: true,
          whatsapp_group_link: true, poster_url: true, payment_qr_url: true,
          registration_deadline: true, venue: true,
          _count: { select: { registrations: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: { events, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
      requestId: req.requestId,
    });
  } catch (err: any) {
    console.error('❌ GET /events failed:', err);
    res.status(500).json({ success: false, error: err.message ?? 'Failed to fetch events.', requestId: req.requestId });
  }
});

// ─── GET /events/:id — Public detail ─────────────────────────────────────────

router.get('/:id', publicLimiter, async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const event = await prisma.event.findFirst({
      where: { OR: [{ id: eventId }, { slug: eventId }] },
    });

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.', requestId: req.requestId });
      return;
    }

    res.json({ success: true, data: event, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ GET /events/:id failed:', err);
    res.status(500).json({ success: false, error: err.message ?? 'Failed to fetch event.', requestId: req.requestId });
  }
});

// ─── POST /events — Admin create ──────────────────────────────────────────────

router.post('/', requireAdmin, requireRole('event_manager'), validate(createEventSchema), async (req: AdminRequest, res: Response) => {
  try {
    const slug = (req.body.title as string)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      + '-' + Date.now();

    const event = await prisma.event.create({
      data: { ...req.body, slug, created_by: req.adminDbId! },
    });

    res.status(201).json({ success: true, data: event, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ POST /events failed:', err);
    res.status(500).json({ success: false, error: err.message ?? 'Failed to create event.', requestId: req.requestId });
  }
});

// ─── PATCH /events/:id — Admin update ────────────────────────────────────────

router.patch('/:id', requireAdmin, requireRole('event_manager'), validate(updateEventSchema), async (req: AdminRequest, res: Response) => {
  try {
    const eventId2 = String(req.params.id);
    const event = await prisma.event.update({
      where: { id: eventId2 },
      data: req.body,
    });

    res.json({ success: true, data: event, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ PATCH /events/:id failed:', err);
    res.status(500).json({ success: false, error: err.message ?? 'Failed to update event.', requestId: req.requestId });
  }
});

// ─── DELETE /events/:id — Super Admin only ────────────────────────────────────

router.delete('/:id', requireAdmin, requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const eventId3 = String(req.params.id);

    // Delete associated registrations first
    await prisma.registration.deleteMany({ where: { event_id: eventId3 } });
    await prisma.event.delete({ where: { id: eventId3 } });

    res.json({ success: true, data: { message: 'Event deleted successfully.' }, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ DELETE /events/:id failed:', err);
    res.status(500).json({ success: false, error: err.message ?? 'Failed to delete event.', requestId: req.requestId });
  }
});

export default router;
