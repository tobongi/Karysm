import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { NotFoundError, ValidationError } from '../lib/errors';
import { createNotification } from '../lib/notifications';
import { uploadImage } from '../lib/cloudinary';

const router = Router();

const VALID_DOC_TYPES = ['ID_FRONT', 'ID_BACK', 'SELFIE_WITH_ID'];

// POST /api/kyc/upload — Upload a KYC document
router.post('/upload', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const { type, data } = req.body;

  if (!type || !VALID_DOC_TYPES.includes(type)) {
    throw new ValidationError(`Type must be one of: ${VALID_DOC_TYPES.join(', ')}`);
  }
  if (!data || typeof data !== 'string') {
    throw new ValidationError('Image data (base64) is required');
  }

  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  // Check if document of this type already exists and is pending/approved
  const existing = await prisma.kycDocument.findFirst({
    where: { providerId: provider.id, type, status: { in: ['PENDING', 'APPROVED'] } },
  });
  if (existing) {
    throw new ValidationError(`Un document ${type} est déjà soumis`);
  }

  // Upload to Cloudinary
  const imageUrl = await uploadImage(data, 'kyc');

  const doc = await prisma.kycDocument.create({
    data: {
      providerId: provider.id,
      type,
      imageUrl,
      status: 'PENDING',
    },
  });

  // Update provider kycStatus to PENDING if not already
  if (provider.kycStatus !== 'PENDING') {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { kycStatus: 'PENDING' },
    });
  }

  res.status(201).json({ success: true, data: doc });
}));

// GET /api/kyc/status — My KYC status
router.get('/status', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({
    where: { userId: req.user!.userId },
    select: { id: true, kycStatus: true, idVerified: true },
  });
  if (!provider) throw new NotFoundError('Provider');

  const documents = await prisma.kycDocument.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: 'desc' },
  });

  // Group by type — latest per type
  const byType: Record<string, any> = {};
  for (const doc of documents) {
    if (!byType[doc.type]) byType[doc.type] = doc;
  }

  res.json({
    success: true,
    data: {
      kycStatus: provider.kycStatus,
      idVerified: provider.idVerified,
      documents: byType,
      allDocuments: documents,
    },
  });
}));

// GET /api/kyc/documents — My submitted documents
router.get('/documents', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const documents = await prisma.kycDocument.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: documents });
}));

export default router;
