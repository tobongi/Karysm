import { Router } from 'express';
import { prisma } from '@karysm/db';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/feed — Public feed of portfolio items (newest first)
router.get('/', asyncHandler(async (req, res) => {
  const { category, page = '1', pageSize = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Math.min(Number(pageSize), 50);

  const where: any = {};
  if (category) {
    where.serviceTag = category as string;
  }

  const [items, total] = await Promise.all([
    prisma.portfolioItem.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            city: true,
            avgRating: true,
            instagramHandle: true,
            tiktokHandle: true,
            user: { select: { avatar: true } },
          },
        },
        _count: { select: { savedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.portfolioItem.count({ where }),
  ]);

  res.json({
    data: {
      items: items.map(item => ({
        id: item.id,
        imageUrl: item.imageUrl,
        caption: item.caption,
        serviceTag: item.serviceTag,
        savedCount: item._count.savedBy,
        createdAt: item.createdAt,
        provider: {
          id: item.provider.id,
          slug: item.provider.slug,
          displayName: item.provider.displayName,
          city: item.provider.city,
          avgRating: item.provider.avgRating,
          avatar: item.provider.user?.avatar,
          instagramHandle: item.provider.instagramHandle,
          tiktokHandle: item.provider.tiktokHandle,
        },
      })),
      total,
      page: Number(page),
      pageSize: take,
    },
  });
}));

// GET /api/feed/saved — Get user's saved looks (auth required)
// NOTE: This route must be registered BEFORE /:id/save to avoid "saved" matching as an :id
router.get('/saved', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  const saved = await prisma.savedLook.findMany({
    where: { userId },
    include: {
      portfolioItem: {
        include: {
          provider: {
            select: {
              id: true,
              slug: true,
              displayName: true,
              city: true,
              avgRating: true,
              user: { select: { avatar: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: saved.map(s => ({
      id: s.portfolioItem.id,
      imageUrl: s.portfolioItem.imageUrl,
      caption: s.portfolioItem.caption,
      serviceTag: s.portfolioItem.serviceTag,
      savedAt: s.createdAt,
      provider: {
        id: s.portfolioItem.provider.id,
        slug: s.portfolioItem.provider.slug,
        displayName: s.portfolioItem.provider.displayName,
        city: s.portfolioItem.provider.city,
        avgRating: s.portfolioItem.provider.avgRating,
        avatar: s.portfolioItem.provider.user?.avatar,
      },
    })),
  });
}));

// POST /api/feed/:id/save — Toggle save a portfolio item (auth required)
router.post('/:id/save', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const portfolioItemId = req.params.id;

  // Check if already saved
  const existing = await prisma.savedLook.findUnique({
    where: { userId_portfolioItemId: { userId, portfolioItemId } },
  });

  if (existing) {
    await prisma.savedLook.delete({ where: { id: existing.id } });
    res.json({ saved: false });
  } else {
    await prisma.savedLook.create({ data: { userId, portfolioItemId } });
    res.json({ saved: true });
  }
}));

export default router;
