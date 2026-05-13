import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';
const hf = new HfInference(HF_TOKEN);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Fine-tuned model overrides — set after training completes, falls back to gpt-4o
const SKIN_MODEL = process.env.OPENAI_FINETUNE_SKIN_MODEL || 'gpt-4o';
const HAIR_MODEL = process.env.OPENAI_FINETUNE_HAIR_MODEL || 'gpt-4o';

// HuggingFace ViT model for broad hair type detection (Kinky/Curly/Dreadlocks/Straight/Wavy, 92.8% accuracy)
// Same author as skin_types_image_detection — runs in parallel with GPT-4o as a broad-category signal
const HAIR_TYPE_HF_MODEL = 'dima806/hair_type_image_detection';

// ── Monk Scale colors (approximate RGB for each tone 1-10) ──
const MONK_TONES: Array<{ tone: number; label: string; rgb: [number, number, number] }> = [
  { tone: 1, label: 'Très clair', rgb: [246, 237, 228] },
  { tone: 2, label: 'Clair', rgb: [238, 218, 196] },
  { tone: 3, label: 'Clair moyen', rgb: [217, 188, 157] },
  { tone: 4, label: 'Moyen', rgb: [196, 165, 132] },
  { tone: 5, label: 'Moyen foncé', rgb: [175, 137, 104] },
  { tone: 6, label: 'Foncé clair', rgb: [150, 112, 80] },
  { tone: 7, label: 'Foncé', rgb: [120, 85, 58] },
  { tone: 8, label: 'Foncé profond', rgb: [90, 60, 40] },
  { tone: 9, label: 'Très foncé', rgb: [60, 40, 25] },
  { tone: 10, label: 'Ébène', rgb: [40, 25, 15] },
];

// ── RGB to LAB conversion ──
function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  // Normalize RGB to 0-1
  let rn = r / 255, gn = g / 255, bn = b / 255;

  // sRGB to linear
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

  // Linear RGB to XYZ (D65)
  let x = (rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375) / 0.95047;
  let y = (rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750);
  let z = (rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041) / 1.08883;

  // XYZ to LAB
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + 16 / 116;
  x = f(x); y = f(y); z = f(z);

  return {
    L: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

// ── ITA (Individual Typology Angle) ──
function computeITA(L: number, b: number): number {
  return (Math.atan2(L - 50, b) * 180) / Math.PI;
}

// ── Classify Monk tone from LAB values ──
function classifyMonkTone(L: number): number {
  // Map L* (lightness) to Monk tone
  // L* range: ~20 (very dark) to ~90 (very light)
  if (L >= 80) return 1;
  if (L >= 72) return 2;
  if (L >= 65) return 3;
  if (L >= 58) return 4;
  if (L >= 52) return 5;
  if (L >= 45) return 6;
  if (L >= 38) return 7;
  if (L >= 30) return 8;
  if (L >= 22) return 9;
  return 10;
}

// ── Determine undertone from LAB ──
function classifyUndertone(a: number, b: number): string {
  // a > 0 = reddish (warm), a < 0 = greenish (cool)
  // b > 0 = yellowish (warm), b < 0 = bluish (cool)
  const warmScore = a * 0.5 + b * 0.5;
  if (warmScore > 5) return 'WARM';
  if (warmScore < -3) return 'COOL';
  return 'NEUTRAL';
}

// ── Melanin index from ITA ──
function computeMelaninIndex(ita: number): number {
  // ITA > 55° = very light, ITA < -30° = very dark
  // Map to 0-100 (100 = max melanin)
  return Math.max(0, Math.min(100, Math.round((55 - ita) * (100 / 85))));
}

// ── Generate recommendations ──
function generateRecommendations(analysis: {
  monkTone: number;
  hydration: number;
  sebum: number;
  acne: number;
  hyperpigmentation: number;
  spots: number;
  uniformity: number;
}): string[] {
  const recs: string[] = [];

  if (analysis.hydration < 40) recs.push('💧 Hydrater quotidiennement avec un sérum à l\'acide hyaluronique');
  if (analysis.hydration < 60) recs.push('💧 Boire plus d\'eau et utiliser une crème hydratante riche');

  if (analysis.sebum > 60) recs.push('🧴 Utiliser un nettoyant doux sans sulfate matin et soir');
  if (analysis.sebum > 80) recs.push('🧴 Appliquer un sérum matifiant à base de niacinamide');

  if (analysis.acne > 40) recs.push('🌿 Traiter les imperfections avec du tea tree ou de l\'acide salicylique');

  if (analysis.hyperpigmentation > 40) {
    recs.push('✨ Utiliser un sérum à la vitamine C pour uniformiser le teint');
    recs.push('☀️ Protection solaire SPF30+ quotidienne (essentielle pour peau foncée)');
  }

  if (analysis.spots > 40) recs.push('🌸 Appliquer un soin anti-taches ciblé à base d\'alpha-arbutine');

  if (analysis.uniformity < 50) recs.push('🌺 Exfolier doucement 1-2x/semaine pour lisser le grain de peau');

  if (analysis.monkTone >= 7) {
    recs.push('🧖 Privilégier des produits formulés pour les peaux foncées');
    recs.push('💛 Le beurre de karité et l\'huile de jojoba sont vos alliés');
  }

  if (recs.length === 0) {
    recs.push('✅ Votre peau est en bonne santé ! Continuez votre routine actuelle');
    recs.push('☀️ N\'oubliez pas la protection solaire quotidienne');
  }

  return recs.slice(0, 6);
}

// ── Main skin analysis function ──
export interface SkinAnalysisResult {
  monkTone: number;
  undertone: string;
  labL: number;
  labA: number;
  labB: number;
  itaAngle: number;
  melaninIndex: number;
  hydration: number;
  sebum: number;
  pores: number;
  wrinkles: number;
  spots: number;
  acne: number;
  hyperpigmentation: number;
  uniformity: number;
  overallScore: number;
  recommendations: string[];
  rawResponse: any;
}

export async function analyzeSkin(imageUrl: string): Promise<SkinAnalysisResult> {
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
  "recommendations": [<exactement 6 conseils personnalisés en français avec emojis, basés sur ce que tu observes réellement sur cette peau spécifique>],
  "reasoning": "<explication courte de ton analyse en 1-2 phrases>"
}

Échelle Monk Skin Tone :
1-2 = très clair (peau très pâle, rosée, peu de mélanine)
3-4 = clair à moyen (beige, olive clair, méditerranéen)
5-6 = moyen à foncé (caramel, brun clair, métis)
7-8 = foncé (brun, brun foncé, peau africaine)
9-10 = très foncé (ébène profond, très haute concentration en mélanine)

Si le visage n'est pas clairement visible, analyse la peau visible et fais de ton mieux.`;

  // Fetch image once, run HuggingFace + GPT-4o in parallel
  const imageResponse = await fetch(imageUrl);
  const imageBlob = new Blob([await imageResponse.arrayBuffer()]);

  const [hfResult, gptResult] = await Promise.allSettled([
    HF_TOKEN
      ? hf.imageClassification({ model: 'dima806/skin_types_image_detection', data: imageBlob as any })
      : Promise.reject('no HF token'),
    openai.chat.completions.create({
      model: SKIN_MODEL,
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          { type: 'text', text: SKIN_PROMPT },
        ],
      }],
    }),
  ]);

  // Parse GPT-4o
  let gpt: any = {};
  if (gptResult.status === 'fulfilled') {
    const content = gptResult.value.choices[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { gpt = JSON.parse(match[0]); } catch {}
    }
  } else {
    console.error('GPT-4o skin analysis error:', gptResult.reason);
  }

  // Parse HuggingFace oily/dry/acne signal
  const hfSkinType: any[] = hfResult.status === 'fulfilled' && Array.isArray(hfResult.value)
    ? hfResult.value
    : [];
  if (hfResult.status === 'rejected') console.error('HuggingFace skin error:', hfResult.reason);

  // GPT-4o is primary; blend HF signal for oily/dry/acne where it adds signal
  let sebum = Number(gpt.sebum) || 40;
  let hydration = Number(gpt.hydration) || 65;
  let acne = Number(gpt.acne) || 15;
  for (const r of hfSkinType) {
    const label = (r.label || '').toLowerCase();
    const score = r.score || 0;
    if (label.includes('oily')) sebum = Math.round((sebum + score * 100) / 2);
    if (label.includes('dry')) hydration = Math.round((hydration + (1 - score) * 100) / 2);
    if (label.includes('acne') || label.includes('pimple')) acne = Math.round((acne + score * 100) / 2);
  }

  const skinConditions = {
    hydration,
    sebum,
    pores: Number(gpt.pores) || 35,
    wrinkles: Number(gpt.wrinkles) || 20,
    spots: Number(gpt.spots) || 30,
    acne,
    hyperpigmentation: Number(gpt.hyperpigmentation) || 25,
    uniformity: Number(gpt.uniformity) || 70,
  };

  // GPT-4o Monk estimate → look up canonical RGB → proper LAB/ITA/melanin
  const monkTone: number = Math.max(1, Math.min(10, Math.round(Number(gpt.monkTone)) || 7));
  const [mr, mg, mb] = MONK_TONES[monkTone - 1].rgb;
  const lab = rgbToLab(mr, mg, mb);
  const ita = computeITA(lab.L, lab.b);
  const melanin = computeMelaninIndex(ita);
  const undertone: string = gpt.undertone || classifyUndertone(lab.a, lab.b);

  const overallScore = Number(gpt.overallScore) || Math.round(
    hydration * 0.2 +
    (100 - sebum) * 0.1 +
    (100 - skinConditions.pores) * 0.1 +
    (100 - skinConditions.wrinkles) * 0.1 +
    (100 - skinConditions.spots) * 0.1 +
    (100 - acne) * 0.15 +
    (100 - skinConditions.hyperpigmentation) * 0.1 +
    skinConditions.uniformity * 0.15
  );

  const recommendations = Array.isArray(gpt.recommendations) && gpt.recommendations.length > 0
    ? gpt.recommendations.slice(0, 6)
    : generateRecommendations({ monkTone, ...skinConditions });

  return {
    monkTone,
    undertone,
    labL: Math.round(lab.L * 100) / 100,
    labA: Math.round(lab.a * 100) / 100,
    labB: Math.round(lab.b * 100) / 100,
    itaAngle: Math.round(ita * 100) / 100,
    melaninIndex: melanin,
    ...skinConditions,
    overallScore,
    recommendations,
    rawResponse: {
      model: 'gpt-4o',
      usage: gptResult.status === 'fulfilled' ? gptResult.value.usage : null,
      hf: hfSkinType,
      reasoning: gpt.reasoning,
    },
  };
}

// ── HF hair label → Karysm domain mapping ──
function mapHfHairLabel(label: string, score: number): { broadType: string; suggestedHairTypes: string[] } {
  if (score < 0.35) return { broadType: 'UNKNOWN', suggestedHairTypes: [] };
  switch (label.toLowerCase()) {
    case 'kinky':      return { broadType: 'KINKY',    suggestedHairTypes: ['4B', '4C'] };
    case 'curly':      return { broadType: 'CURLY',    suggestedHairTypes: ['3C', '4A'] };
    case 'dreadlocks': return { broadType: 'LOCS',     suggestedHairTypes: [] };
    case 'straight':   return { broadType: 'STRAIGHT', suggestedHairTypes: [] };
    case 'wavy':       return { broadType: 'WAVY',     suggestedHairTypes: ['3A', '3B'] };
    default:           return { broadType: 'UNKNOWN',  suggestedHairTypes: [] };
  }
}

// ── Hair analysis ──
export interface HairAnalysisResult {
  hairType: string;
  porosity: string;
  density: string;
  thickness: string;
  dryness: number;
  elasticity: number;
  shrinkage: number;
  scalpCondition: string;
  currentStyle: string;
  overallScore: number;
  recommendations: string[];
  rawResponse: any;
}

export async function analyzeHair(imageUrl: string): Promise<HairAnalysisResult> {
  // Roboflow-inspired: observe visual features first (curl shape, diameter, definition,
  // porosity surface cues, protective style detection), then classify.
  const HAIR_PROMPT = `Tu es une experte trichologue spécialisée dans les cheveux afro-texturés (types 3C à 4C).
Analyse cette photo de cheveux et réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour.

Avant de classifier, observe ces indices visuels :
• Forme du pattern : S-curve (ressort), Z-angle (zigzag), spirale serrée, coil, ou aucun pattern visible
• Diamètre des boucles : très fin (<3mm), paille (~5mm), stylo (~7mm), ou plus large
• Définition : boucles distinctes et visibles vs texture coton/floue/indéfinie
• Surface : brillante/lisse (faible porosité) vs mate/terne/frisottis (haute porosité)
• Style : cheveux libres (texture visible) vs style protecteur (tresses/locks/twists cachent la texture)

Structure JSON requise :
{
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
  "confidence": <0-100, ta confiance dans la classification hairType>,
  "recommendations": [<6 conseils personnalisés en français avec emojis, basés sur ce que tu observes réellement>],
  "reasoning": "<explication courte de tes observations visuelles et de la classification en 1-2 phrases>"
}

Critères de classification :
- 3C : boucles en S définies, diamètre stylo (~7mm), shrinkage <50%
- 4A : boucles en S définies, diamètre paille (~5mm), shrinkage 50-60%
- 4B : boucles en Z/zigzag, peu de définition, texture coton, shrinkage 60-75%
- 4C : texture la plus serrée, quasiment pas de boucles définies, shrinkage 75-90%
- OTHER : cheveux lisses, ondulés (types 1-3B), ou non-afro

Porosité : LOW = brillant/lisse, MEDIUM = absorbance normale, HIGH = terne/frisottis/poreux
Si les cheveux sont dans un style protecteur (tresses, locks, twists), classe hairType selon ce que tu observes aux racines ou aux pointes visibles.`;

  // Fetch image blob once — shared between HF and GPT-4o
  const imageResponse = await fetch(imageUrl);
  const imageBlob = new Blob([await imageResponse.arrayBuffer()]);

  // Run HF hair type classifier + GPT-4o in parallel (mirrors Roboflow detect → classify pipeline)
  const [hfResult, gptResult] = await Promise.allSettled([
    HF_TOKEN
      ? hf.imageClassification({ model: HAIR_TYPE_HF_MODEL, data: imageBlob as any })
      : Promise.reject('no HF token'),
    openai.chat.completions.create({
      model: HAIR_MODEL,
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          { type: 'text', text: HAIR_PROMPT },
        ],
      }],
    }),
  ]);

  // Parse HF broad-category signal
  const hfPredictions: any[] = hfResult.status === 'fulfilled' && Array.isArray(hfResult.value)
    ? hfResult.value : [];
  if (hfResult.status === 'rejected') console.error('HF hair error:', hfResult.reason);

  const topHf = hfPredictions[0] || null;
  const hfMapped = topHf
    ? mapHfHairLabel(topHf.label, topHf.score)
    : { broadType: 'UNKNOWN', suggestedHairTypes: [] };

  // Parse GPT-4o fine-grained classification
  let gpt: any = {};
  let rawResponse: any = null;
  if (gptResult.status === 'fulfilled') {
    const content = gptResult.value.choices[0]?.message?.content || '';
    rawResponse = { model: HAIR_MODEL, usage: gptResult.value.usage };
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { gpt = JSON.parse(match[0]); } catch {}
    }
  } else {
    console.error('GPT-4o hair error:', gptResult.reason);
  }

  // Blend: HF provides broad-category validation, GPT-4o provides fine-grained typing
  let hairType: string = gpt.hairType || '4B';
  let currentStyle: string = gpt.currentStyle || 'AFRO';

  // HF "Dreadlocks" with high confidence → hard-override style regardless of GPT-4o
  if (hfMapped.broadType === 'LOCS' && topHf && topHf.score > 0.60) {
    currentStyle = 'LOCS';
  }

  // HF "Kinky" (94% precision) but GPT says light type → clamp up (prevents under-classification)
  if (hfMapped.broadType === 'KINKY' && topHf && topHf.score > 0.75 && ['3C', '4A'].includes(hairType)) {
    hairType = '4B';
  }

  // HF "Curly" (91% precision) but GPT says 4C → clamp down (prevents over-classification)
  if (hfMapped.broadType === 'CURLY' && topHf && topHf.score > 0.75 && hairType === '4C') {
    hairType = '4A';
  }

  // Validate enum values
  const VALID_HAIR_TYPES = ['3C', '4A', '4B', '4C', 'OTHER'];
  if (!VALID_HAIR_TYPES.includes(hairType)) hairType = '4B';
  const VALID_STYLES = ['AFRO', 'BRAIDS', 'LOCS', 'TWISTS', 'STRAIGHT', 'WEAVE', 'WIG', 'OTHER'];
  if (!VALID_STYLES.includes(currentStyle)) currentStyle = 'AFRO';

  const recommendations = Array.isArray(gpt.recommendations) && gpt.recommendations.length > 0
    ? gpt.recommendations.slice(0, 6)
    : DEFAULT_HAIR_RECS;

  return {
    hairType,
    porosity: gpt.porosity || 'HIGH',
    density: gpt.density || 'MEDIUM',
    thickness: gpt.thickness || 'MEDIUM',
    dryness: Number(gpt.dryness) || 55,
    elasticity: Number(gpt.elasticity) || 60,
    shrinkage: Number(gpt.shrinkage) || 70,
    scalpCondition: gpt.scalpCondition || 'HEALTHY',
    currentStyle,
    overallScore: Number(gpt.overallScore) || 68,
    recommendations,
    rawResponse: {
      ...rawResponse,
      reasoning: gpt.reasoning,
      confidence: gpt.confidence,
      hf: hfPredictions.slice(0, 3),
      hfBroadType: hfMapped.broadType,
    },
  };
}

const DEFAULT_HAIR_RECS = [
  '💧 Hydrater avec la méthode LOC (Liquid, Oil, Cream)',
  '🧴 Deep conditioning hebdomadaire au beurre de karité',
  '🌙 Protéger les cheveux la nuit avec un bonnet en satin',
  '✂️ Couper les pointes sèches tous les 3 mois',
  '🚿 Co-wash entre les shampoings pour préserver l\'hydratation',
  '🌿 Éviter les produits contenant des sulfates et silicones',
];
