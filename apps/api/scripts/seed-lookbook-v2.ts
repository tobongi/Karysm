/**
 * v2 lookbook seed — 60 cards (10 per category × 6 categories).
 * - Reads job manifest from test-results/zimage_v2_jobs.json.
 * - Uploads each WebP in apps/mobile/assets/images/lookbook/look_<name>.webp to Cloudinary.
 * - Wipes PortfolioItem + SavedLook then inserts 60 fresh rows.
 *
 * Run with:
 *   cd apps/api && railway run --service tokoss pnpm exec tsx scripts/seed-lookbook-v2.ts
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

const ASSETS_DIR = path.resolve(__dirname, '../../mobile/assets/images/lookbook');
const JOBS_FILE = path.resolve(__dirname, '../../../test-results/zimage_v2_jobs.json');

type Job = { name: string; tag: string; caption: string; prompt: string; w: number; h: number };

const TAG_TO_PROVIDER_PREFS: Record<string, string[]> = {
  coiffure:   ['marie-kabila', 'aissatou-njoya'],
  ongles:     ['grace-mutombo'],
  maquillage: ['esther-tshisekedi'],
  soins:      ['nadia-obame'],
  barber:     ['patrick-lumumba', 'david-bokongo'],
  spa:        ['nadia-obame'],
};

async function uploadOne(job: Job): Promise<string> {
  const webp = path.join(ASSETS_DIR, `look_${job.name}.webp`);
  if (!fs.existsSync(webp)) throw new Error(`Missing asset: ${webp}`);
  const result = await cloudinary.uploader.upload(webp, {
    public_id: `karysm/lookbook/v2/${job.name}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ width: 1400, height: 1400, crop: 'limit' }, { quality: 'auto:good' }, { format: 'webp' }],
  });
  return result.secure_url;
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME missing');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing — run via `railway run`');

  const jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
  console.log(`Loaded ${jobs.length} jobs from manifest`);

  console.log('Connecting...');
  await prisma.$connect();

  const allProviders = await prisma.provider.findMany();
  if (allProviders.length === 0) throw new Error('No providers in DB');
  const fallback = allProviders[0];

  // Pre-resolve a round-robin pool per tag so we cycle providers within a tag
  const cyclePos: Record<string, number> = {};
  function pickProvider(tag: string) {
    const prefs = TAG_TO_PROVIDER_PREFS[tag] ?? [];
    const resolved = prefs
      .map((slug) => allProviders.find((p) => p.slug === slug))
      .filter((p): p is (typeof allProviders)[number] => !!p);
    if (resolved.length === 0) return fallback;
    const i = (cyclePos[tag] ?? 0) % resolved.length;
    cyclePos[tag] = i + 1;
    return resolved[i];
  }

  console.log('Wiping PortfolioItem + SavedLook...');
  await prisma.savedLook.deleteMany({});
  await prisma.portfolioItem.deleteMany({});

  console.log(`Uploading + inserting ${jobs.length} portfolio items...`);
  let i = 0;
  for (const job of jobs) {
    i++;
    const provider = pickProvider(job.tag);
    const url = await uploadOne(job);
    await prisma.portfolioItem.create({
      data: {
        providerId: provider.id,
        imageUrl: url,
        caption: job.caption,
        serviceTag: job.tag,
        sortOrder: i,
      },
    });
    console.log(`  ✓ [${i}/${jobs.length}] ${job.tag} ${job.name} -> ${provider.slug}`);
  }

  for (const p of allProviders) {
    const n = await prisma.portfolioItem.count({ where: { providerId: p.id } });
    await prisma.provider.update({ where: { id: p.id }, data: { portfolioCount: n } });
  }

  const count = await prisma.portfolioItem.count();
  const byTag = await prisma.portfolioItem.groupBy({ by: ['serviceTag'], _count: { _all: true } });
  console.log(`Done. ${count} portfolio items in DB.`);
  console.log('Distribution:', JSON.stringify(byTag.map((b) => ({ tag: b.serviceTag, n: b._count._all }))));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
