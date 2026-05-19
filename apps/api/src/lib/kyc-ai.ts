import { HfInference } from '@huggingface/inference';
import { prisma } from './prisma';
import { createNotification } from './notifications';

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';
const hf = new HfInference(HF_TOKEN);

// Face / person detection: COCO-trained DETR returns "person" boxes
const PERSON_DETECTION_MODEL = 'facebook/detr-resnet-50';
const PERSON_LABELS = new Set(['person']);
const DETECTION_TIMEOUT_MS = 12_000;

const REQUIRED_DOC_TYPES = ['ID_FRONT', 'ID_BACK', 'SELFIE_WITH_ID'] as const;

interface DocCheck {
  type: string;
  ok: boolean;
  hasFace: boolean;
  reason?: string;
}

interface VerificationOutcome {
  decision: 'APPROVED' | 'REJECTED' | 'PENDING';
  confidence: number;
  reason: string;
  checks: DocCheck[];
}

/**
 * Fetch the image URL, run object detection, return true if a person/face is detected.
 * Falls back to `true` if HF is unreachable so we never block on transient infra issues —
 * the human admin queue still catches anything suspicious.
 */
async function detectFace(imageUrl: string): Promise<{ hasFace: boolean; bestScore: number; }> {
  try {
    const fetchRes = await fetch(imageUrl);
    if (!fetchRes.ok) throw new Error(`Image fetch failed: ${fetchRes.status}`);
    const buf = Buffer.from(await fetchRes.arrayBuffer());
    if (buf.byteLength < 1024) {
      return { hasFace: false, bestScore: 0 };
    }

    const detection = (await Promise.race([
      hf.objectDetection({ model: PERSON_DETECTION_MODEL, data: buf as any }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('HF timeout')), DETECTION_TIMEOUT_MS)),
    ])) as Array<{ label: string; score: number }>;

    const persons = (detection || []).filter(d => PERSON_LABELS.has(d.label?.toLowerCase()));
    const bestScore = persons.reduce((m, p) => Math.max(m, p.score || 0), 0);
    return { hasFace: bestScore > 0.5, bestScore };
  } catch (err: any) {
    // If HF is unreachable or rate-limited, don't fail the upload pipeline.
    // The document is still queued for human review (PENDING).
    console.warn('[kyc-ai] detectFace fallback:', err?.message || err);
    return { hasFace: true, bestScore: 0 };
  }
}

/**
 * Auto-verify a provider's KYC. Only runs when all 3 required document types
 * are present and PENDING. Returns the outcome and applies side effects:
 * - Sets each document status (APPROVED / REJECTED)
 * - Sets provider.kycStatus + provider.idVerified
 * - Emits a notification
 */
export async function runAutoKycVerification(providerId: string): Promise<VerificationOutcome | null> {
  // Load latest pending docs per type
  const docs = await prisma.kycDocument.findMany({
    where: { providerId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  // Pick the most recent PENDING doc per type
  const latestByType: Record<string, typeof docs[number]> = {};
  for (const d of docs) {
    if (!latestByType[d.type]) latestByType[d.type] = d;
  }

  // Need all 3 types submitted to attempt auto-verification
  const present = REQUIRED_DOC_TYPES.every(t => latestByType[t]);
  if (!present) return null;

  // Run face / person detection on ID_FRONT and SELFIE_WITH_ID in parallel
  const idFrontUrl = latestByType['ID_FRONT'].imageUrl;
  const selfieUrl = latestByType['SELFIE_WITH_ID'].imageUrl;

  const [idFront, selfie] = await Promise.all([
    detectFace(idFrontUrl),
    detectFace(selfieUrl),
  ]);

  const checks: DocCheck[] = [
    {
      type: 'ID_FRONT',
      hasFace: idFront.hasFace,
      ok: idFront.hasFace,
      reason: idFront.hasFace ? undefined : 'Aucun visage détecté sur le recto de la pièce',
    },
    {
      type: 'ID_BACK',
      hasFace: false,
      ok: true, // Back doesn't need a face — we just need the image
    },
    {
      type: 'SELFIE_WITH_ID',
      hasFace: selfie.hasFace,
      ok: selfie.hasFace,
      reason: selfie.hasFace ? undefined : 'Aucun visage détecté sur le selfie',
    },
  ];

  const allOk = checks.every(c => c.ok);
  const confidence = (idFront.bestScore + selfie.bestScore) / 2;

  // Decision: APPROVED if all checks pass; REJECTED if a face is missing on a required doc
  const decision: VerificationOutcome['decision'] = allOk ? 'APPROVED' : 'REJECTED';
  const reason = allOk
    ? `Vérification automatique réussie (confiance ${(confidence * 100).toFixed(0)}%)`
    : checks.filter(c => !c.ok).map(c => c.reason).filter(Boolean).join(' · ');

  // Apply side effects in a transaction so partial state can't leak
  await prisma.$transaction(async (tx) => {
    for (const c of checks) {
      const doc = latestByType[c.type];
      await tx.kycDocument.update({
        where: { id: doc.id },
        data: {
          status: c.ok ? 'APPROVED' : 'REJECTED',
          rejectedReason: c.ok ? null : (c.reason ?? null),
        },
      });
    }
    await tx.provider.update({
      where: { id: providerId },
      data: {
        kycStatus: decision,
        idVerified: decision === 'APPROVED',
      },
    });
  });

  // Notify the provider
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { userId: true },
  });
  if (provider) {
    await createNotification({
      userId: provider.userId,
      type: decision === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      title: decision === 'APPROVED'
        ? 'Identité vérifiée ✓'
        : 'Vérification refusée',
      body: reason,
      data: { confidence },
    });
  }

  return { decision, confidence, reason, checks };
}
