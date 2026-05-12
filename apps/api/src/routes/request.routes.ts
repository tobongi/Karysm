import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateRef, computeEndTime } from '@karysm/shared';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createBeautyRequestSchema,
  updateBeautyRequestSchema,
  createProposalSchema,
  browseRequestsSchema,
} from '../schemas';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import { asyncHandler } from '../middleware/error';

const router = Router();

// POST /api/requests — Create beauty request (client only)
router.post('/', authMiddleware, validateBody(createBeautyRequestSchema), asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user!.userId;

  const {
    title, description, categoryId, photos, selfieUrl,
    budgetMin, budgetMax, currency, preferredDate, flexibleDate,
    locationType, locationAddress, locationLat, locationLng, city,
  } = req.body;

  // Validate budget range
  if (budgetMax < budgetMin) {
    throw new ValidationError('Le budget max doit être supérieur au budget min');
  }

  // Validate category exists
  const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new NotFoundError('Category');

  // Expires in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const request = await prisma.beautyRequest.create({
    data: {
      clientId,
      title,
      description,
      categoryId,
      photos: photos || [],
      selfieUrl,
      budgetMin,
      budgetMax,
      currency: currency || 'CDF',
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      flexibleDate: flexibleDate || false,
      locationType: locationType || 'CLIENT',
      locationAddress,
      locationLat,
      locationLng,
      city,
      expiresAt,
    },
    include: {
      client: { select: { name: true, avatar: true } },
    },
  });

  res.status(201).json({ success: true, data: request });
}));

// GET /api/requests — List open requests (for providers to browse)
router.get('/', authMiddleware, validateQuery(browseRequestsSchema), asyncHandler(async (req: Request, res: Response) => {
  const { city, category } = req.query as { city?: string; category?: string };
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const where: any = {
    status: 'OPEN',
    expiresAt: { gt: new Date() },
  };

  if (city) where.city = city;
  if (category) where.categoryId = category;

  const [items, total] = await Promise.all([
    prisma.beautyRequest.findMany({
      where,
      include: {
        client: { select: { name: true, avatar: true } },
        proposals: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.beautyRequest.count({ where }),
  ]);

  const data = items.map((item) => ({
    ...item,
    proposalCount: item.proposals.length,
    proposals: undefined,
  }));

  res.json({ success: true, data: { items: data, total, page, pageSize } });
}));

// GET /api/requests/mine — My requests (client)
router.get('/mine', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user!.userId;
  const status = req.query.status as string | undefined;

  const where: any = { clientId };
  if (status) where.status = status;

  const requests = await prisma.beautyRequest.findMany({
    where,
    include: {
      proposals: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = requests.map((r) => ({
    ...r,
    proposalCount: r.proposals.length,
    pendingCount: r.proposals.filter((p) => p.status === 'PENDING').length,
  }));

  res.json({ success: true, data });
}));

// GET /api/requests/:id — Request detail with proposals
router.get('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.beautyRequest.findUnique({
    where: { id: req.params.id as string },
    include: {
      client: { select: { id: true, name: true, avatar: true } },
      proposals: {
        include: {
          request: false,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!request) throw new NotFoundError('BeautyRequest');

  // If not the client owner, hide other proposals — only show the provider's own
  const userId = req.user!.userId;
  const provider = await prisma.provider.findUnique({ where: { userId } });

  let proposals = request.proposals;
  if (request.clientId !== userId) {
    // Provider viewing: only show their own proposal
    proposals = provider
      ? proposals.filter((p) => p.providerId === provider.id)
      : [];
  }

  // Enrich proposals with provider info
  const enrichedProposals = await Promise.all(
    proposals.map(async (p) => {
      const prov = await prisma.provider.findUnique({
        where: { id: p.providerId },
        include: { user: { select: { name: true, avatar: true } } },
      });
      return {
        ...p,
        provider: prov ? {
          id: prov.id,
          displayName: prov.displayName,
          slug: prov.slug,
          avgRating: prov.avgRating,
          totalReviews: prov.totalReviews,
          city: prov.city,
          user: prov.user,
        } : null,
      };
    })
  );

  res.json({
    success: true,
    data: {
      ...request,
      proposals: enrichedProposals,
      isOwner: request.clientId === userId,
      hasProposed: provider ? proposals.some((p) => p.providerId === provider.id) : false,
    },
  });
}));

// PATCH /api/requests/:id — Update request (if OPEN)
router.patch('/:id', authMiddleware, validateBody(updateBeautyRequestSchema), asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.beautyRequest.findUnique({
    where: { id: req.params.id as string },
  });
  if (!request) throw new NotFoundError('BeautyRequest');
  if (request.clientId !== req.user!.userId) throw new ForbiddenError();
  if (request.status !== 'OPEN') throw new ValidationError('Seules les demandes ouvertes peuvent être modifiées');

  const updated = await prisma.beautyRequest.update({
    where: { id: request.id },
    data: {
      ...req.body,
      preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
    },
  });

  res.json({ success: true, data: updated });
}));

// DELETE /api/requests/:id — Cancel request
router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.beautyRequest.findUnique({
    where: { id: req.params.id as string },
  });
  if (!request) throw new NotFoundError('BeautyRequest');
  if (request.clientId !== req.user!.userId) throw new ForbiddenError();
  if (['ACCEPTED', 'COMPLETED'].includes(request.status)) {
    throw new ValidationError('Cette demande ne peut plus être annulée');
  }

  await prisma.beautyRequest.update({
    where: { id: request.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true, message: 'Demande annulée' });
}));

// POST /api/requests/:id/proposals — Provider sends proposal
router.post('/:id/proposals', authMiddleware, validateBody(createProposalSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const provider = await prisma.provider.findUnique({ where: { userId } });
  if (!provider) throw new ForbiddenError('Vous devez être prestataire');
  if (provider.status !== 'ACTIVE') throw new ValidationError('Votre profil prestataire doit être actif');

  const request = await prisma.beautyRequest.findUnique({
    where: { id: req.params.id as string },
  });
  if (!request) throw new NotFoundError('BeautyRequest');
  if (request.status !== 'OPEN' && request.status !== 'IN_REVIEW') {
    throw new ValidationError('Cette demande n\'accepte plus de propositions');
  }
  if (request.expiresAt < new Date()) {
    throw new ValidationError('Cette demande a expiré');
  }

  // Check if already proposed
  const existing = await prisma.proposal.findUnique({
    where: { requestId_providerId: { requestId: request.id, providerId: provider.id } },
  });
  if (existing) throw new ValidationError('Vous avez déjà soumis une proposition');

  const { price, currency, message, estimatedDuration, portfolioSamples } = req.body;

  const proposal = await prisma.proposal.create({
    data: {
      requestId: request.id,
      providerId: provider.id,
      price,
      currency: currency || request.currency,
      message,
      estimatedDuration,
      portfolioSamples: portfolioSamples || [],
    },
  });

  // Move to IN_REVIEW if still OPEN
  if (request.status === 'OPEN') {
    await prisma.beautyRequest.update({
      where: { id: request.id },
      data: { status: 'IN_REVIEW' },
    });
  }

  res.status(201).json({ success: true, data: proposal });
}));

// GET /api/requests/:id/proposals — List proposals (client who owns request)
router.get('/:id/proposals', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.beautyRequest.findUnique({
    where: { id: req.params.id as string },
  });
  if (!request) throw new NotFoundError('BeautyRequest');
  if (request.clientId !== req.user!.userId) throw new ForbiddenError();

  const proposals = await prisma.proposal.findMany({
    where: { requestId: request.id },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich with provider info
  const enriched = await Promise.all(
    proposals.map(async (p) => {
      const prov = await prisma.provider.findUnique({
        where: { id: p.providerId },
        include: { user: { select: { name: true, avatar: true } } },
      });
      return {
        ...p,
        provider: prov ? {
          id: prov.id,
          displayName: prov.displayName,
          slug: prov.slug,
          avgRating: prov.avgRating,
          totalReviews: prov.totalReviews,
          city: prov.city,
          user: prov.user,
        } : null,
      };
    })
  );

  res.json({ success: true, data: enriched });
}));

// PATCH /api/requests/:id/accept/:proposalId — Accept proposal → creates booking
router.patch('/:id/accept/:proposalId', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.beautyRequest.findUnique({
    where: { id: req.params.id as string },
  });
  if (!request) throw new NotFoundError('BeautyRequest');
  if (request.clientId !== req.user!.userId) throw new ForbiddenError();
  if (request.status !== 'OPEN' && request.status !== 'IN_REVIEW') {
    throw new ValidationError('Cette demande ne peut plus accepter de propositions');
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.proposalId as string },
  });
  if (!proposal || proposal.requestId !== request.id) throw new NotFoundError('Proposal');
  if (proposal.status !== 'PENDING') throw new ValidationError('Cette proposition n\'est plus disponible');

  // Fetch provider for booking
  const provider = await prisma.provider.findUnique({
    where: { id: proposal.providerId },
  });
  if (!provider) throw new NotFoundError('Provider');

  // Find a service from this provider in the request's category
  const service = await prisma.service.findFirst({
    where: { providerId: provider.id, categoryId: request.categoryId, isActive: true },
  });

  // Determine booking date and time
  const bookingDate = request.preferredDate || new Date();
  const startTime = '10:00';
  const endTime = computeEndTime(startTime, proposal.estimatedDuration);

  // Transaction: accept proposal, reject others, update request, create booking
  const result = await prisma.$transaction(async (tx) => {
    // 1. Accept this proposal
    await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: 'ACCEPTED' },
    });

    // 2. Reject all other proposals
    await tx.proposal.updateMany({
      where: { requestId: request.id, id: { not: proposal.id } },
      data: { status: 'REJECTED' },
    });

    // 3. Update request status
    await tx.beautyRequest.update({
      where: { id: request.id },
      data: { status: 'ACCEPTED' },
    });

    // 4. Create booking
    const booking = await tx.booking.create({
      data: {
        ref: generateRef(),
        clientId: request.clientId,
        providerId: provider.id,
        serviceId: service?.id || '',
        date: bookingDate,
        startTime,
        endTime,
        locationType: request.locationType,
        locationAddress: request.locationAddress,
        locationLat: request.locationLat,
        locationLng: request.locationLng,
        agreedPrice: proposal.price,
        currency: proposal.currency,
        clientNotes: `Demande: ${request.title}`,
        status: 'REQUESTED',
      },
      include: {
        service: true,
        provider: { include: { user: { select: { name: true } } } },
      },
    });

    return booking;
  });

  res.json({ success: true, data: result });
}));

export default router;
