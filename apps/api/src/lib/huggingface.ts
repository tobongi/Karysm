import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';
const hf = new HfInference(HF_TOKEN);

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
  const startTime = Date.now();

  // Fetch image and get average skin color
  const imageResponse = await fetch(imageUrl);
  const imageBlob = new Blob([await imageResponse.arrayBuffer()]);

  let hfResult: any = null;
  let skinConditions = { hydration: 65, sebum: 40, pores: 35, wrinkles: 20, spots: 30, acne: 15, hyperpigmentation: 25, uniformity: 70 };

  // Try HuggingFace for skin type classification
  if (HF_TOKEN) {
    try {
      // Skin type classification
      const classificationResult = await hf.imageClassification({
        model: 'dima806/skin_types_image_detection',
        data: imageBlob as any,
      });
      hfResult = classificationResult;

      // Map HF skin type results to conditions
      if (Array.isArray(classificationResult)) {
        for (const result of classificationResult) {
          const label = result.label?.toLowerCase() || '';
          const score = result.score || 0;
          if (label.includes('oily')) skinConditions.sebum = Math.round(score * 100);
          if (label.includes('dry')) skinConditions.hydration = Math.round((1 - score) * 100);
          if (label.includes('acne') || label.includes('pimple')) skinConditions.acne = Math.round(score * 100);
          if (label.includes('normal')) {
            skinConditions.hydration = Math.max(skinConditions.hydration, 70);
            skinConditions.uniformity = Math.max(skinConditions.uniformity, 75);
          }
        }
      }
    } catch (err) {
      console.error('HuggingFace skin classification error:', err);
    }
  }

  // Compute LAB from average face color
  // For MVP: use a representative skin tone based on image analysis
  // In production: extract actual pixel data from face region
  const avgR = 140, avgG = 100, avgB = 75; // Placeholder — will be replaced by actual pixel analysis
  const lab = rgbToLab(avgR, avgG, avgB);
  const ita = computeITA(lab.L, lab.b);
  const monkTone = classifyMonkTone(lab.L);
  const undertone = classifyUndertone(lab.a, lab.b);
  const melanin = computeMelaninIndex(ita);

  // Calculate overall score
  const overallScore = Math.round(
    (skinConditions.hydration * 0.2 +
     (100 - skinConditions.sebum) * 0.1 +
     (100 - skinConditions.pores) * 0.1 +
     (100 - skinConditions.wrinkles) * 0.1 +
     (100 - skinConditions.spots) * 0.1 +
     (100 - skinConditions.acne) * 0.15 +
     (100 - skinConditions.hyperpigmentation) * 0.1 +
     skinConditions.uniformity * 0.15)
  );

  const recommendations = generateRecommendations({
    monkTone,
    hydration: skinConditions.hydration,
    sebum: skinConditions.sebum,
    acne: skinConditions.acne,
    hyperpigmentation: skinConditions.hyperpigmentation,
    spots: skinConditions.spots,
    uniformity: skinConditions.uniformity,
  });

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
    rawResponse: hfResult,
  };
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
  const imageResponse = await fetch(imageUrl);
  const imageBlob = new Blob([await imageResponse.arrayBuffer()]);

  let hfResult: any = null;

  // Try HuggingFace for hair classification
  if (HF_TOKEN) {
    try {
      const result = await hf.imageClassification({
        model: 'google/vit-base-patch16-224',
        data: imageBlob as any,
      });
      hfResult = result;
    } catch (err) {
      console.error('HuggingFace hair classification error:', err);
    }
  }

  // MVP: baseline analysis with reasonable defaults for afro hair
  // Will be improved with custom model trained on proprietary dataset
  const analysis: HairAnalysisResult = {
    hairType: '4B', // Default for African hair — to be refined by ML
    porosity: 'HIGH',
    density: 'MEDIUM',
    thickness: 'MEDIUM',
    dryness: 55,
    elasticity: 60,
    shrinkage: 70,
    scalpCondition: 'HEALTHY',
    currentStyle: 'AFRO',
    overallScore: 68,
    recommendations: [
      '💧 Hydrater avec la méthode LOC (Liquid, Oil, Cream)',
      '🧴 Deep conditioning hebdomadaire au beurre de karité',
      '🌙 Protéger les cheveux la nuit avec un bonnet en satin',
      '✂️ Couper les pointes sèches tous les 3 mois',
      '🚿 Co-wash entre les shampoings pour préserver l\'hydratation',
      '🌿 Éviter les produits contenant des sulfates et silicones',
    ],
    rawResponse: hfResult,
  };

  return analysis;
}
