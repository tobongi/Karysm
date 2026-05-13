/**
 * Skin analysis dataset labeler — SCIN + PAD-UFES-20
 *
 * Downloads images from SCIN (Google, HuggingFace) and labels them with
 * GPT-4o Vision using Karysm's skin analysis prompt. Outputs JSONL ready
 * for `scripts/finetune.ts`.
 *
 * Usage:
 *   npx tsx scripts/datasets/label-skin.ts --limit 200 --output skin-training.jsonl
 *   npx tsx scripts/datasets/label-skin.ts --limit 500 --offset 200 --output skin-training.jsonl
 *
 * Cost estimate: ~$0.003/image with gpt-4o → 500 images ≈ $1.50
 *
 * Datasets used (commercially licensed):
 *   - SCIN (google/scin) — "SCIN Data Use License" (allows commercial use)
 *   - PAD-UFES-20 — CC BY 4.0 (see README.md for manual download)
 *
 * SCIN is fetched via HuggingFace Datasets REST API (no auth needed).
 * PAD-UFES-20: download manually, then use --source pad-ufes --dir <path>
 */

import OpenAI from 'openai';
import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HF_API = 'https://datasets-server.huggingface.co';
const SCIN_DATASET = 'google/scin';
const SCIN_SPLIT = 'train';
const SCIN_IMG_BASE = `${HF_API}/assets/${SCIN_DATASET}/--/default/${SCIN_SPLIT}`;

// Must match exactly what's in huggingface.ts analyzeSkin()
const SKIN_PROMPT = `Tu es une experte dermatologue spécialisée dans les peaux mélanisées.
Analyse cette photo de visage/peau et réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour.

Structure JSON requise :
{
  "monkTone": <1-10, échelle Monk Skin Tone Scale>,
  "undertone": "WARM" | "COOL" | "NEUTRAL",
  "hydration": <0-100, 0=très sèche, 100=bien hydratée>,
  "sebum": <0-100, 0=très sèche, 100=très grasse/luisante>,
  "pores": <0-100, 0=pores invisibles, 100=pores très dilatés>,
  "wrinkles": <0-100, 0=aucune ride, 100=rides très marquées>,
  "spots": <0-100, 0=teint parfaitement uniforme, 100=nombreuses taches>,
  "acne": <0-100, 0=aucune imperfection, 100=acné sévère>,
  "hyperpigmentation": <0-100, 0=aucune, 100=hyperpigmentation sévère>,
  "uniformity": <0-100, 0=teint très irrégulier, 100=teint parfaitement uniforme>,
  "overallScore": <0-100, santé globale de la peau>,
  "recommendations": [<exactement 6 conseils personnalisés en français avec emojis>],
  "reasoning": "<explication courte de ton analyse en 1-2 phrases>"
}

Échelle Monk Skin Tone :
1-2 = très clair (peau très pâle, rosée)
3-4 = clair à moyen (beige, olive clair)
5-6 = moyen à foncé (caramel, brun clair)
7-8 = foncé (brun, brun foncé, peau africaine)
9-10 = très foncé (ébène profond)

Si le visage n'est pas clairement visible, analyse la peau visible.`;

async function fetchScinRows(offset: number, limit: number): Promise<any[]> {
  const url = `${HF_API}/rows?dataset=${SCIN_DATASET}&config=default&split=${SCIN_SPLIT}&offset=${offset}&length=${limit}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Karysm-Dataset-Pipeline/1.0' } });
  if (!res.ok) throw new Error(`HF API error: ${res.status} ${await res.text()}`);
  const json = await res.json() as any;
  return json.rows || [];
}

function getScinImageUrl(rowIdx: number, fieldName = 'image'): string {
  // HuggingFace assets URL pattern for image datasets
  return `${SCIN_IMG_BASE}/${rowIdx}/${fieldName}/image.jpg`;
}

async function labelImage(imageUrl: string): Promise<any | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          { type: 'text', text: SKIN_PROMPT },
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
  return JSON.stringify({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: SKIN_PROMPT },
        ],
      },
      {
        role: 'assistant',
        content: JSON.stringify({
          monkTone: label.monkTone,
          undertone: label.undertone,
          hydration: label.hydration,
          sebum: label.sebum,
          pores: label.pores,
          wrinkles: label.wrinkles,
          spots: label.spots,
          acne: label.acne,
          hyperpigmentation: label.hyperpigmentation,
          uniformity: label.uniformity,
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
  const limitIdx = args.indexOf('--limit');
  const offsetIdx = args.indexOf('--offset');
  const outputIdx = args.indexOf('--output');

  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 100;
  const offset = offsetIdx !== -1 ? parseInt(args[offsetIdx + 1]) : 0;
  const outputFile = outputIdx !== -1 ? resolve(args[outputIdx + 1]) : resolve('skin-training.jsonl');

  console.log(`\n🧴 Karysm Skin Dataset Labeler`);
  console.log(`   Dataset : SCIN (google/scin) — CC licensed`);
  console.log(`   Range   : rows ${offset}–${offset + limit - 1}`);
  console.log(`   Output  : ${outputFile}`);
  console.log(`   Est cost: ~$${(limit * 0.003).toFixed(2)} (gpt-4o)\n`);

  const BATCH = 10;
  let success = 0;
  let fail = 0;

  // Load existing output to avoid re-processing (resume support)
  const existingUrls = new Set<string>();
  if (existsSync(outputFile)) {
    const existing = readFileSync(outputFile, 'utf8').split('\n').filter(Boolean);
    for (const line of existing) {
      try {
        const parsed = JSON.parse(line);
        const url = parsed.messages?.[0]?.content?.[0]?.image_url?.url;
        if (url) existingUrls.add(url);
      } catch {}
    }
    console.log(`↩️  Resuming — ${existingUrls.size} already labeled\n`);
  }

  for (let i = offset; i < offset + limit; i += BATCH) {
    const batchSize = Math.min(BATCH, offset + limit - i);
    let rows: any[];
    try {
      rows = await fetchScinRows(i, batchSize);
    } catch (err) {
      console.error(`❌ Failed to fetch rows ${i}–${i + batchSize}:`, err);
      break;
    }

    await Promise.all(rows.map(async (row: any, j: number) => {
      const rowIdx = i + j;
      const imageUrl = getScinImageUrl(rowIdx);
      if (existingUrls.has(imageUrl)) return;

      const label = await labelImage(imageUrl);
      if (!label || !label.monkTone) { fail++; return; }

      appendFileSync(outputFile, toTrainingLine(imageUrl, label) + '\n');
      success++;
    }));

    console.log(`   [${i + batchSize}/${offset + limit}] ✅ ${success} labeled, ❌ ${fail} failed`);

    // Respect rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Done: ${success} training examples → ${outputFile}`);
  console.log(`   Feed to fine-tuner: npx tsx scripts/finetune.ts --type skin --file ${outputFile}`);
}

run().catch(console.error);
