import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAdmin, AdminRequest } from '../middleware/requireAdmin';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { hashPassword } from '../services/adminAuth.service';
import { logAudit } from '../services/adminAuth.service';
import { uploadToImageKit } from '../services/imagekit.service';

const router = Router();

// All admin routes require admin session
router.use(requireAdmin);

const createAdminSchema = z.object({
  admin_id: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
  display_name: z.string().min(1).max(100),
  role: z.enum(['super_admin', 'event_manager', 'volunteer']),
});

const updateOwnProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  admin_id: z.string().min(3).max(50).optional(),
  password: z.string().min(8).max(128).optional(),
});

const updateOtherAdminSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  admin_id: z.string().min(3).max(50).optional(),
  role: z.enum(['super_admin', 'event_manager', 'volunteer']).optional(),
  password: z.string().min(8).max(128).optional(),
});

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  scope: z.enum(['all', 'registered', 'event']).default('all'),
  event_id: z.string().uuid().optional(),
});

// ─── GET /admin/me — Get Current Admin Profile ─────────────────────────────

router.get('/me', async (req: AdminRequest, res: Response) => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminDbId! },
      select: { id: true, admin_id: true, display_name: true, role: true, created_at: true },
    });
    if (!admin) { res.status(404).json({ success: false, error: 'Admin not found.' }); return; }
    res.json({ success: true, data: admin, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Failed to fetch admin profile.', requestId: req.requestId });
  }
});

// ─── PATCH /admin/me — Update Own Admin Profile ──────────────────────────────

router.patch('/me', validate(updateOwnProfileSchema), async (req: AdminRequest, res: Response) => {
  try {
    const updateData: any = {};
    if (req.body.display_name) updateData.display_name = req.body.display_name;
    if (req.body.admin_id) updateData.admin_id = req.body.admin_id;
    if (req.body.password) {
      updateData.password_hash = await hashPassword(req.body.password);
    }

    const updated = await prisma.adminUser.update({
      where: { id: req.adminDbId! },
      data: updateData,
      select: { id: true, admin_id: true, display_name: true, role: true },
    });

    await logAudit({
      actorId: req.adminDbId!,
      action: 'admin.update_own_profile',
      resource: `admin_users:${req.adminDbId}`,
      ip: req.ip,
      requestId: req.requestId,
    });

    res.json({ success: true, data: updated, requestId: req.requestId });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Admin ID / Username already taken.', requestId: req.requestId });
    } else {
      res.status(500).json({ success: false, error: err.message ?? 'Failed to update profile.', requestId: req.requestId });
    }
  }
});

// ─── GET /admin/dashboard/stats ───────────────────────────────────────────────

router.get('/dashboard/stats', requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const [
      totalEvents, publishedEvents, totalStudents,
      totalRegistrations, confirmedRegistrations,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'published' } }),
      prisma.user.count(),
      prisma.registration.count(),
      prisma.registration.count({ where: { status: 'confirmed' } }),
    ]);

    const recentRegistrations = await prisma.registration.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
      },
    });

    res.json({
      success: true,
      data: {
        totalEvents, publishedEvents, totalStudents,
        totalRegistrations, confirmedRegistrations,
        recentRegistrations,
      },
      requestId: req.requestId,
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stats.', requestId: req.requestId });
  }
});

// ─── GET /admin/admins — List all admins (Super Admin only) ───────────────────

router.get('/admins', requireRole('super_admin'), async (req: AdminRequest, res: Response) => {
  const admins = await prisma.adminUser.findMany({
    select: { id: true, admin_id: true, display_name: true, role: true, is_active: true, last_login_at: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  res.json({ success: true, data: admins, requestId: req.requestId });
});

// ─── POST /admin/admins — Create admin (Super Admin only) ────────────────────

router.post('/admins', requireRole('super_admin'), validate(createAdminSchema), async (req: AdminRequest, res: Response) => {
  try {
    const password_hash = await hashPassword(req.body.password);
    const admin = await prisma.adminUser.create({
      data: {
        admin_id: req.body.admin_id,
        password_hash,
        display_name: req.body.display_name,
        role: req.body.role,
        created_by: req.adminDbId,
      },
      select: { id: true, admin_id: true, display_name: true, role: true, created_at: true },
    });

    await logAudit({
      actorId: req.adminDbId!,
      action: 'admin.create',
      resource: `admin_users:${admin.id}`,
      ip: req.ip,
      requestId: req.requestId,
    });

    res.status(201).json({ success: true, data: admin, requestId: req.requestId });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Admin ID already exists.', requestId: req.requestId });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create admin.', requestId: req.requestId });
    }
  }
});

// ─── PATCH /admin/admins/:id — Super Admin Update Other Admin ────────────────

router.patch('/admins/:id', requireRole('super_admin'), validate(updateOtherAdminSchema), async (req: AdminRequest, res: Response) => {
  try {
    const targetId = String(req.params.id);
    const updateData: any = {};
    if (req.body.display_name) updateData.display_name = req.body.display_name;
    if (req.body.admin_id) updateData.admin_id = req.body.admin_id;
    if (req.body.role) updateData.role = req.body.role;
    if (req.body.password) {
      updateData.password_hash = await hashPassword(req.body.password);
    }

    const updated = await prisma.adminUser.update({
      where: { id: targetId },
      data: updateData,
      select: { id: true, admin_id: true, display_name: true, role: true },
    });

    await logAudit({
      actorId: req.adminDbId!,
      action: 'admin.update_other',
      resource: `admin_users:${targetId}`,
      ip: req.ip,
      requestId: req.requestId,
    });

    res.json({ success: true, data: updated, requestId: req.requestId });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'Admin ID already exists.', requestId: req.requestId });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update admin.', requestId: req.requestId });
    }
  }
});

// ─── DELETE /admin/admins/:id — Super Admin Delete Other Admin ───────────────

router.delete('/admins/:id', requireRole('super_admin'), async (req: AdminRequest, res: Response) => {
  try {
    const targetId = String(req.params.id);
    if (targetId === req.adminDbId) {
      res.status(400).json({ success: false, error: 'You cannot delete your own Super Admin account.', requestId: req.requestId });
      return;
    }

    // Delete refresh tokens first
    await prisma.adminRefreshToken.deleteMany({ where: { admin_user_id: targetId } });
    await prisma.adminUser.delete({ where: { id: targetId } });

    await logAudit({
      actorId: req.adminDbId!,
      action: 'admin.delete',
      resource: `admin_users:${targetId}`,
      ip: req.ip,
      requestId: req.requestId,
    });

    res.json({ success: true, data: { message: 'Admin account deleted successfully.' }, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to delete admin.', requestId: req.requestId });
  }
});

// ─── GET /admin/audit-logs ────────────────────────────────────────────────────

router.get('/audit-logs', requireRole('super_admin'), async (req: AdminRequest, res: Response) => {
  try {
    const page = (req.query.page as string) ?? '1';
    const limit = (req.query.limit as string) ?? '50';
    const action = req.query.action as string | undefined;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 200);

    const where: any = {};
    if (action) where.action = { contains: action as string };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    res.json({ success: true, data: logs, requestId: req.requestId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs.', requestId: req.requestId });
  }
});




// ─── GET /admin/export/registrations — CSV Export ────────────────────────────

router.get('/export/registrations', requireRole('event_manager'), async (req: AdminRequest, res: Response) => {
  try {
    const { event_id } = req.query;
    const where: any = {};
    if (event_id) where.event_id = event_id as string;

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, college: true, branch: true, year: true, phone: true } },
        event: { select: { title: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    await logAudit({
      actorId: req.adminDbId!,
      action: 'admin.export.registrations',
      resource: event_id ? `event:${event_id}` : 'all',
      ip: req.ip,
      requestId: req.requestId,
    });

    const headers = ['Event', 'Name', 'Email', 'College', 'Branch', 'Year', 'Phone', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      r.event.title, r.user.name, r.user.email,
      r.user.college ?? '', r.user.branch ?? '',
      r.user.year ?? '', r.user.phone ?? '',
      r.status, r.created_at.toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    res.send(csv);
  } catch {
    res.status(500).json({ success: false, error: 'Export failed.', requestId: req.requestId });
  }
});

// ─── POST /admin/upload — Upload Image to ImageKit ────────────────────────────

const uploadSchema = z.object({
  file: z.string().min(1, 'File base64 string is required'),
  fileName: z.string().default('upload.png'),
  folder: z.enum(['posters', 'payment_qrs']),
});

router.post('/upload', requireRole('event_manager'), validate(uploadSchema), async (req: AdminRequest, res: Response) => {
  try {
    const { file, fileName, folder } = req.body;
    const url = await uploadToImageKit(file, fileName, folder);
    res.json({ success: true, data: { url }, requestId: req.requestId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message ?? 'Image upload failed.', requestId: req.requestId });
  }
});

export default router;
