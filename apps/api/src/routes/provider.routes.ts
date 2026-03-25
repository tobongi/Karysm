import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { slugify } from '@tokoss/shared';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { providerProfileSchema, serviceSchema, availabilitySchema } from '../schemas';
import { NotFoundError, ConflictError } from '../lib/errors';
import { asyncHandler } from '../middleware/error';

const router = Router();

// POST /api/provider/register — Become a provider
router.post('/register', authMiddleware, validateBody(providerProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const existing = await prisma.provider.findUnique({ where: { userId } });
  if (existing) throw new ConflictError('Already a provider');

  let slug = slugify(req.body.displayName);
  const slugExists = await prisma.provider.findUnique({ where: { slug } });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  const provider = await prisma.provider.create({
    data: { userId, slug, ...req.body },
  });

  // Upgrade user role
  await prisma.user.update({ where: { id: userId }, data: { role: 'PROVIDER' } });

  // Create wallet
  await prisma.providerWallet.create({
    data: { providerId: provider.id, currency: req.body.currency || 'CDF' },
  });

  res.status(201).json({ success: true, data: provider });
}));

// GET /api/provider/profile
router.get('/profile', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.user!.userId },
    include: { services: true, availability: true, wallet: true },
  });
  if (!provider) throw new NotFoundError('Provider');
  res.json({ success: true, data: provider });
}));

// PUT /api/provider/profile
router.put('/profile', authMiddleware, requireRole('PROVIDER'), validateBody(providerProfileSchema), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: req.body,
  });
  res.json({ success: true, data: updated });
}));

// POST /api/provider/services
router.post('/services', authMiddleware, requireRole('PROVIDER'), validateBody(serviceSchema), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const service = await prisma.service.create({
    data: { providerId: provider.id, ...req.body },
  });
  res.status(201).json({ success: true, data: service });
}));

// GET /api/provider/services
router.get('/services', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const services = await prisma.service.findMany({
    where: { providerId: provider.id },
    include: { category: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: services });
}));

// PUT /api/provider/services/:id
router.put('/services/:id', authMiddleware, requireRole('PROVIDER'), validateBody(serviceSchema), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const service = await prisma.service.findFirst({ where: { id: req.params.id as string, providerId: provider.id } });
  if (!service) throw new NotFoundError('Service');

  const updated = await prisma.service.update({ where: { id: service.id }, data: req.body });
  res.json({ success: true, data: updated });
}));

// DELETE /api/provider/services/:id
router.delete('/services/:id', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const service = await prisma.service.findFirst({ where: { id: req.params.id as string, providerId: provider.id } });
  if (!service) throw new NotFoundError('Service');

  await prisma.service.delete({ where: { id: service.id } });
  res.json({ success: true });
}));

// PUT /api/provider/availability
router.put('/availability', authMiddleware, requireRole('PROVIDER'), validateBody(availabilitySchema), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  // Upsert each day
  for (const slot of req.body.schedule) {
    await prisma.availability.upsert({
      where: { providerId_dayOfWeek: { providerId: provider.id, dayOfWeek: slot.dayOfWeek } },
      update: { startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive ?? true },
      create: { providerId: provider.id, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
    });
  }

  const availability = await prisma.availability.findMany({ where: { providerId: provider.id } });
  res.json({ success: true, data: availability });
}));

export default router;
