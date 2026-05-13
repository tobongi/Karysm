/**
 * Hair analysis dataset labeler — FairFace Black subset
 *
 * Downloads the FairFace dataset (Black race split) from HuggingFace and
 * labels each image with GPT-4o Vision using Karysm's hair analysis prompt.
 * Outputs JSONL ready for `scripts/finetune.ts`.
 *
 * This creates the world's first publicly labeled 4A/4B/4C afro hair dataset.
 * Keep labeled data — it is Karysm's moat.
 *
 * Usage:
 *   npx tsx scripts/datasets/label-hair.ts --limit 200 --output hair-training.jsonl
 *   npx tsx scripts/datasets/label-hair.ts --limit 500 --offset 200 --output hair-training.jsonl
 *
 * Cost estimate: ~$0.003/image → 500 images ≈ $1.50 — full 15K images ≈ $45
 *
 * Dataset: FairFace (HuggingFaceM4/FairFace) — CC BY 4.0, commercially usable
 * Only processes rows where race == "Black" (approximately 1 in 7 of the dataset).
 */

import OpenAI from 'openai';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HF_API = 'https://datasets-server.huggingface.co';
const DATASET = 'HuggingFaceM4/FairFace';
const CONFIG = '1.25';  // FairFace has two configs: 0.25 and 1.25 (use larger)
const SPLIT = 'train';
const IMG_BASE = `${HF_API}/assets/${DATASET}/--/${CONFIG}/${SPLIT}`;

// Must match exactly what's in huggingface.ts analyzeHair()
const HAIR_PROMPT = `Tu es une experte trichologue spécialisée dans les cheveux afro-texturés (types 3C à 4C).
Analyse cette photo de cheveux et réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour.

Structure JSON requise :
{
  "hairVisible": true | false,
  "hairType": "3C" | "4A" | "4B" | "4C" | "OTHER",
  "porosity": "LOW" | "MEDIUM" | "HIGH",
  "density": "LOW" | "MEDIUM" | "HIGH",
  "thickness": "FINE" | "MEDIUM" | "COARSE",
  "dryness": <0-100, 0=très hydraté, 100=très sec>,
  "elasticity": <0-100, 0=cassant, 100=très élastique>,
  "shrinkage": <0-100, pourcentage de rétrécissement estimé>,
  "scalpCondition": "HEALTHY" | "DRY" | "OILY" | "DANDRUFF" | "IRRITATED",
  "currentStyle": "AFRO" | "BRAIDS" | "LOCS" | "TWISTS" | "STRAIGHT" | "WEAVE" | "WIG" | "OTHER",
  "overallScore": <0-100>,
  "confidence": <0-100, ta confiance dans cette classification>,
  "recommendations": [<6 conseils personnalisés en français avec emojis>],
  "reasoning": "<explication courte en 1-2 phrases>"
}

Critères de classification :
- 3C : boucles définies, diamètre stylo, peu de shrinkage
- 4A : boucles en S bien définies, diamètre paille, shrinkage 50-60%
- 4B : boucles en Z ou coton, peu de définition, shrinkage 60-75%
- 4C : texture la plus serrée, quasiment pas de boucles définies, shrinkage 75-90%
- OTHER : cheveux lisses, ondulés (types 1-3B), ou non-afro

Porosité : LOW = brillant/lisse, MEDIUM = absorbance normale, HIGH = terne/frisottis/poreux
Si les cheveux ne sont pas visibles (coiffure cachée, bonnet, etc.) mettre hairVisible: false.`;

interface HFRow {
  row_idx: number;
  row: {
    image: { src: string; height: number; width: number };
    race: string;
    gender: string;
    age: string;
  };
}

async function fetchRows(offset: number, limit: number): Promise<HFRow[]> {
  const url = `${HF_API}/rows?dataset=${encodeURIComponent(DATASET)}&config=${CONFIG}&split=${SPLIT}&offset=${offset}&length=${limit}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Karysm-Dataset-Pipeline/1.0' } });
  if (!res.ok) throw new Error(`HF API error ${res.status}: ${await res.text()}`);
  const json = await res.json() as { rows: HFRow[] };
  return json.rows || [];
}

function getImageUrl(rowIdx: number): string {
  return `${IMG_BASE}/${rowIdx}/image/image.jpg`;
}

async function labelImage(imageUrl: string): Promise<any | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          { type: 'text', text: HAIR_PROMPT },
        ],
      }],
    });
    const content = response.choices[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function toTrainingLine(imageUrl: string, label: any): string {
  // Strip internal fields (hairVisible, confidence) from the training target
  return JSON.stringify({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: HAIR_PROMPT.replace(/"hairVisible".*\n/, '').replace(/"confidence".*\n/, '') },
        ],
      },
      {
        role: 'assistant',
        content: JSON.stringify({
          hairType: label.hairType,
          porosity: label.porosity,
          density: label.density,
          thickness: label.thickness,
          dryness: label.dryness,
          elasticity: label.elasticity,
          shrinkage: label.shrinkage,
          scalpCondition: label.scalpCondition,
          currentStyle: label.currentStyle,
          overallScore: label.overallScore,
          recommendations: label.recommendations,
          reasoning: label.reasoning || '',
        }),
      },
    ],
  });
}

async function run() {
  const args = process.argv.slice(2);
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : def;
  };

  const limit = parseInt(get('--limit', '100'));
  const offset = parseInt(get('--offset', '0'));
  const minConfidence = parseInt(get('--min-confidence', '70'));
  const outputFile = resolve(get('--output', 'hair-training.jsonl'));

  console.log(`\n💇 Karysm Hair Dataset Labeler`);
  console.log(`   Dataset    : FairFace (CC BY 4.0) — Black race split`);
  console.log(`   Range      : rows ${offset}–${offset + limit - 1} (scanning for Black subjects)`);
  console.log(`   Min conf   : ${minConfidence}% (labels below this threshold are dropped)`);
  console.log(`   Output     : ${outputFile}`);
  console.log(`   Est. cost  : ~$${(limit * 0.003).toFixed(2)} (gpt-4o)\n`);

  // Resume support
  const existingUrls = new Set<string>();
  if (existsSync(outputFile)) {
    const lines = readFileSync(outputFile, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const url = JSON.parse(line).messages?.[0]?.content?.[0]?.image_url?.url;
        if (url) existingUrls.add(url);
      } catch {}
    }
    console.log(`↩️  Resuming — ${existingUrls.size} already labeled\n`);
  }

  const BATCH = 10;
  let scanned = 0;
  let blackRows = 0;
  let labeled = 0;
  let skipped = 0; // hair not visible or OTHER type
  let lowConf = 0;

  for (let i = offset; i < offset + limit; i += BATCH) {
    const batchSize = Math.min(BATCH, offset + limit - i);
    let rows: HFRow[];
    try {
      rows = await fetchRows(i, batchSize);
    } catch (err) {
      console.error(`❌ Failed to fetch rows ${i}–${i + batchSize}:`, err);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    scanned += rows.length;
    const blackSubset = rows.filter(r => r.row.race === 'Black');
    blackRows += blackSubset.length;

    await Promise.all(blackSubset.map(async (row) => {
      const imageUrl = getImageUrl(row.row_idx);
      if (existingUrls.has(imageUrl)) return;

      const label = await labelImage(imageUrl);
      if (!label) return;

      // Skip: hair not visible
      if (label.hairVisible === false) { skipped++; return; }

      // Skip: non-afro hair (types 1-3B)
      if (label.hairType === 'OTHER') { skipped++; return; }

      // Skip: low confidence
      if ((label.confidence || 0) < minConfidence) { lowConf++; return; }

      appendFileSync(outputFile, toTrainingLine(imageUrl, label) + '\n');
      labeled++;
    }));

    const pct = Math.round(((i + batchSize - offset) / limit) * 100);
    console.log(`   [${pct}%] scanned:${scanned} black:${blackRows} ✅labeled:${labeled} ⏭skipped:${skipped} 🎯lowconf:${lowConf}`);

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Done`);
  console.log(`   Scanned    : ${scanned} FairFace rows`);
  console.log(`   Black hair : ${blackRows} images processed`);
  console.log(`   Labeled    : ${labeled} high-quality examples`);
  console.log(`   Skipped    : ${skipped} (hidden/non-afro hair)`);
  console.log(`   Low conf   : ${lowConf} (below ${minConfidence}% threshold)`);
  console.log(`\n   Feed to fine-tuner:`);
  console.log(`   npx tsx scripts/finetune.ts --type hair --file ${outputFile}`);

  if (labeled < 10) {
    console.log(`\n⚠️  Only ${labeled} examples — need at least 10 to fine-tune.`);
    console.log(`   Run with a larger --limit or lower --min-confidence.`);
  }
}

run().catch(console.error);
