# Karysm AI Training Datasets

## Overview

Two domains, two pipelines:

| Domain | Dataset | License | Images | Script |
|--------|---------|---------|--------|--------|
| Skin analysis | SCIN (Google) | SCIN DUL (commercial OK) | ~10,000 | `label-skin.ts` |
| Skin analysis | PAD-UFES-20 (Brazil) | CC BY 4.0 | 2,298 | `label-skin.ts --source pad-ufes` |
| Skin analysis | MST-E (Google) | CC BY 4.0 | 1,515 | calibration reference |
| Hair classification | FairFace Black subset | CC BY 4.0 | ~15,500 | `label-hair.ts` |

**Do NOT use:**
- Fitzpatrick17k — CC BY-NC-SA (non-commercial)
- HAM10000 — CC BY-NC (non-commercial)
- DDI (Stanford) — research-only, requires signed agreement
- CelebA/CelebAHQ — research-only

---

## Quick Start

```bash
# Set your OpenAI key
export OPENAI_API_KEY=sk-proj-...

# Label 200 skin images (~$0.60)
npx tsx scripts/datasets/label-skin.ts --limit 200 --output skin-training.jsonl

# Label 200 hair images (~$0.60) — filters to Black subjects with afro hair
npx tsx scripts/datasets/label-hair.ts --limit 500 --output hair-training.jsonl

# Submit for fine-tuning (needs ≥10 examples)
npx tsx scripts/finetune.ts --type skin --file skin-training.jsonl
npx tsx scripts/finetune.ts --type hair --file hair-training.jsonl
```

Both scripts support `--offset N` for resuming interrupted runs.

---

## Dataset Details

### SCIN — Skin Condition Image Network
- **Source:** https://github.com/google-research-datasets/scin
- **HuggingFace:** `google/scin`
- **License:** SCIN Data Use License — allows commercial ML training. Review: https://github.com/google-research-datasets/scin/blob/main/LICENSE
- **Why:** Only publicly available dataset with Monk Skin Tone (MST 1–10) labels
- **Caveat:** Skews lighter (US internet crowdsource bias). MST 7–10 underrepresented. Supplement with PAD-UFES-20.
- **Fetched via:** HuggingFace Datasets REST API (no auth needed)

### PAD-UFES-20 — Brazilian Skin Lesions
- **Source:** https://data.mendeley.com/datasets/zr7vgbcyr2/1
- **License:** CC BY 4.0 — fully commercial
- **Why:** Brazilian population → meaningfully more Fitzpatrick III–V than European datasets
- **Download manually:**
  1. Go to https://data.mendeley.com/datasets/zr7vgbcyr2/1
  2. Click "Download All" (~1.6 GB ZIP)
  3. Extract to `scripts/datasets/pad-ufes-20/`
  4. Run: `npx tsx scripts/datasets/label-skin.ts --source pad-ufes --dir scripts/datasets/pad-ufes-20 --output skin-training.jsonl`

### MST-E — Monk Skin Tone Examples
- **Source:** https://skintone.google/mste-dataset
- **License:** CC BY 4.0
- **Why:** 19 subjects photographed across all 10 MST values — gold standard calibration
- **Use:** Reference set for validating Monk tone predictions, not for fine-tuning training (too small, too controlled)
- **Download:** Agree to CC BY terms at skintone.google, then unzip

### FairFace — Hair Classification Base
- **Source:** https://huggingface.co/datasets/HuggingFaceM4/FairFace
- **License:** CC BY 4.0 — fully commercial
- **Why:** 108,501 diverse face images. ~15,500 Black subjects with afro-textured hair visible.
- **No 4A/4B/4C labels exist** — `label-hair.ts` creates them via GPT-4o Vision
- **This is Karysm's moat:** no competitor has a labeled 4A/4B/4C dataset

---

## Cost Estimates (gpt-4o at $0.003/image)

| Scale | Images | Cost | Quality |
|-------|--------|------|---------|
| MVP | 50 | $0.15 | Baseline improvement over defaults |
| Good | 200 | $0.60 | Noticeable specialization |
| Strong | 1,000 | $3.00 | Solid fine-tuned model |
| Full FairFace hair | 15,000 | $45 | World-class afro hair classifier |
| Full SCIN skin | 10,000 | $30 | Best available skin analysis |

Start with 200 of each to validate the pipeline, then scale.

---

## Training Pipeline (end-to-end)

```
FairFace/SCIN images
        ↓
label-hair.ts / label-skin.ts   (GPT-4o labels each image → JSONL)
        ↓
finetune.ts                      (uploads JSONL, submits OpenAI fine-tuning job)
        ↓
gpt-4o-mini fine-tuned model     (10x cheaper, faster, specialized)
        ↓
Railway env vars                 (OPENAI_FINETUNE_HAIR_MODEL / SKIN_MODEL)
        ↓
huggingface.ts routes to it      (zero code change needed)
```

---

## Fine-Tuning Target Model

Both scripts produce JSONL for fine-tuning `gpt-4o-mini-2024-07-18`:
- **10x cheaper** than gpt-4o per call (~$0.003/image vs $0.03/image in production)
- **Vision-capable** (as of OpenAI's 2024 update)
- **Fine-tunable** via OpenAI API

Once the fine-tuned model is live, switch with one Railway command:
```bash
npx @railway/cli variables set OPENAI_FINETUNE_HAIR_MODEL=ft:gpt-4o-mini-...:karysm-hair-v1:xxxx --service tokoss
npx @railway/cli variables set OPENAI_FINETUNE_SKIN_MODEL=ft:gpt-4o-mini-...:karysm-skin-v1:xxxx --service tokoss
```

No code changes, no redeployment needed.

---

## Human Validation (after labeling)

For best results, have 2–3 people with afro hair expertise review a sample:

1. Export 500 labeled examples
2. Set up Label Studio (free, self-hosted): https://labelstud.io
3. Have reviewers confirm or correct hairType labels
4. Filter to examples with 80%+ agreement
5. Re-run fine-tuning with validated set

This is how you go from "good" to "industry-leading."
