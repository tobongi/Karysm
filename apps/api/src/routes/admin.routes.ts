import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { createNotification } from '../lib/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'tokoss-dev-secret';

const router = Router();

// POST /api/admin/login — Admin login (before auth middleware)
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    return res.status(401).json({ success: false, error: 'Identifiants invalides' });
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Identifiants invalides' });
  }

  const token = jwt.sign(
    { userId: admin.id, role: 'ADMIN', phone: '' },
    JWT_SECRET,
    { expiresIn: '24h' },
  );

  res.json({
    success: true,
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}));

// All remaining admin routes require ADMIN role
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

// GET /api/admin/kyc/pending — KYC documents awaiting review
router.get('/kyc/pending', asyncHandler(async (_req: Request, res: Response) => {
  const documents = await prisma.kycDocument.findMany({
    where: { status: 'PENDING' },
    include: {
      provider: {
        select: { id: true, displayName: true, slug: true, city: true, user: { select: { name: true, phone: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: documents });
}));

// PATCH /api/admin/kyc/:id/approve
router.patch('/kyc/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const doc = await prisma.kycDocument.findUnique({
    where: { id: req.params.id as string },
    include: { provider: { select: { id: true, userId: true } } },
  });
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

  await prisma.kycDocument.update({
    where: { id: doc.id },
    data: { status: 'APPROVED', reviewedBy: req.user!.userId, reviewedAt: new Date() },
  });

  // Check if all 3 documents are approved
  const allDocs = await prisma.kycDocument.findMany({
    where: { providerId: doc.providerId },
  });
  const approvedTypes = new Set(allDocs.filter(d => d.status === 'APPROVED').map(d => d.type));
  const allApproved = approvedTypes.has('ID_FRONT') && approvedTypes.has('ID_BACK') && approvedTypes.has('SELFIE_WITH_ID');

  if (allApproved) {
    await prisma.provider.update({
      where: { id: doc.providerId },
      data: { idVerified: true, kycStatus: 'APPROVED' },
    });

    // Notify provider
    createNotification({
      userId: doc.provider.userId,
      type: 'KYC_APPROVED',
      title: 'Identité vérifiée ✅',
      body: 'Votre identité a été vérifiée avec succès. Le badge vérifié est actif !',
    }).catch(err => console.error('KYC notification error:', err));
  }

  res.json({ success: true, allApproved });
}));

// PATCH /api/admin/kyc/:id/reject
router.patch('/kyc/:id/reject', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const doc = await prisma.kycDocument.findUnique({
    where: { id: req.params.id as string },
    include: { provider: { select: { id: true, userId: true } } },
  });
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

  await prisma.kycDocument.update({
    where: { id: doc.id },
    data: { status: 'REJECTED', rejectedReason: reason || 'Document non conforme', reviewedBy: req.user!.userId, reviewedAt: new Date() },
  });

  await prisma.provider.update({
    where: { id: doc.providerId },
    data: { kycStatus: 'REJECTED', idVerified: false },
  });

  // Notify provider
  createNotification({
    userId: doc.provider.userId,
    type: 'KYC_REJECTED',
    title: 'Document refusé',
    body: reason || 'Votre document n\'est pas conforme. Veuillez le soumettre à nouveau.',
  }).catch(err => console.error('KYC notification error:', err));

  res.json({ success: true });
}));

// GET /api/admin/reviews — list all reviews for moderation
router.get('/reviews', asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    include: {
      client: { select: { name: true } },
      booking: { select: { ref: true, provider: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: reviews });
}));

// PATCH /api/admin/reviews/:id/visibility — toggle review visibility
router.patch('/reviews/:id/visibility', asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id as string } });
  if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { isVisible: !review.isVisible },
  });
  res.json({ success: true, data: updated });
}));

export default router;
