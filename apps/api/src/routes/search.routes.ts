import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { validateQuery } from '../middleware/validate';
import { searchSchema } from '../schemas';
import { parsePagination } from '@tokoss/shared';

const router = Router();

// GET /api/search
router.get('/', validateQuery(searchSchema), async (req: Request, res: Response) => {
  const { q, category, lat, lng, radius = 10, minRating, maxPrice, sort = 'distance' } = req.query as any;
  const { page, pageSize, skip, take } = parsePagination(req.query as any);

  // Build where clause
  const where: any = { status: 'ACTIVE' };

  if (category) {
    where.services = { some: { category: { slug: category }, isActive: true } };
  }

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: 'insensitive' } },
      { services: { some: { name: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  if (minRating) {
    where.avgRating = { gte: parseFloat(minRating) };
  }

  // Get providers
  const [providers, total] = await Promise.all([
    prisma.provider.findMany({
      where,
      include: {
        services: {
          where: { isActive: true },
          include: { category: true },
        },
        user: { select: { name: true, avatar: true } },
      },
      skip,
      take,
      orderBy: sort === 'rating' ? { avgRating: 'desc' } : { createdAt: 'desc' },
    }),
    prisma.provider.count({ where }),
  ]);

  // Compute distance and apply post-filters
  let results = providers.map(p => {
    const distance = (lat && lng && p.lat && p.lng)
      ? haversine(lat, lng, p.lat, p.lng)
      : null;

    const minPrice = p.services.length > 0
      ? Math.min(...p.services.map(s => s.priceMin))
      : null;

    return { ...p, distance, minPrice };
  });

  // Filter by radius
  if (lat && lng) {
    results = results.filter(r => r.distance === null || r.distance <= radius);
  }

  // Filter by max price
  if (maxPrice) {
    results = results.filter(r => r.minPrice === null || r.minPrice <= maxPrice);
  }

  // Sort
  if (sort === 'distance' && lat && lng) {
    results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  } else if (sort === 'price_asc') {
    results.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
  } else if (sort === 'price_desc') {
    results.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
  }

  res.json({
    success: true,
    data: {
      items: results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// GET /api/search/providers/:slug
router.get('/providers/:slug', async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({
    where: { slug: req.params.slug as string },
    include: {
      services: { where: { isActive: true }, include: { category: true }, orderBy: { sortOrder: 'asc' } },
      availability: { where: { isActive: true } },
      portfolio: { orderBy: { sortOrder: 'asc' } },
      user: { select: { name: true, avatar: true } },
    },
  });

  if (!provider) {
    return res.status(404).json({ success: false, error: 'Provider not found' });
  }

  res.json({ success: true, data: provider });
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;
