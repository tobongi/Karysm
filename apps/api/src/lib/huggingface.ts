import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';
const hf = new HfInference(HF_TOKEN);

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai || new OpenAI({ apiKey: '' });
}

// Fine-tuned model overrides — set after training completes, falls back to gpt-4o
const SKIN_MODEL = process.env.OPENAI_FINETUNE_SKIN_MODEL || 'gpt-4o';
const HAIR_MODEL = process.env.OPENAI_FINETUNE_HAIR_MODEL || 'gpt-4o';

// HuggingFace ViT model for broad hair type detection (Kinky/Curly/Dreadlocks/Straight/Wavy, 92.8% accuracy)
// Same author as skin_types_image_detection — runs in parallel with GPT-4o as a broad-category signal
const HAIR_TYPE_HF_MODEL = 'dima806/hair_type_image_detection';

// ── Monk Skin Tone Scale — official hex codes (Google, 2023) ──
// Source: Ellis et al. "Monk Skin Tone Scale" (2023) + Wikipedia Monk Skin Tone Scale
// 40% of the scale (tones 7-10) covers the dark end — designed for global diversity
const MONK_TONES: Array<{ tone: number; label: string; hex: string; rgb: [number, number, number] }> = [
  { tone: 1,  label: 'Très clair',      hex: '#f6ede4', rgb: [246, 237, 228] },
  { tone: 2,  label: 'Clair',           hex: '#f3e7db', rgb: [243, 231, 219] },
  { tone: 3,  label: 'Clair doré',      hex: '#f7ead0', rgb: [247, 234, 208] },
  { tone: 4,  label: 'Beige doré',      hex: '#eadaba', rgb: [234, 218, 186] },
  { tone: 5,  label: 'Caramel',         hex: '#d7bd96', rgb: [215, 189, 150] },
  { tone: 6,  label: 'Brun caramel',    hex: '#a07850', rgb: [160, 120, 80]  },
  { tone: 7,  label: 'Brun',            hex: '#825c43', rgb: [130, 92, 67]   },
  { tone: 8,  label: 'Brun foncé',      hex: '#604134', rgb: [96, 65, 52]    },
  { tone: 9,  label: 'Ébène clair',     hex: '#3a312a', rgb: [58, 49, 42]    },
  { tone: 10, label: 'Ébène profond',   hex: '#292420', rgb: [41, 36, 32]    },
];

// ── RGB to LAB conversion ──
export function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
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
export function computeITA(L: number, b: number): number {
  return (Math.atan2(L - 50, b) * 180) / Math.PI;
}

// ── Nearest-neighbor Monk tone from LAB values (LAB Euclidean distance) ──
// More accurate than L*-only thresholds: tones 1-4 are nearly identical in L* (~91-95)
// but differ in a* (redness) and b* (yellowness).
export function classifyMonkTone(L: number, a: number, b: number): number {
  let bestTone = 7;
  let bestDist = Infinity;
  for (const mt of MONK_TONES) {
    const mtLab = rgbToLab(...mt.rgb);
    const dist = Math.sqrt(
      (L - mtLab.L) ** 2 + (a - mtLab.a) ** 2 + (b - mtLab.b) ** 2
    );
    if (dist < bestDist) { bestDist = dist; bestTone = mt.tone; }
  }
  return bestTone;
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
export function computeMelaninIndex(ita: number): number {
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
  // Hex anchors from official Monk Scale (Ellis et al. 2023, Google).
  // Anti-bias note (STW 2026, arxiv 2603.02475): ML models trained on
  // majority-light-skin corpora systematically under-classify tones 7-10 —
  // assigning MST 5-6 to subjects who are actually 7-8, etc. Counter this
  // by anchoring on the actual hex and biasing toward the darker option when uncertain.
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

Échelle Monk Skin Tone — ancres hexadécimales officielles (Google 2023) :
MST 1  #f6ede4 — très clair, peau pâle rosée, quasiment pas de mélanine
MST 2  #f3e7db — clair, peau ivoire-beige
MST 3  #f7ead0 — clair doré, beige chaud
MST 4  #eadaba — beige doré, olive clair
MST 5  #d7bd96 — caramel clair, méditerranéen/métis clair
MST 6  #a07850 — brun caramel, métis foncé, peau miel-acajou
MST 7  #825c43 — brun, peau africaine claire à moyenne
MST 8  #604134 — brun foncé, peau africaine moyenne à foncée
MST 9  #3a312a — ébène clair, peau très foncée
MST 10 #292420 — ébène profond, concentration maximale en mélanine

⚠️ Biais connu à corriger : les modèles IA entraînés sur des corpus à majorité de peaux claires
sous-classifient systématiquement les tons 7-10 (STW dataset, 2026, 42 313 images annotées).
En cas de doute entre deux tons pour une peau foncée, choisis le plus foncé des deux.
Compare mentalement avec les ancres hex ci-dessus avant de choisir.

Undertone :
- WARM : tons chauds (peach, doré, olive, cuivré — canaux rouges/jaunes dominants)
- COOL : tons froids (rosé, violacé, bleuté — canaux bleus dominants)
- NEUTRAL : équilibre chaud/froid

Si le visage n'est pas clairement visible, analyse la peau visible et fais de ton mieux.`;

  // Fetch image once, run HuggingFace + GPT-4o in parallel
  const imageResponse = await fetch(imageUrl);
  const imageBlob = new Blob([await imageResponse.arrayBuffer()]);

  const [hfResult, gptResult] = await Promise.allSettled([
    HF_TOKEN
      ? hf.imageClassification({ model: 'dima806/skin_types_image_detection', data: imageBlob as any })
      : Promise.reject('no HF token'),
    getOpenAIClient().chat.completions.create({
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

// ── Shrinkage calibration — GPT sees the expanded afro and under-estimates ──
// Clamp to scientifically documented ranges per hair type (trichoscopy studies)
const SHRINKAGE_RANGES: Record<string, [number, number]> = {
  '4C': [75, 90],
  '4B': [60, 75],
  '4A': [50, 65],
  '3C': [35, 50],
};

function calibrateShrinkage(gptValue: number | undefined, hairType: string): number {
  const range = SHRINKAGE_RANGES[hairType];
  if (!range) return Math.max(0, Math.min(45, Number(gptValue) || 30));
  const [min, max] = range;
  const mid = Math.round((min + max) / 2);
  const v = Number(gptValue);
  if (!v || isNaN(v)) return mid;
  return Math.max(min, Math.min(max, v));
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
  // null when currentStyle is LOCS/FAUX_LOCS — physically unmeasurable from a photo
  elasticity: number | null;
  shrinkage: number | null;
  scalpCondition: string;
  currentStyle: string;
  overallScore: number;
  recommendations: string[];
  rawResponse: any;
}

export async function analyzeHair(imageUrl: string): Promise<HairAnalysisResult> {
  // Roboflow-inspired visual feature extraction + clinical trichoscopy calibration
  // from Mendeley CC BY 4.0 study on African descent women (El Kadi, 2025).
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
  "shrinkage": <estimation visuelle OBLIGATOIRE — calibrée par type: 4C=75-90, 4B=60-75, 4A=50-65, 3C=35-50, OTHER=0-30; si style protecteur (locs/tresses/perruque) répondre 0>,
  "scalpCondition": "HEALTHY" | "DRY" | "OILY" | "DANDRUFF" | "IRRITATED",
  "currentStyle": "AFRO" | "WASH_N_GO" | "TWA" | "BOX_BRAIDS" | "BRAIDS" | "CORNROWS" | "LOCS" | "FAUX_LOCS" | "TWISTS" | "TWIST_OUT" | "FLAT_TWIST" | "BANTU_KNOTS" | "STRAIGHT" | "WEAVE" | "WIG" | "PROTECTIVE" | "OTHER",
  "overallScore": <0-100>,
  "confidence": <0-100, ta confiance dans la classification hairType>,
  "recommendations": [<6 conseils personnalisés en français avec emojis, basés sur ce que tu observes réellement>],
  "reasoning": "<explication courte de tes observations visuelles et de la classification en 1-2 phrases>"
}

Critères de classification hairType :
- 3C : boucles en S définies, diamètre stylo (~7mm), shrinkage <50%
- 4A : boucles en S définies, diamètre paille (~5mm), shrinkage 50-60%
- 4B : boucles en Z/zigzag, peu de définition, texture coton, shrinkage 60-75%
- 4C : texture la plus serrée, quasiment pas de boucles définies, shrinkage 75-90%
- OTHER : cheveux lisses, ondulés (types 1-3B), ou non-afro

Calibration clinique (trichoscopie, normes femmes d'ascendance africaine) :
- thickness FINE : diamètre capillaire <70µm — cheveux fins, translucides en lumière, cassants
- thickness MEDIUM : 70-100µm — densité normale, résistance correcte
- thickness COARSE : >100µm — cheveux robustes, brillants, visiblement épais
- density LOW : <15 follicules/cm² — cuir chevelu visible entre les mèches
- density MEDIUM : 15-25 follicules/cm² — densité normale
- density HIGH : >25 follicules/cm² — masse compacte, cuir chevelu non visible
- scalpCondition HEALTHY : cuir chevelu clair, sans signes pathologiques
- scalpCondition DRY : squames fines, aspect terne, desquamation sèche
- scalpCondition DANDRUFF : squames épaisses visibles, pellicules, séborrhée
- scalpCondition OILY : cuir chevelu luisant, séborrhéique, collant
- scalpCondition IRRITATED : rougeurs, inflammation, prurit apparent

Coiffures (currentStyle) :
- AFRO : cheveux naturels non coiffés en volume
- WASH_N_GO : boucles définies avec produits, cheveux libres
- TWA : Teenie Weenie Afro, cheveux très courts naturels
- BOX_BRAIDS : tresses individuelles carrées volumineuses
- BRAIDS : tresses en général (si impossible de distinguer)
- CORNROWS : tresses plates collées au crâne
- LOCS : locks/dreadlocks matures
- FAUX_LOCS : faux locks (extension)
- TWISTS : vanille twists, chunky twists, cheveux libres torsadés
- TWIST_OUT : défrisage de twists, boucles définies par twist-out
- FLAT_TWIST : twists plats collés au crâne
- BANTU_KNOTS : petits chignons/nœuds disposés sur la tête
- STRAIGHT : cheveux lissés (défrisage, lissage thermique)
- WEAVE : extension cousue/collée
- WIG : perruque
- PROTECTIVE : style protecteur non identifié avec précision
- OTHER : style non catégorisé

Porosité : LOW = brillant/lisse/water beads off, MEDIUM = absorbance normale, HIGH = terne/frisottis/absorbe vite
Si les cheveux sont dans un style protecteur (tresses, locks, twists), classe hairType selon ce que tu observes aux racines ou aux pointes visibles.`;

  // Fetch image blob once — shared between HF and GPT-4o
  const imageResponse = await fetch(imageUrl);
  const imageBlob = new Blob([await imageResponse.arrayBuffer()]);

  // Run HF hair type classifier + GPT-4o in parallel (mirrors Roboflow detect → classify pipeline)
  const [hfResult, gptResult] = await Promise.allSettled([
    HF_TOKEN
      ? hf.imageClassification({ model: HAIR_TYPE_HF_MODEL, data: imageBlob as any })
      : Promise.reject('no HF token'),
    getOpenAIClient().chat.completions.create({
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
  const VALID_STYLES = ['AFRO', 'WASH_N_GO', 'TWA', 'BOX_BRAIDS', 'BRAIDS', 'CORNROWS', 'LOCS', 'FAUX_LOCS', 'TWISTS', 'TWIST_OUT', 'FLAT_TWIST', 'BANTU_KNOTS', 'STRAIGHT', 'WEAVE', 'WIG', 'PROTECTIVE', 'OTHER'];
  if (!VALID_STYLES.includes(currentStyle)) currentStyle = 'AFRO';

  // Locs/faux-locs: elasticity and shrinkage are physically unmeasurable from a photo.
  // The hair is permanently locked — strand mechanics and recoil can't be assessed visually.
  const isLocs = currentStyle === 'LOCS' || currentStyle === 'FAUX_LOCS';

  const recommendations = isLocs
    ? LOCS_HAIR_RECS
    : (Array.isArray(gpt.recommendations) && gpt.recommendations.length > 0
        ? gpt.recommendations.slice(0, 6)
        : DEFAULT_HAIR_RECS);

  return {
    hairType,
    porosity: gpt.porosity || 'HIGH',
    density: gpt.density || 'MEDIUM',
    thickness: gpt.thickness || 'MEDIUM',
    dryness: Number(gpt.dryness) || 55,
    elasticity: null, // Physically unmeasurable from a photo — requires wet strand stretch test
    shrinkage: isLocs ? null : calibrateShrinkage(Number(gpt.shrinkage) || undefined, hairType),
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
      locsDetected: isLocs,
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

const LOCS_HAIR_RECS = [
  '💧 Hydrater tes locs avec un spray eau + aloe vera 3-4x/semaine — les locs ont soif',
  '🌿 Nourrir les pointes avec un loc butter ou beurre de karité pur (sans cire ni petroleum)',
  '🌙 Protéger tes locs la nuit avec un bonnet en satin ou taie d\'oreiller en soie',
  '🧴 Deep conditioning mensuel : applique sur locs humides, bonnet chauffant 30 min, rincer',
  '✂️ Retwist avec une loc specialist tous les 4-6 semaines pour garder les locs nettes',
  '🚿 Laver avec un shampoing résidu-free spécial locs — sans cire, silicone ni parabène',
];
