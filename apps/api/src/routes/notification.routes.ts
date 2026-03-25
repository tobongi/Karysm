import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/notifications — list my notifications (paginated)
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}));

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id as string },
  });

  if (!notification || notification.userId !== req.user!.userId) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
  }

  res.json({ success: true });
}));

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ success: true });
}));

// POST /api/notifications/push-token — register push token
router.post('/push-token', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Token required' });
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { pushToken: token },
  });

  res.json({ success: true });
}));

export default router;
