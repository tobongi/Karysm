import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { services: true } },
    },
  });
  res.json({ success: true, data: categories });
});

export default router;
