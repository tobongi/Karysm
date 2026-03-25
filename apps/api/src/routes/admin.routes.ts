import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// All admin routes require ADMIN role
router.use(authMiddleware, requireRole('ADMIN'));

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalProviders, activeProviders, pendingProviders, totalBookings, totalUsers] = await Promise.all([
    prisma.provider.count(),
    prisma.provider.count({ where: { status: 'ACTIVE' } }),
    prisma.provider.count({ where: { status: 'PENDING' } }),
    prisma.booking.count(),
    prisma.user.count(),
  ]);

  res.json({
    success: true,
    data: {
      totalProviders,
      activeProviders,
      pendingProviders,
      totalBookings,
      totalUsers,
    },
  });
}));

// GET /api/admin/providers
router.get('/providers', asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const where: any = {};
  if (status) where.status = status;

  const providers = await prisma.provider.findMany({
    where,
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: providers });
}));

// PATCH /api/admin/providers/:id
router.patch('/providers/:id', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const provider = await prisma.provider.update({
    where: { id: req.params.id as string },
    data: { status },
  });
  res.json({ success: true, data: provider });
}));

// GET /api/admin/bookings
router.get('/bookings', asyncHandler(async (req: Request, res: Response) => {
  const bookings = await prisma.booking.findMany({
    include: {
      service: true,
      client: { select: { name: true, phone: true } },
      provider: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: bookings });
}));

export default router;
