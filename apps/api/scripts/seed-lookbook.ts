/**
 * One-shot lookbook seed.
 * - Uploads the 15 ComfyUI-generated lookbook WebPs to Cloudinary.
 * - Wipes existing PortfolioItem rows.
 * - Inserts 15 fresh portfolio items pointing at the Cloudinary URLs.
 *
 * Run with prod DB credentials injected:
 *   railway run --service tokoss tsx apps/api/scripts/seed-lookbook.ts
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

const ASSETS_DIR = path.resolve(
  __dirname,
  '../../mobile/assets/images/lookbook'
);

type Look = {
  file: string;
  publicId: string;
  caption: string;
  serviceTag: string;
  // round-robin across existing providers by slug preference order
  preferredSlugs: string[];
  sortOrder: number;
};

// Existing prod providers (seeded by packages/db/prisma/seed.ts):
//   marie-kabila, grace-mutombo, patrick-lumumba, esther-tshisekedi,
//   david-bokongo, aissatou-njoya, nadia-obame
// We map each lookbook category to the most plausible provider(s).
const looks: Look[] = [
  { file: 'look_tresses.webp',    publicId: 'karysm/lookbook/tresses',    caption: 'Tresses collées avec perles dorées',           serviceTag: 'coiffure',   preferredSlugs: ['marie-kabila', 'aissatou-njoya'],   sortOrder: 1 },
  { file: 'look_ongles.webp',     publicId: 'karysm/lookbook/ongles',     caption: 'Gel UV effet marbre rose',                     serviceTag: 'ongles',     preferredSlugs: ['grace-mutombo'],                    sortOrder: 2 },
  { file: 'look_mariee.webp',     publicId: 'karysm/lookbook/mariee',     caption: 'Maquillage mariée — teint lumineux Monk 7',    serviceTag: 'maquillage', preferredSlugs: ['esther-tshisekedi'],                sortOrder: 3 },
  { file: 'look_fade.webp',       publicId: 'karysm/lookbook/fade',       caption: 'Fade dégradé + barbe sculptée',                serviceTag: 'barber',     preferredSlugs: ['patrick-lumumba', 'david-bokongo'], sortOrder: 4 },
  { file: 'look_braids.webp',     publicId: 'karysm/lookbook/braids',     caption: 'Box braids mi-longueur couleur caramel',       serviceTag: 'coiffure',   preferredSlugs: ['aissatou-njoya', 'marie-kabila'],   sortOrder: 5 },
  { file: 'look_soins.webp',      publicId: 'karysm/lookbook/soins',      caption: 'Soin visage hydratant — peau éclatante',       serviceTag: 'soins',      preferredSlugs: ['nadia-obame'],                      sortOrder: 6 },
  { file: 'look_stiletto.webp',   publicId: 'karysm/lookbook/stiletto',   caption: 'Extension ongles stiletto noir mat + strass',  serviceTag: 'ongles',     preferredSlugs: ['grace-mutombo'],                    sortOrder: 7 },
  { file: 'look_cornrows.webp',   publicId: 'karysm/lookbook/cornrows',   caption: 'Cornrows avec fils dorés — style Fulani',      serviceTag: 'coiffure',   preferredSlugs: ['aissatou-njoya'],                   sortOrder: 8 },
  { file: 'look_spa.webp',        publicId: 'karysm/lookbook/spa',        caption: 'Rituel spa visage — gommage argile',           serviceTag: 'spa',        preferredSlugs: ['nadia-obame'],                      sortOrder: 9 },
  { file: 'look_locs.webp',       publicId: 'karysm/lookbook/locs',       caption: 'Locs longues — demi-chignon haut',             serviceTag: 'coiffure',   preferredSlugs: ['marie-kabila', 'aissatou-njoya'],   sortOrder: 10 },
  { file: 'look_cut_crease.webp', publicId: 'karysm/lookbook/cut_crease', caption: 'Cut crease doré — regard glamour',             serviceTag: 'maquillage', preferredSlugs: ['esther-tshisekedi'],                sortOrder: 11 },
  { file: 'look_hair_care.webp',  publicId: 'karysm/lookbook/hair_care',  caption: 'Soin cheveux 4C — beurre de karité maison',    serviceTag: 'soins',      preferredSlugs: ['nadia-obame'],                      sortOrder: 12 },
  { file: 'look_pedicure.webp',   publicId: 'karysm/lookbook/pedicure',   caption: 'Pédicure nude pearlescent + nail art doré',    serviceTag: 'ongles',     preferredSlugs: ['grace-mutombo'],                    sortOrder: 13 },
  { file: 'look_hot_stone.webp',  publicId: 'karysm/lookbook/hot_stone',  caption: 'Massage aux pierres chaudes — détente totale', serviceTag: 'spa',        preferredSlugs: ['nadia-obame'],                      sortOrder: 14 },
  { file: 'look_lace_wig.webp',   publicId: 'karysm/lookbook/lace_wig',   caption: 'Pose lace frontal lisse — baby hairs sculptés', serviceTag: 'coiffure',  preferredSlugs: ['marie-kabila'],                     sortOrder: 15 },
];

async function uploadOne(look: Look): Promise<string> {
  const full = path.join(ASSETS_DIR, look.file);
  if (!fs.existsSync(full)) throw new Error(`Missing asset: ${full}`);
  const result = await cloudinary.uploader.upload(full, {
    public_id: look.publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto:good' }, { format: 'webp' }],
  });
  return result.secure_url;
}

async function resolveProvider(preferredSlugs: string[], fallback: Awaited<ReturnType<typeof prisma.provider.findMany>>[number]) {
  for (const slug of preferredSlugs) {
    const p = await prisma.provider.findUnique({ where: { slug } });
    if (p) return p;
  }
  return fallback;
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME missing');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing — run via `railway run`');

  console.log('Connecting...');
  await prisma.$connect();

  const allProviders = await prisma.provider.findMany();
  if (allProviders.length === 0) throw new Error('No providers in DB — run packages/db/prisma/seed.ts first');
  const fallback = allProviders[0];
  console.log(`Found ${allProviders.length} providers; fallback=${fallback.slug}`);

  console.log('Wiping existing PortfolioItem rows (and dependent SavedLook rows)...');
  await prisma.savedLook.deleteMany({});
  await prisma.portfolioItem.deleteMany({});

  console.log(`Uploading ${looks.length} images to Cloudinary...`);
  for (const look of looks) {
    const provider = await resolveProvider(look.preferredSlugs, fallback);
    const url = await uploadOne(look);
    await prisma.portfolioItem.create({
      data: {
        providerId: provider.id,
        imageUrl: url,
        caption: look.caption,
        serviceTag: look.serviceTag,
        sortOrder: look.sortOrder,
      },
    });
    console.log(`  ✓ [${look.sortOrder}/${looks.length}] ${look.file} → ${provider.slug} → ${url}`);
  }

  // Refresh provider.portfolioCount denormalized counter
  for (const p of allProviders) {
    const n = await prisma.portfolioItem.count({ where: { providerId: p.id } });
    await prisma.provider.update({ where: { id: p.id }, data: { portfolioCount: n } });
  }

  const count = await prisma.portfolioItem.count();
  console.log(`Done. ${count} portfolio items in DB.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
