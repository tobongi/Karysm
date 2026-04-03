import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/categories
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.serviceCategory.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { services: true } } },
      },
      _count: { select: { services: true } },
    },
  });
  res.json({ success: true, data: categories });
}));

export default router;
