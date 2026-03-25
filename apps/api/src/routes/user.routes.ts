import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
}).strict();

// GET /api/user/profile
router.get('/profile', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: user });
}));

// PUT /api/user/profile
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const updated = await prisma.user.update({
    where: { id: req.user!.userId },
    data: req.body,
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
    },
  });
  res.json({ success: true, data: updated });
}));

export default router;
