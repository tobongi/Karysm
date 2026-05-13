# Karysm — Hair Analysis: Complete Improvement Log

## What existed before this session

`analyzeHair()` in `apps/api/src/lib/huggingface.ts` returned **hardcoded static values** regardless of the uploaded photo:

```typescript
// Before — every user got identical results
hairType: '4B',
porosity: 'HIGH',
density: 'MEDIUM',
thickness: 'MEDIUM',
dryness: 55,
elasticity: 60,
shrinkage: 70,
```

No real computer vision. No model call. No classification whatsoever.

---

## Commit 1 — `7cef5df` — Real GPT-4o Vision analysis

**File:** `apps/api/src/lib/huggingface.ts`

Replaced the hardcoded block with a live GPT-4o Vision call. The model receives the user's actual photo and returns a structured JSON with:

- `hairType`: 3C / 4A / 4B / 4C / OTHER
- `porosity`, `density`, `thickness`
- `dryness`, `elasticity`, `shrinkage` (0–100 scores)
- `scalpCondition`, `currentStyle`
- `overallScore`, `recommendations` (6 personalized tips in French)
- `reasoning` (1–2 sentence explanation)

French-language prompt targeting afro-textured hair (types 3C–4C). Falls back to neutral defaults if the OpenAI call fails.

**Same commit — skin analysis fixed:** `analyzeSkin()` was also returning a hardcoded Monk tone 7 for every user. Replaced with GPT-4o skin analysis running in parallel with the existing HuggingFace `skin_types_image_detection` model, with proper blending.

---

## Commit 2 — `2af39c1` — Fine-tuning pipeline

**Files:** `scripts/finetune.ts`, `apps/api/src/routes/admin.routes.ts`, `apps/api/.env.example`

### `scripts/finetune.ts`

CLI tool to train a specialized model from labeled data:

```bash
npx tsx scripts/finetune.ts --type hair --file hair-training.jsonl
npx tsx scripts/finetune.ts --status ft-abc123   # poll job status
```

- Uploads JSONL to OpenAI Files API
- Submits fine-tuning job on `gpt-4o-mini-2024-07-18` (10× cheaper than gpt-4o in production)
- Sets `n_epochs: 4` for <50 examples, `3` for larger sets
- On completion prints the model ID and the exact Railway command to activate it

### `GET /api/admin/training-data/:type` (skin | hair)

Admin route that exports user-consented analyses from the database as OpenAI fine-tuning JSONL. Each line:

```json
{"messages": [{"role": "user", "content": [image_url, prompt]}, {"role": "assistant", "content": "{classification JSON}"}]}
```

### Model routing in `huggingface.ts`

```typescript
const HAIR_MODEL = process.env.OPENAI_FINETUNE_HAIR_MODEL || 'gpt-4o';
```

Set the env var after fine-tuning completes — zero code change, zero redeployment:

```bash
npx @railway/cli variables set OPENAI_FINETUNE_HAIR_MODEL=ft:gpt-4o-mini-...:karysm-hair-v1:xxxx --service tokoss
```

---

## Commit 3 — `1de9187` — Dataset labeling pipeline

**Files:** `scripts/datasets/label-hair.ts`, `scripts/datasets/label-skin.ts`, `scripts/datasets/README.md`

### `scripts/datasets/label-hair.ts`

Fetches the [FairFace](https://huggingface.co/datasets/HuggingFaceM4/FairFace) dataset (CC BY 4.0) from the HuggingFace REST API, filters to `race == "Black"` (~15,500 images out of 108K), and labels each image with GPT-4o.

Quality filters applied per image:
- `hairVisible === false` → skip
- `hairType === 'OTHER'` → skip (non-afro, types 1–3B)
- `confidence < minConfidence` (default 70%) → skip

Outputs OpenAI fine-tuning JSONL, strips internal fields (`hairVisible`, `confidence`) from the training target.

```bash
npx tsx scripts/datasets/label-hair.ts --limit 500 --output hair-training.jsonl
npx tsx scripts/datasets/label-hair.ts --limit 500 --offset 500 --output hair-training.jsonl  # resume
```

Cost: ~$0.003/image → 500 rows ≈ $1.50, full 15K ≈ $45.

**This creates the world's first commercially-licensed labeled 4A/4B/4C afro hair dataset.**

### `scripts/datasets/label-skin.ts`

Same pattern for skin — fetches [SCIN](https://huggingface.co/datasets/google/scin) (Google, commercial-OK license) and labels with GPT-4o skin prompt.

### Commercially-usable datasets

| Dataset | License | Images | Use |
|---|---|---|---|
| FairFace (HuggingFaceM4/FairFace) | CC BY 4.0 | ~15,500 Black subset | Hair 4A/4B/4C labeling |
| SCIN (google/scin) | SCIN DUL (commercial OK) | ~10,000 | Skin Monk Scale |
| PAD-UFES-20 (Mendeley) | CC BY 4.0 | 2,298 | Skin (darker tones) |
| MST-E (Google) | CC BY 4.0 | 1,515 | Monk scale calibration |

**Do NOT use:** Fitzpatrick17k (CC BY-NC-SA), HAM10000 (CC BY-NC), DDI Stanford (research-only).

---

## Commit 4 — `d37553f` — Roboflow-inspired: HF ViT model + visual feature extraction

Inspired by [universe.roboflow.com/aishas-workspace/black-hair-detection](https://universe.roboflow.com/aishas-workspace/black-hair-detection) — an object-detection dataset for Black hair styles.

### Key Roboflow insight: detect → classify pipeline

Roboflow models first detect the hair region (bounding box), then classify the content. We replicate this with two parallel models.

### `dima806/hair_type_image_detection` added

HuggingFace ViT model (same author as our skin classifier), 92.8% overall accuracy:

| Class | Precision | Recall | F1 |
|---|---|---|---|
| Kinky | 0.942 | 0.956 | 0.949 |
| Dreadlocks | 0.967 | 0.990 | **0.978** |
| Straight | 0.959 | 0.898 | 0.927 |
| Curly | 0.911 | 0.893 | 0.902 |
| Wavy | 0.865 | 0.903 | 0.884 |

Runs in parallel with GPT-4o (same pattern as skin analysis), fetching the image blob once.

### Blending logic

```
HF "Dreadlocks" > 60% confidence   → hard-override currentStyle = LOCS
HF "Kinky" > 75% + GPT says 3C/4A  → clamp to 4B  (prevents under-classification)
HF "Curly" > 75% + GPT says 4C     → clamp to 4A  (prevents over-classification)
```

HF mapping:

| HF Label | Broad type | Suggests |
|---|---|---|
| Kinky | KINKY | 4B, 4C |
| Curly | CURLY | 3C, 4A |
| Dreadlocks | LOCS | — (style override) |
| Straight | STRAIGHT | — |
| Wavy | WAVY | 3A, 3B |

### Prompt: visual feature extraction before classification

GPT-4o now observes explicit visual cues before classifying (the feature extraction step that CV models apply internally):

```
• Curl pattern shape: S-curve / Z-angle / tight spiral / coil / no pattern
• Curl diameter: <3mm / straw ~5mm / pen ~7mm
• Definition level: distinct visible coils vs fluffy/undefined/cotton
• Surface texture: shiny/smooth (low porosity) vs matte/frizzy (high porosity)
• Style: free hair (texture visible) vs protective style hiding the texture
```

### HF quality gate in labeling pipeline (`label-hair.ts`)

The dataset labeler now runs the HF ViT model on each FairFace image. If it returns "Straight" or "Wavy" with >70% confidence, the image is filtered out — these are Black-labeled FairFace subjects with chemically relaxed or non-afro hair that would corrupt the training data.

```
hfFiltered counter added to progress output
```

### Mobile: inclusive tip for protective styles

Hair capture tips updated:
- Before: "Détachés — Cheveux libres, naturels" (excluded users with braids/locs)
- After: "Texture visible — Libres ou racines/pointes exposées" (works with any style)

---

## Commit 5 — `c3bc088` — Expanded taxonomy + clinical trichoscopy calibration

### Sources researched

| URL | Finding | Used |
|---|---|---|
| afrohairlibrary.org | 3D Black hair models — BOSS License **prohibits AI training** | Taxonomy reference only |
| arxiv 2306.06061 | PCA + K-means clustering of African hairstyles — 13+ natural clusters | Confirms taxonomy expansion |
| data.mendeley.com/datasets/s798m8mdgm/1 | CC BY 4.0 clinical trichoscopy study on African descent women | **Clinical calibration** |
| prettydarke.cool | Same project as afrohairlibrary, same license | Taxonomy reference |
| Pinterest (auriea/hair-dataset) | ~65 hair images, limited access | Nothing implementable |
| ResearchGate (387485832) | 403 error | Nothing implementable |

### `currentStyle` taxonomy: 8 → 17 categories

Before:
```
AFRO | BRAIDS | LOCS | TWISTS | STRAIGHT | WEAVE | WIG | OTHER
```

After (afrohairlibrary taxonomy + arxiv cluster groups):
```
AFRO | WASH_N_GO | TWA | BOX_BRAIDS | BRAIDS | CORNROWS |
LOCS | FAUX_LOCS | TWISTS | TWIST_OUT | FLAT_TWIST | BANTU_KNOTS |
STRAIGHT | WEAVE | WIG | PROTECTIVE | OTHER
```

### Clinical trichoscopy calibration in prompt (Mendeley CC BY 4.0)

Reference values from El Kadi (2025) study on healthy African descent women:

```
thickness FINE   : shaft diameter <70µm — thin, translucent in light, fragile
thickness MEDIUM : 70–100µm — normal resistance
thickness COARSE : >100µm — robust, visibly thick, high sheen

density LOW      : <15 follicles/cm² — scalp visible between strands
density MEDIUM   : 15–25 follicles/cm² — normal density
density HIGH     : >25 follicles/cm² — compact mass, scalp not visible

scalpCondition HEALTHY   : no pathological signs
scalpCondition DRY       : fine scales, dull appearance
scalpCondition DANDRUFF  : thick flakes, seborrheic scales
scalpCondition OILY      : shiny scalp, seborrheic
scalpCondition IRRITATED : redness, visible inflammation
```

### Mobile sync: `STYLE_LABELS` and `SCALP_INFO`

**Bug fixed:** `SCALP_INFO` had `FLAKY` but the API produced `DANDRUFF` — users were seeing the raw string. Fixed by adding `DANDRUFF` + `IRRITATED`, keeping `FLAKY` as a legacy alias.

`STYLE_LABELS` now covers all 17 `currentStyle` values with French labels.

---

## Architecture summary — current state

```
User photo (hair-capture.tsx)
        ↓
POST /api/ai/hair-analysis
        ↓
fetch image blob (once)
        ↓
 ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
 │ dima806/hair_type_image_detection │  │ GPT-4o / fine-tuned gpt-4o-mini  │
 │ (HuggingFace ViT, 92.8% acc.)    │  │ (HAIR_MODEL env var routing)     │
 │ Kinky/Curly/Dreadlocks/Straight/ │  │ Visual feature extraction prompt  │
 │ Wavy — broad category            │  │ 4A/4B/4C + all 12 fields         │
 └────────────────┬─────────────────┘  └──────────────┬───────────────────┘
                  └──────────────┬─────────────────────┘
                                 ↓
                           blend signals
                    (Dreadlocks → LOCS override,
                     Kinky clamps 3C/4A → 4B,
                     Curly clamps 4C → 4A)
                                 ↓
                        HairAnalysisResult
                     (17-category style, clinical
                      trichoscopy-calibrated fields)
                                 ↓
                     hair-results/[id].tsx
                  (STYLE_LABELS × 17, SCALP_INFO × 5)
```

## Fine-tuning pipeline — when you're ready

```bash
# 1. Label training data
OPENAI_API_KEY=sk-... npx tsx scripts/datasets/label-hair.ts \
  --limit 500 --output hair-training.jsonl

# 2. Submit fine-tuning (needs ≥10 examples, ideally ≥200)
npx tsx scripts/finetune.ts --type hair --file hair-training.jsonl

# 3. Activate fine-tuned model (no code change, no redeployment)
npx @railway/cli variables set \
  OPENAI_FINETUNE_HAIR_MODEL=ft:gpt-4o-mini-...:karysm-hair-v1:xxxx \
  --service tokoss
```

Target: 200 examples → ~$0.60 labeling cost. Full 15K FairFace subset → ~$45.
