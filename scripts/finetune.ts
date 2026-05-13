/**
 * Fine-tuning pipeline for Karysm AI analysis models.
 *
 * Usage:
 *   npx tsx scripts/finetune.ts --type skin --file skin-training.jsonl
 *   npx tsx scripts/finetune.ts --type hair --file hair-training.jsonl
 *   npx tsx scripts/finetune.ts --status <job-id>
 *
 * Step 1: Download JSONL from admin API
 *   curl -H "Authorization: Bearer <admin-token>" \
 *        https://tokoss-production.up.railway.app/api/admin/training-data/skin \
 *        -o skin-training.jsonl
 *
 * Step 2: Run this script to upload + submit
 * Step 3: When job completes, set env var on Railway:
 *   OPENAI_FINETUNE_SKIN_MODEL=ft:gpt-4o-mini-2024-07-18:karysm:skin-v1:xxxx
 *   OPENAI_FINETUNE_HAIR_MODEL=ft:gpt-4o-mini-2024-07-18:karysm:hair-v1:xxxx
 */

import OpenAI from 'openai';
import { createReadStream, readFileSync } from 'fs';
import { resolve } from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE_MODEL = 'gpt-4o-mini-2024-07-18'; // cheaper + faster than gpt-4o, vision-capable

async function submitFinetune(type: 'skin' | 'hair', filePath: string) {
  const absPath = resolve(filePath);
  const lines = readFileSync(absPath, 'utf8').trim().split('\n').filter(Boolean);

  console.log(`\n📂 File: ${absPath}`);
  console.log(`📊 Examples: ${lines.length}`);

  if (lines.length < 10) {
    console.error(`❌ Need at least 10 examples to fine-tune (got ${lines.length}). Collect more consented analyses first.`);
    process.exit(1);
  }

  // Upload training file
  console.log('\n⬆️  Uploading training file to OpenAI...');
  const uploadedFile = await openai.files.create({
    file: createReadStream(absPath),
    purpose: 'fine-tune',
  });
  console.log(`✅ File uploaded: ${uploadedFile.id}`);

  // Create fine-tuning job
  console.log('\n🚀 Submitting fine-tuning job...');
  const job = await openai.fineTuning.jobs.create({
    training_file: uploadedFile.id,
    model: BASE_MODEL,
    suffix: `karysm-${type}-v1`,
    hyperparameters: {
      n_epochs: lines.length < 50 ? 4 : 3,
    },
  });

  console.log(`\n✅ Job created: ${job.id}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Model: ${job.model}`);
  console.log(`\n⏳ Training takes 15–60 minutes. Poll status with:`);
  console.log(`   npx tsx scripts/finetune.ts --status ${job.id}`);
  console.log(`\nWhen done, set on Railway:`);
  console.log(`   OPENAI_FINETUNE_${type.toUpperCase()}_MODEL=<fine_tuned_model_id>`);
}

async function checkStatus(jobId: string) {
  const job = await openai.fineTuning.jobs.retrieve(jobId);

  console.log(`\n📋 Job: ${job.id}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Model: ${job.model}`);

  if (job.status === 'succeeded' && job.fine_tuned_model) {
    console.log(`\n🎉 Fine-tuned model ready: ${job.fine_tuned_model}`);
    console.log(`\nSet on Railway (replace skin/hair as appropriate):`);
    console.log(`   OPENAI_FINETUNE_SKIN_MODEL=${job.fine_tuned_model}`);
    console.log(`   OPENAI_FINETUNE_HAIR_MODEL=${job.fine_tuned_model}`);
  }

  if (job.status === 'failed') {
    console.error(`\n❌ Job failed: ${job.error?.message}`);
  }

  // Print recent events
  const events = await openai.fineTuning.jobs.listEvents(jobId, { limit: 5 });
  if (events.data.length > 0) {
    console.log('\nRecent events:');
    for (const e of events.data.reverse()) {
      console.log(`   [${new Date(e.created_at * 1000).toISOString()}] ${e.message}`);
    }
  }
}

// CLI entry point
const args = process.argv.slice(2);

if (args[0] === '--status' && args[1]) {
  checkStatus(args[1]).catch(console.error);
} else {
  const typeIdx = args.indexOf('--type');
  const fileIdx = args.indexOf('--file');

  if (typeIdx === -1 || fileIdx === -1) {
    console.error('Usage: npx tsx scripts/finetune.ts --type skin|hair --file <path.jsonl>');
    console.error('       npx tsx scripts/finetune.ts --status <job-id>');
    process.exit(1);
  }

  const type = args[typeIdx + 1] as 'skin' | 'hair';
  const file = args[fileIdx + 1];

  if (type !== 'skin' && type !== 'hair') {
    console.error('--type must be skin or hair');
    process.exit(1);
  }

  submitFinetune(type, file).catch(console.error);
}
