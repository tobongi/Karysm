import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/favorites/:providerId — Toggle favorite
router.post('/:providerId', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const providerId = req.params.providerId as string;

  const existing = await prisma.favorite.findUnique({
    where: { userId_providerId: { userId, providerId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ success: true, favorited: false });
  }

  await prisma.favorite.create({ data: { userId, providerId } });
  res.json({ success: true, favorited: true });
});

// GET /api/favorites
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.userId },
    select: {
      id: true,
      providerId: true,
    },
  });

  // Get provider details
  const providerIds = favorites.map(f => f.providerId);
  const providers = await prisma.provider.findMany({
    where: { id: { in: providerIds } },
    include: {
      services: { where: { isActive: true }, take: 3 },
      user: { select: { name: true, avatar: true } },
    },
  });

  res.json({ success: true, data: providers });
});

export default router;
