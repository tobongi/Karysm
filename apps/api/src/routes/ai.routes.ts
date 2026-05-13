import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { ValidationError } from '../lib/errors';
import { uploadImage } from '../lib/cloudinary';
import { analyzeSkin, analyzeHair } from '../lib/huggingface';

const router = Router();

// POST /api/ai/skin-analysis — Analyze skin from selfie
router.post('/skin-analysis', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { data, consentDataset } = req.body;
  if (!data || typeof data !== 'string') {
    throw new ValidationError('Image data (base64) is required');
  }

  const startTime = Date.now();

  // Upload to Cloudinary
  const selfieUrl = await uploadImage(data, 'skin-analyses');

  // Run AI analysis
  const result = await analyzeSkin(selfieUrl);

  const processingTime = Date.now() - startTime;

  // Save to DB
  const analysis = await prisma.skinAnalysis.create({
    data: {
      userId: req.user!.userId,
      selfieUrl,
      monkTone: result.monkTone,
      undertone: result.undertone,
      labL: result.labL,
      labA: result.labA,
      labB: result.labB,
      itaAngle: result.itaAngle,
      melaninIndex: result.melaninIndex,
      hydration: result.hydration,
      sebum: result.sebum,
      pores: result.pores,
      wrinkles: result.wrinkles,
      spots: result.spots,
      acne: result.acne,
      hyperpigmentation: result.hyperpigmentation,
      uniformity: result.uniformity,
      overallScore: result.overallScore,
      recommendations: result.recommendations,
      rawResponse: result.rawResponse,
      processingTime,
      consentDataset: consentDataset === true,
    },
  });

  res.status(201).json({ success: true, data: analysis });
}));

// GET /api/ai/skin-history — My skin analyses history
router.get('/skin-history', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const analyses = await prisma.skinAnalysis.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      monkTone: true,
      undertone: true,
      overallScore: true,
      selfieUrl: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: analyses });
}));

// GET /api/ai/skin-analysis/:id — Detail
router.get('/skin-analysis/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const analysis = await prisma.skinAnalysis.findUnique({
    where: { id: req.params.id as string },
  });

  if (!analysis || analysis.userId !== req.user!.userId) {
    return res.status(404).json({ success: false, error: 'Analysis not found' });
  }

  res.json({ success: true, data: analysis });
}));

// POST /api/ai/hair-analysis — Analyze hair from photo
router.post('/hair-analysis', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { data, consentDataset } = req.body;
  if (!data || typeof data !== 'string') {
    throw new ValidationError('Image data (base64) is required');
  }

  const startTime = Date.now();

  const photoUrl = await uploadImage(data, 'hair-analyses');
  const result = await analyzeHair(photoUrl);
  const processingTime = Date.now() - startTime;

  const analysis = await prisma.hairAnalysis.create({
    data: {
      userId: req.user!.userId,
      photoUrl,
      hairType: result.hairType,
      porosity: result.porosity,
      density: result.density,
      thickness: result.thickness,
      dryness: result.dryness,
      elasticity: result.elasticity,
      shrinkage: result.shrinkage,
      scalpCondition: result.scalpCondition,
      currentStyle: result.currentStyle,
      overallScore: result.overallScore,
      recommendations: result.recommendations,
      rawResponse: result.rawResponse,
      processingTime,
      consentDataset: consentDataset === true,
    },
  });

  res.status(201).json({ success: true, data: analysis });
}));

// GET /api/ai/hair-history
router.get('/hair-history', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const analyses = await prisma.hairAnalysis.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      hairType: true,
      overallScore: true,
      photoUrl: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: analyses });
}));

// GET /api/ai/hair-analysis/:id
router.get('/hair-analysis/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const analysis = await prisma.hairAnalysis.findUnique({
    where: { id: req.params.id as string },
  });

  if (!analysis || analysis.userId !== req.user!.userId) {
    return res.status(404).json({ success: false, error: 'Analysis not found' });
  }

  res.json({ success: true, data: analysis });
}));

// POST /api/ai/makeup-advisor — GPT-4o mini vision: personalized makeup advice
router.post('/makeup-advisor', asyncHandler(async (req: Request, res: Response) => {
  const { image, category, productName, color, finish } = req.body;
  if (!image || typeof image !== 'string') {
    throw new ValidationError('image (base64 JPEG) is required');
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ success: false, error: 'AI advisor not configured' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const catLabel = category === 'levres' ? 'lèvres' : category === 'joues' ? 'joues' : 'yeux';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 180,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'low' },
          },
          {
            type: 'text',
            text: `Tu es une experte en maquillage pour peaux africaines et métissées. Regarde ce selfie et donne un conseil en 2-3 phrases max (en français) sur le maquillage ${catLabel} "${productName}" (couleur ${color}, finition ${finish}) actuellement appliqué. Dis si la teinte convient au teint visible, ce qu'on pourrait améliorer, et un tip pro. Sois positive et directe.`,
          },
        ],
      },
    ],
  });

  const advice = response.choices[0]?.message?.content ?? 'Conseil non disponible.';
  res.json({ success: true, data: { advice } });
}));

export default router;
