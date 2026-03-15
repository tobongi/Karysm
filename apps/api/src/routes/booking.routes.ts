import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateRef, computeEndTime, canTransitionBooking, DEPOSIT_PERCENTAGE } from '@tokoss/shared';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createBookingSchema, updateBookingStatusSchema } from '../schemas';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';

const router = Router();

// POST /api/bookings
router.post('/', authMiddleware, validateBody(createBookingSchema), async (req: Request, res: Response) => {
  const clientId = req.user!.userId;
  const { providerId, serviceId, date, startTime, locationType, locationAddress, locationLat, locationLng, clientNotes, transportRequested } = req.body;

  // Validate provider and service
  const service = await prisma.service.findFirst({
    where: { id: serviceId, providerId, isActive: true },
  });
  if (!service) throw new NotFoundError('Service');

  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider || provider.status !== 'ACTIVE') throw new NotFoundError('Provider');

  // Compute end time
  const endTime = computeEndTime(startTime, service.durationMin);

  // Check for conflicts
  const conflict = await prisma.booking.findFirst({
    where: {
      providerId,
      date: new Date(date),
      status: { in: ['CONFIRMED', 'DEPOSIT_PAID', 'IN_PROGRESS'] },
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } },
      ],
    },
  });
  if (conflict) throw new ValidationError('Time slot not available');

  const depositAmount = Math.round(service.priceMin * DEPOSIT_PERCENTAGE);

  const booking = await prisma.booking.create({
    data: {
      ref: generateRef(),
      clientId,
      providerId,
      serviceId,
      date: new Date(date),
      startTime,
      endTime,
      locationType: locationType || 'CLIENT',
      locationAddress,
      locationLat,
      locationLng,
      agreedPrice: service.priceMin,
      currency: provider.currency,
      depositAmount,
      clientNotes,
      transportRequested: transportRequested || false,
    },
    include: { service: true, provider: { include: { user: { select: { name: true } } } } },
  });

  // TODO: Send WhatsApp notification to provider

  res.status(201).json({ success: true, data: booking });
});

// GET /api/bookings/mine
router.get('/mine', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const role = (req.query.role as string) || 'client';
  const status = req.query.status as string | undefined;

  let where: any;

  if (role === 'provider') {
    const provider = await prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new NotFoundError('Provider');
    where = { providerId: provider.id };
  } else {
    where = { clientId: userId };
  }

  if (status === 'upcoming') {
    where.date = { gte: new Date() };
    where.status = { in: ['REQUESTED', 'CONFIRMED', 'DEPOSIT_PAID'] };
  } else if (status === 'past') {
    where.status = { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      service: true,
      provider: { include: { user: { select: { name: true, avatar: true } } } },
      client: { select: { name: true, avatar: true, phone: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json({ success: true, data: bookings });
});

// GET /api/bookings/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: {
      service: { include: { category: true } },
      provider: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
      client: { select: { name: true, avatar: true, phone: true } },
      paymentIntents: true,
      transport: true,
      review: true,
    },
  });

  if (!booking) throw new NotFoundError('Booking');

  // Ensure user is client or provider
  const userId = req.user!.userId;
  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (booking.clientId !== userId && provider?.id !== booking.providerId) {
    throw new ForbiddenError();
  }

  res.json({ success: true, data: booking });
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', authMiddleware, validateBody(updateBookingStatusSchema), async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id as string } });
  if (!booking) throw new NotFoundError('Booking');

  const { status, reason, providerNotes } = req.body;

  if (!canTransitionBooking(booking.status, status)) {
    throw new ValidationError(`Cannot transition from ${booking.status} to ${status}`);
  }

  const updateData: any = { status };
  if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
  if (status === 'COMPLETED') updateData.completedAt = new Date();
  if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
    updateData.cancelReason = reason;
    updateData.cancelledBy = req.user!.role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT';
  }
  if (providerNotes) updateData.providerNotes = providerNotes;

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: updateData,
    include: { service: true },
  });

  // Update provider stats on completion
  if (status === 'COMPLETED') {
    await prisma.provider.update({
      where: { id: booking.providerId },
      data: { totalBookings: { increment: 1 } },
    });
  }

  res.json({ success: true, data: updated });
});

export default router;
