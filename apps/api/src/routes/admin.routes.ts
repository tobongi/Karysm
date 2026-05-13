import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireRole, generateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { createNotification, sendBookingReminders } from '../lib/notifications';

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

  const token = generateToken({ userId: admin.id, role: 'ADMIN', phone: '' });

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

// POST /api/admin/send-reminders — can be called by a cron job
router.post('/send-reminders', asyncHandler(async (_req: Request, res: Response) => {
  const count = await sendBookingReminders();
  res.json({ success: true, remindersSent: count });
}));

// GET /api/admin/training-data/:type — export consented analyses as OpenAI fine-tuning JSONL
// type = skin | hair
router.get('/training-data/:type', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  if (type !== 'skin' && type !== 'hair') {
    return res.status(400).json({ success: false, error: 'type must be skin or hair' });
  }

  const SKIN_PROMPT = `Tu es une experte dermatologue spécialisée dans les peaux mélanisées. Analyse cette photo de visage/peau et réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour. Champs requis: monkTone (1-10), undertone (WARM/COOL/NEUTRAL), hydration, sebum, pores, wrinkles, spots, acne, hyperpigmentation, uniformity (tous 0-100), overallScore (0-100), recommendations (6 conseils FR avec emojis), reasoning (1-2 phrases).`;
  const HAIR_PROMPT = `Tu es une experte trichologue spécialisée dans les cheveux afro-texturés. Analyse cette photo et réponds UNIQUEMENT avec un objet JSON valide. Champs requis: hairType (3C/4A/4B/4C), porosity (LOW/MEDIUM/HIGH), density (LOW/MEDIUM/HIGH), thickness (FINE/MEDIUM/COARSE), dryness, elasticity, shrinkage, overallScore (tous 0-100), scalpCondition (HEALTHY/DRY/OILY/DANDRUFF/IRRITATED), currentStyle (AFRO/BRAIDS/LOCS/TWISTS/STRAIGHT/WEAVE/WIG/OTHER), recommendations (6 conseils FR avec emojis), reasoning (1-2 phrases).`;

  if (type === 'skin') {
    const records = await prisma.skinAnalysis.findMany({
      where: { consentDataset: true },
      select: {
        selfieUrl: true, monkTone: true, undertone: true, hydration: true,
        sebum: true, pores: true, wrinkles: true, spots: true, acne: true,
        hyperpigmentation: true, uniformity: true, overallScore: true,
        recommendations: true, rawResponse: true,
      },
    });

    const lines = records.map((r: typeof records[0]) => JSON.stringify({
      messages: [
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: r.selfieUrl } },
          { type: 'text', text: SKIN_PROMPT },
        ]},
        { role: 'assistant', content: JSON.stringify({
          monkTone: r.monkTone, undertone: r.undertone, hydration: r.hydration,
          sebum: r.sebum, pores: r.pores, wrinkles: r.wrinkles, spots: r.spots,
          acne: r.acne, hyperpigmentation: r.hyperpigmentation, uniformity: r.uniformity,
          overallScore: r.overallScore, recommendations: r.recommendations,
          reasoning: (r.rawResponse as any)?.reasoning || '',
        })},
      ],
    }));

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="skin-training-${Date.now()}.jsonl"`);
    return res.send(lines.join('\n'));
  }

  // hair
  const records = await prisma.hairAnalysis.findMany({
    where: { consentDataset: true },
    select: {
      photoUrl: true, hairType: true, porosity: true, density: true, thickness: true,
      dryness: true, elasticity: true, shrinkage: true, scalpCondition: true,
      currentStyle: true, overallScore: true, recommendations: true, rawResponse: true,
    },
  });

  const lines = records.map((r: typeof records[0]) => JSON.stringify({
    messages: [
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: r.photoUrl } },
        { type: 'text', text: HAIR_PROMPT },
      ]},
      { role: 'assistant', content: JSON.stringify({
        hairType: r.hairType, porosity: r.porosity, density: r.density,
        thickness: r.thickness, dryness: r.dryness, elasticity: r.elasticity,
        shrinkage: r.shrinkage, scalpCondition: r.scalpCondition,
        currentStyle: r.currentStyle, overallScore: r.overallScore,
        recommendations: r.recommendations,
        reasoning: (r.rawResponse as any)?.reasoning || '',
      })},
    ],
  }));

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Content-Disposition', `attachment; filename="hair-training-${Date.now()}.jsonl"`);
  res.send(lines.join('\n'));
}));

export default router;
