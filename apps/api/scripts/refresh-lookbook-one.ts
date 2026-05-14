/**
 * Re-upload a single lookbook WebP to Cloudinary and bump its PortfolioItem row.
 *   cd apps/api && railway run --service tokoss pnpm exec tsx scripts/refresh-lookbook-one.ts <name>
 */
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const name = process.argv[2];
if (!name) { console.error('Usage: refresh-lookbook-one.ts <name>'); process.exit(1); }

const ASSETS_DIR = path.resolve(__dirname, '../../mobile/assets/images/lookbook');

(async () => {
  await prisma.$connect();
  const webp = path.join(ASSETS_DIR, `look_${name}.webp`);
  if (!fs.existsSync(webp)) throw new Error(`Missing ${webp}`);
  const result = await cloudinary.uploader.upload(webp, {
    public_id: `karysm/lookbook/v2/${name}`,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    transformation: [{ width: 1400, height: 1400, crop: 'limit' }, { quality: 'auto:good' }, { format: 'webp' }],
  });
  const u = await prisma.portfolioItem.updateMany({
    where: { imageUrl: { contains: `karysm/lookbook/v2/${name}.webp` } },
    data: { imageUrl: result.secure_url },
  });
  console.log(`${name} -> updated ${u.count} row(s) -> ${result.secure_url}`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
