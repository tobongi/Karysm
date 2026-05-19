/**
 * Re-upload the 12 regenerated lookbook WebPs to Cloudinary (same public_ids,
 * overwrite=true), then update the PortfolioItem rows so the imageUrl reflects
 * the new Cloudinary version (cache-bust on clients).
 *
 *   cd apps/api && railway run --service tokoss pnpm exec tsx scripts/refresh-lookbook-12.ts
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

const NAMES = [
  'coif_bantu_knots', 'coif_locs_retwist', 'coif_lace_wig_straight', 'coif_lace_wig_wavy',
  'barber_fade_beard', 'barber_classic_afro', 'barber_tapered', 'barber_buzz', 'barber_low_fade_full',
  'spa_body_wrap', 'spa_chocolate_wrap', 'spa_hammam_miel',
];

const ASSETS_DIR = path.resolve(__dirname, '../../mobile/assets/images/lookbook');

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME missing');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing — run via `railway run`');
  await prisma.$connect();

  for (const name of NAMES) {
    const webp = path.join(ASSETS_DIR, `look_${name}.webp`);
    if (!fs.existsSync(webp)) {
      console.warn(`  ! Missing ${webp}, skipping`);
      continue;
    }
    const result = await cloudinary.uploader.upload(webp, {
      public_id: `karysm/lookbook/v2/${name}`,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
      transformation: [{ width: 1400, height: 1400, crop: 'limit' }, { quality: 'auto:good' }, { format: 'webp' }],
    });

    const oldUrlSuffix = `karysm/lookbook/v2/${name}.webp`;
    const updated = await prisma.portfolioItem.updateMany({
      where: { imageUrl: { contains: oldUrlSuffix } },
      data: { imageUrl: result.secure_url },
    });
    console.log(`  ✓ ${name} -> updated ${updated.count} row(s) -> ${result.secure_url}`);
  }

  await prisma.$disconnect();
  console.log('Done.');
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
