import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../config/db';
import { requireClerkUser, AuthenticatedRequest } from '../middleware/requireClerkUser';
import { requireAdmin, AdminRequest } from '../middleware/requireAdmin';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { uploadToImageKit } from '../services/imagekit.service';
import { repairRegistrationNumbers } from '../services/repairRegistrationNumbers';
import { buildRegistrationNo, extractCourseCode } from '../utils/registrationNo';

const router = Router();

const registerSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  payment_proof_url: z.string().optional(),
  transaction_id: z.string().optional(),
});

const uploadProofSchema = z.object({
  file: z.string().min(1, 'File base64 string is required'),
  fileName: z.string().default('proof.png'),
});

// Generates the next unique registration no per event + course branch, e.g. RKDF/BTCSE/001
async function generateRegistrationNo(
  tx: Prisma.TransactionClient,
  course: string | undefined,
  eventId: string,
): Promise<string> {
  const courseCode = extractCourseCode(course);
  const prefix = `RKDF/${courseCode}/`;
  const lockKey = `${eventId}:${courseCode}`;

  // Prevent concurrent approvals from reading the same max sequence.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

  const existing = await tx.registration.findMany({
    where: {
      event_id: eventId,
      registration_no: { startsWith: prefix },
    },
    select: { registration_no: true },
  });

  let maxSeq = 0;
  for (const { registration_no } of existing) {
    if (!registration_no || registration_no.startsWith('__REPAIR__')) continue;
    const seq = parseInt(registration_no.slice(prefix.length), 10);
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  return buildRegistrationNo(courseCode, maxSeq + 1);
}

async function confirmRegistrationWithNumber(regId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.registration.findUnique({ where: { id: regId } });
    if (!existing) return null;

    let regNo = existing.registration_no;
    if (!regNo) {
      regNo = await generateRegistrationNo(tx, existing.course ?? undefined, existing.event_id);
    }

    return tx.registration.update({
      where: { id: regId },
      data: {
        status: 'confirmed',
        registration_no: regNo,
      },
    });
  });
}

// ─── POST /registrations/upload-proof — Student Upload Payment Proof ───────

router.post('/upload-proof', requireClerkUser, validate(uploadProofSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { file, fileName } = req.body;
    const url = await uploadToImageKit(file, fileName, 'payment_proofs');
    res.json({ success: true, data: { url }, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Payment proof upload failed.', requestId: req.requestId });
  }
});

// ─── POST /registrations — User Register for Event (Supports Re-submission) ──

router.post('/', requireClerkUser, validate(registerSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let user = await prisma.user.findUnique({ where: { clerk_user_id: req.clerkUserId! } });
    
    if (!user) {
      const formEmail = req.body.email?.trim();
      const existingEmailUser = formEmail ? await prisma.user.findUnique({ where: { email: formEmail } }) : null;

      if (existingEmailUser) {
        user = await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: { clerk_user_id: req.clerkUserId! },
        });
      } else {
        const userEmail = formEmail || `${req.clerkUserId}@codeved.local`;
        try {
          user = await prisma.user.create({
            data: {
              clerk_user_id: req.clerkUserId!,
              email: userEmail,
              name: req.body.name || 'Student User',
              phone: req.body.phone,
              branch: req.body.course,
            },
          });
        } catch {
          // Fallback if email collision occurs
          user = await prisma.user.create({
            data: {
              clerk_user_id: req.clerkUserId!,
              email: `${req.clerkUserId}@codeved.local`,
              name: req.body.name || 'Student User',
              phone: req.body.phone,
              branch: req.body.course,
            },
          });
        }
      }
    }

    const event = await prisma.event.findUnique({ where: { id: req.body.event_id } });
    if (!event || event.status !== 'published') {
      res.status(404).json({ success: false, error: 'Event not found or not available.', requestId: req.requestId });
      return;
    }

    if (event.registration_deadline && new Date() > event.registration_deadline) {
      res.status(400).json({ success: false, error: 'Registration deadline has passed.', requestId: req.requestId });
      return;
    }

    // Check existing registration for this user + event
    const existing = await prisma.registration.findFirst({
      where: { user_id: user.id, event_id: event.id },
    });

    let registration;
    if (existing) {
      // Update existing registration record with new form details
      registration = await prisma.registration.update({
        where: { id: existing.id },
        data: {
          status: 'pending',
          name: req.body.name || user.name,
          course: req.body.course || user.branch,
          semester: req.body.semester,
          email: req.body.email || user.email,
          phone: req.body.phone || user.phone,
          payment_proof_url: req.body.payment_proof_url,
          transaction_id: req.body.transaction_id,
        },
      });
    } else {
      if (event.max_participants) {
        const count = await prisma.registration.count({ where: { event_id: event.id, status: { not: 'cancelled' } } });
        if (count >= event.max_participants) {
          res.status(409).json({ success: false, error: 'Event is full.', requestId: req.requestId });
          return;
        }
      }

      registration = await prisma.registration.create({
        data: {
          user_id: user.id,
          event_id: event.id,
          status: 'pending',
          name: req.body.name || user.name,
          course: req.body.course || user.branch,
          semester: req.body.semester,
          email: req.body.email || user.email,
          phone: req.body.phone || user.phone,
          payment_proof_url: req.body.payment_proof_url,
          transaction_id: req.body.transaction_id,
        },
      });
    }

    res.status(201).json({ success: true, data: registration, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ Registration creation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Registration failed.', requestId: req.requestId });
  }
});

// ─── POST /registrations/solo — Alias ────────────────────────────────────────

router.post('/solo', requireClerkUser, validate(registerSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let user = await prisma.user.findUnique({ where: { clerk_user_id: req.clerkUserId! } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerk_user_id: req.clerkUserId!,
          email: `${req.clerkUserId}@codeved.local`,
          name: req.body.name || 'Student User',
          phone: req.body.phone,
        },
      });
    }

    const event = await prisma.event.findUnique({ where: { id: req.body.event_id } });
    if (!event || event.status !== 'published') {
      res.status(404).json({ success: false, error: 'Event not found or not available.', requestId: req.requestId });
      return;
    }

    const existing = await prisma.registration.findFirst({
      where: { user_id: user.id, event_id: event.id },
    });

    let registration;
    if (existing) {
      registration = await prisma.registration.update({
        where: { id: existing.id },
        data: {
          status: 'pending',
          name: req.body.name || user.name,
          course: req.body.course,
          semester: req.body.semester,
          email: req.body.email || user.email,
          phone: req.body.phone,
          payment_proof_url: req.body.payment_proof_url,
          transaction_id: req.body.transaction_id,
        },
      });
    } else {
      registration = await prisma.registration.create({
        data: {
          user_id: user.id,
          event_id: event.id,
          status: 'pending',
          name: req.body.name || user.name,
          course: req.body.course,
          semester: req.body.semester,
          email: req.body.email || user.email,
          phone: req.body.phone,
          payment_proof_url: req.body.payment_proof_url,
          transaction_id: req.body.transaction_id,
        },
      });
    }

    res.status(201).json({ success: true, data: registration, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Registration failed.', requestId: req.requestId });
  }
});

// ─── GET /registrations/my — Student Registrations ───────────────────────────

router.get('/my', requireClerkUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { clerk_user_id: req.clerkUserId! } });
    if (!user) { res.status(404).json({ success: false, error: 'User profile not found.' }); return; }

    const registrations = await prisma.registration.findMany({
      where: { user_id: user.id },
      include: { event: { select: { id: true, title: true, slug: true, amount: true, membership: true, poster_url: true, whatsapp_group_link: true, venue: true } } },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: registrations, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch registrations.', requestId: req.requestId });
  }
});

// ─── GET /registrations — Admin View List ─────────────────────────────────────

router.get('/', requireAdmin, requireRole('volunteer'), async (req: AdminRequest, res: Response) => {
  try {
    const event_id = req.query.event_id as string | undefined;
    const status = req.query.status as string | undefined;
    const page = (req.query.page as string) ?? '1';
    const limit = (req.query.limit as string) ?? '100';
    const where: any = {};
    if (event_id) where.event_id = event_id as string;
    if (status && status !== 'all') where.status = status as string;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 200);

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, college: true, phone: true } },
          event: { select: { id: true, title: true, amount: true } },
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
      prisma.registration.count({ where }),
    ]);

    res.json({ success: true, data: { registrations, total, page: pageNum }, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch registrations.', requestId: req.requestId });
  }
});

// ─── POST /registrations/repair-numbers — Admin Reassign All Registration Nos ─

router.post('/repair-numbers', requireAdmin, requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const result = await repairRegistrationNumbers();
    res.json({ success: true, data: result, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ Repair registration numbers error:', err);
    res.status(500).json({ success: false, error: 'Failed to repair registration numbers.', requestId: req.requestId });
  }
});

// ─── PATCH /registrations/:id/approve — Admin Approve (Generates Registration No)

router.patch('/:id/approve', requireAdmin, requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const regId = String(req.params.id);
    const updated = await confirmRegistrationWithNumber(regId);
    if (!updated) { res.status(404).json({ success: false, error: 'Registration not found.', requestId: req.requestId }); return; }

    res.json({ success: true, data: updated, requestId: req.requestId });
  } catch (err: any) {
    console.error('❌ Approve registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to approve registration.', requestId: req.requestId });
  }
});

// ─── PATCH /registrations/:id/status — Admin Change Status ────────────────────

router.patch('/:id/status', requireAdmin, requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const regId = String(req.params.id);
    const { status } = req.body;

    if (status === 'confirmed') {
      const updated = await confirmRegistrationWithNumber(regId);
      if (!updated) { res.status(404).json({ success: false, error: 'Registration not found.', requestId: req.requestId }); return; }
      res.json({ success: true, data: updated, requestId: req.requestId });
      return;
    }

    const existing = await prisma.registration.findUnique({ where: { id: regId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Registration not found.', requestId: req.requestId }); return; }

    const updated = await prisma.registration.update({
      where: { id: regId },
      data: { status },
    });

    res.json({ success: true, data: updated, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update status.', requestId: req.requestId });
  }
});

// ─── PATCH /registrations/:id — Admin Edit Student Details ───────────────────

router.patch('/:id', requireAdmin, requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const regId = String(req.params.id);
    const updated = await prisma.registration.update({
      where: { id: regId },
      data: req.body,
    });
    res.json({ success: true, data: updated, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update registration.', requestId: req.requestId });
  }
});

// ─── DELETE /registrations/:id — Admin Delete Registration ───────────────────

router.delete('/:id', requireAdmin, requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const regId = String(req.params.id);
    await prisma.registration.delete({ where: { id: regId } });
    res.json({ success: true, data: { message: 'Registration deleted successfully.' }, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete registration.', requestId: req.requestId });
  }
});

// ─── PATCH /registrations/:id/attendance — Volunteer ─────────────────────────

router.patch('/:id/attendance', requireAdmin, requireRole('volunteer'), async (req: AdminRequest, res: Response) => {
  try {
    const regId = String(req.params.id);
    const existing = await prisma.registration.findUnique({ where: { id: regId } });
    if (!existing) { res.status(404).json({ success: false, error: 'Registration not found.', requestId: req.requestId }); return; }
    if (existing.attended_at) {
      res.status(409).json({ success: false, error: 'Already marked attended.', requestId: req.requestId }); return;
    }

    const updated = await prisma.registration.update({
      where: { id: regId },
      data: { status: 'attended', attended_at: new Date() },
    });

    res.json({ success: true, data: updated, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mark attendance.', requestId: req.requestId });
  }
});

export default router;
