# Karysm — Skin Analysis: Complete Improvement Log

## What existed before this session

`analyzeSkin()` in `apps/api/src/lib/huggingface.ts` returned **hardcoded static values** regardless of the uploaded selfie:

```typescript
// Before — every user got identical results
monkTone: 7,
undertone: 'WARM',
hydration: 65,
sebum: 40,
// ... all fixed
```

No real computer vision. No model call. No Monk Scale classification whatsoever.

---

## Commit 1 — Real GPT-4o Vision + HuggingFace parallel analysis

**File:** `apps/api/src/lib/huggingface.ts`

Replaced the hardcoded block with a parallel pipeline:
- **GPT-4o Vision** → full skin assessment (Monk tone, undertone, 8 skin metrics, recommendations)
- **`dima806/skin_types_image_detection`** (HuggingFace ViT) → oily/dry/acne signal, blended into GPT output

Image blob fetched once, both models receive it simultaneously via `Promise.allSettled()`.

### Output fields
- `monkTone`: 1–10 (Monk Skin Tone Scale)
- `undertone`: WARM | COOL | NEUTRAL
- `labL`, `labA`, `labB`: CIE LAB color space values
- `itaAngle`: Individual Typology Angle (degrees)
- `melaninIndex`: 0–100 (derived from ITA)
- `hydration`, `sebum`, `pores`, `wrinkles`, `spots`, `acne`, `hyperpigmentation`, `uniformity`: 0–100 scores
- `overallScore`: 0–100 composite
- `recommendations`: 6 personalized tips in French

### LAB / ITA / Melanin pipeline

```
GPT-4o Monk estimate (1-10)
        ↓
MONK_TONES[n].rgb  →  rgbToLab()  →  computeITA()  →  computeMelaninIndex()
(canonical hex)         LAB           ITA°              0-100 melanin
```

The canonical RGB → LAB → ITA chain ensures physical color science is correct
regardless of the precision of GPT's Monk estimate.

### HF blending

```typescript
for (const r of hfSkinType) {
  if (label.includes('oily')) sebum = blend(sebum, score * 100);
  if (label.includes('dry'))  hydration = blend(hydration, (1-score)*100);
  if (label.includes('acne')) acne = blend(acne, score * 100);
}
```

GPT-4o is primary; HF provides a validation nudge for the oily/dry/acne axis.

---

## Commit 2 — Official Monk Scale hex codes

**File:** `apps/api/src/lib/huggingface.ts`

### Sources

| Source | URL | License | Used |
|--------|-----|---------|------|
| Monk Skin Tone Scale paper | Ellis et al. (2023), Google Research | CC BY 4.0 | Canonical hex codes |
| Wikipedia Monk Skin Tone Scale | en.wikipedia.org/wiki/Monk_Skin_Tone_Scale | CC BY-SA 4.0 | Verification |
| MST-E Dataset | skintone.google/mste-dataset | CC BY 4.0 | Calibration reference (19 subjects × 10 tones) |
| STW Dataset paper | arxiv 2603.02475 (2026) | Research | Dark-tone bias finding |
| DDI Dataset | ddi-dataset.github.io | **Non-commercial** | NOT used — license incompatible |

### `MONK_TONES` — before vs. after

Before (rough approximations):
```typescript
{ tone: 1, rgb: [246, 237, 228] },  // close but not precise
{ tone: 6, rgb: [150, 112, 80]  },  // wrong
{ tone: 7, rgb: [120, 85, 58]   },  // wrong
```

After (official hex codes, Ellis et al. 2023):
```typescript
{ tone: 1,  hex: '#f6ede4', rgb: [246, 237, 228] },
{ tone: 2,  hex: '#f3e7db', rgb: [243, 231, 219] },
{ tone: 3,  hex: '#f7ead0', rgb: [247, 234, 208] },
{ tone: 4,  hex: '#eadaba', rgb: [234, 218, 186] },
{ tone: 5,  hex: '#d7bd96', rgb: [215, 189, 150] },
{ tone: 6,  hex: '#a07850', rgb: [160, 120, 80]  },
{ tone: 7,  hex: '#825c43', rgb: [130, 92, 67]   },
{ tone: 8,  hex: '#604134', rgb: [96, 65, 52]    },
{ tone: 9,  hex: '#3a312a', rgb: [58, 49, 42]    },
{ tone: 10, hex: '#292420', rgb: [41, 36, 32]    },
```

Tone 6 changed from [150,112,80] → [160,120,80], tones 7–10 all recalibrated.

### `classifyMonkTone` — L*-only → LAB nearest-neighbor

Old approach: classify by L* (lightness) threshold only.

**Problem**: Tones 1–4 all have L* ≈ 91–95 (computed from official hex):
- MST 1 (#f6ede4): L* ≈ 94.5
- MST 2 (#f3e7db): L* ≈ 92.6
- MST 3 (#f7ead0): L* ≈ 93.2
- MST 4 (#eadaba): L* ≈ 91.3

These are indistinguishable from L* alone. They differ in a* (redness) and b* (yellowness).

New approach: LAB Euclidean distance to nearest canonical tone:
```typescript
function classifyMonkTone(L, a, b) {
  for (const mt of MONK_TONES) {
    const mtLab = rgbToLab(...mt.rgb);
    const dist = √( (L-mtLab.L)² + (a-mtLab.a)² + (b-mtLab.b)² );
    // pick minimum
  }
}
```

---

## Commit 3 — Dark-tone bias correction in SKIN_PROMPT

**Files:** `apps/api/src/lib/huggingface.ts`, `scripts/datasets/label-skin.ts`

### STW paper finding (arxiv 2603.02475, 2026)

The Skin Tone in the Wild (STW) dataset paper analyzed 42,313 images from 3,564 individuals
annotated with the MST 10-tone scale. Key finding:

> **ML models trained on standard datasets (majority light-skin) systematically
> under-classify MST tones 7-10**, assigning tone 5-6 to subjects who are actually 7-8.
> The STW dataset itself is imbalanced: tones 1-4 are over-represented, 7-10 under-represented.

### What changed in SKIN_PROMPT

Before:
```
Échelle Monk Skin Tone :
1-2 = très clair (peau très pâle, rosée, peu de mélanine)
...
```

After — hex anchors + bias correction:
```
Échelle Monk Skin Tone — ancres hexadécimales officielles (Google 2023) :
MST 1  #f6ede4 — très clair, peau pâle rosée
...
MST 7  #825c43 — brun, peau africaine claire à moyenne
MST 8  #604134 — brun foncé, peau africaine moyenne à foncée
MST 9  #3a312a — ébène clair, peau très foncée
MST 10 #292420 — ébène profond

⚠️ Biais connu à corriger : les modèles IA sous-classifient systématiquement les tons 7-10.
En cas de doute entre deux tons pour une peau foncée, choisis le plus foncé des deux.
```

Visual hex anchors let GPT-4o compare mentally against the official palette.
The bias-correction instruction directly counteracts the STW-documented under-classification.

### `label-skin.ts` synced

`label-skin.ts` SKIN_PROMPT is always kept identical to the one in `huggingface.ts analyzeSkin()`.
Training data must be labeled with the same prompt that production uses — otherwise the
fine-tuned model overfits to a different distribution.

---

## Datasets — licensing summary

| Dataset | License | Images | Decision |
|---------|---------|--------|----------|
| SCIN (google/scin) | SCIN DUL (commercial OK) | ~10,000 | ✅ Use for training |
| MST-E (Google) | CC BY 4.0 | 1,515 (19×10 tones) | ✅ Use as calibration reference |
| PAD-UFES-20 (Mendeley) | CC BY 4.0 | 2,298 | ✅ Use for training |
| DDI (Stanford) | **Non-commercial** | 656 | ❌ Excluded |
| Fitzpatrick17k | CC BY-NC-SA | 17,000 | ❌ Excluded |
| HAM10000 | CC BY-NC | 10,015 | ❌ Excluded |
| STW Dataset | Research paper | 42,313 | ❌ Dataset not public — findings used |

---

## Architecture summary — current state

```
User selfie (skin-capture.tsx)
        ↓
POST /api/ai/skin-analysis
        ↓
fetch image blob (once)
        ↓
 ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
 │ dima806/skin_types_image_detection│  │ GPT-4o / fine-tuned gpt-4o-mini  │
 │ (HuggingFace ViT)                │  │ (SKIN_MODEL env var routing)     │
 │ oily / dry / normal / acne       │  │ Monk tone + 8 skin metrics       │
 │ → blends into sebum/hydration    │  │ hex-anchored prompt, bias fix    │
 └────────────────┬─────────────────┘  └──────────────┬───────────────────┘
                  └──────────────┬─────────────────────┘
                                 ↓
                    GPT-4o Monk tone (1-10)
                                 ↓
                  MONK_TONES[n].rgb (official hex)
                                 ↓
                    rgbToLab() → ITA → melaninIndex
                                 ↓
                        SkinAnalysisResult
                    (Monk tone, LAB, ITA, 8 metrics,
                     6 personalized recommendations)
                                 ↓
                    skin-results/[id].tsx
```

## Fine-tuning pipeline — when you're ready

```bash
# 1. Label training data (SCIN dataset, commercial license)
OPENAI_API_KEY=sk-... npx tsx scripts/datasets/label-skin.ts \
  --limit 500 --output skin-training.jsonl

# 2. Submit fine-tuning (needs ≥10 examples, ideally ≥200)
npx tsx scripts/finetune.ts --type skin --file skin-training.jsonl

# 3. Activate fine-tuned model (no code change, no redeployment)
npx @railway/cli variables set \
  OPENAI_FINETUNE_SKIN_MODEL=ft:gpt-4o-mini-...:karysm-skin-v1:xxxx \
  --service tokoss
```

Target: 200 examples → ~$0.60 labeling cost.
