import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { normalizePhone } from '@tokoss/shared';
import { ValidationError, NotFoundError } from '../lib/errors';
import { generateToken, generateRefreshToken, authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import { otpSendSchema, otpVerifySchema, registerSchema, refreshSchema } from '../schemas';

const router = Router();

// In-memory OTP store (replace with Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const DEMO_OTP = process.env.DEMO_OTP || '1234';

// POST /api/auth/otp/send
router.post('/otp/send', validateBody(otpSendSchema), asyncHandler(async (req: Request, res: Response) => {
  const phone = normalizePhone(req.body.phone);

  // Use DEMO_OTP if set (dev + staging), otherwise generate random OTP (requires SMS service)
  const otp = process.env.DEMO_OTP || String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  // TODO: Send OTP via Africa's Talking SMS
  console.log(`[OTP] ${phone}: ${otp}`);

  res.json({ success: true, message: 'OTP sent' });
}));

// POST /api/auth/otp/verify
router.post('/otp/verify', validateBody(otpVerifySchema), asyncHandler(async (req: Request, res: Response) => {
  const phone = normalizePhone(req.body.phone);
  const { otp } = req.body;

  const stored = otpStore.get(phone);
  if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
    throw new ValidationError('Invalid or expired OTP');
  }
  otpStore.delete(phone);

  // Find or indicate new user
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    return res.json({ success: true, isNewUser: true, phone });
  }

  const token = generateToken({ userId: user.id, role: user.role, phone: user.phone });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || null,
    },
  });

  res.json({
    success: true,
    isNewUser: false,
    token,
    refreshToken,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar },
  });
}));

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const phone = normalizePhone(req.body.phone);
  const { name, otp } = req.body;

  const stored = otpStore.get(phone);
  if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
    throw new ValidationError('Invalid or expired OTP');
  }
  otpStore.delete(phone);

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new ValidationError('User already exists');
  }

  const user = await prisma.user.create({
    data: { phone, name, isVerified: true },
  });

  const token = generateToken({ userId: user.id, role: user.role, phone: user.phone });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({
    success: true,
    token,
    refreshToken,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
  });
}));

// POST /api/auth/refresh
router.post('/refresh', validateBody(refreshSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new ValidationError('Invalid refresh token');
  }

  const token = generateToken({
    userId: stored.user.id,
    role: stored.user.role,
    phone: stored.user.phone,
  });

  res.json({ success: true, token });
}));

// POST /api/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId: req.user!.userId },
      data: { revokedAt: new Date() },
    });
  }
  res.json({ success: true });
}));

export default router;
