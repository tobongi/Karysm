import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { NotFoundError } from '../lib/errors';

const router = Router();

// GET /api/wallet — Provider wallet balance
router.get('/', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  let wallet = await prisma.providerWallet.findUnique({ where: { providerId: provider.id } });

  // Auto-create wallet if it doesn't exist
  if (!wallet) {
    wallet = await prisma.providerWallet.create({
      data: { providerId: provider.id, currency: provider.currency },
    });
  }

  res.json({ success: true, data: wallet });
}));

// GET /api/wallet/transactions — Transaction history
router.get('/transactions', authMiddleware, requireRole('PROVIDER'), asyncHandler(async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({ where: { userId: req.user!.userId } });
  if (!provider) throw new NotFoundError('Provider');

  const wallet = await prisma.providerWallet.findUnique({ where: { providerId: provider.id } });
  if (!wallet) {
    return res.json({ success: true, data: [] });
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: transactions });
}));

export default router;
