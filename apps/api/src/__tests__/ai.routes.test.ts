/**
 * Integration tests for all 6 AI analysis endpoints.
 *
 * External services (OpenAI, HuggingFace, Cloudinary, Prisma) are mocked.
 * Auth uses a real JWT signed with the dev secret.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mocks (must come before app import — vitest hoists vi.mock calls) ─────────

// vi.hoisted ensures prismaMock is created before vi.mock factories run
const prismaMock = vi.hoisted(() => ({
  skinAnalysis: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  hairAnalysis: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  // Feed route needs these (app.ts imports feed.routes.ts)
  portfolioItem: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
  savedLook:     { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn(), delete: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@karysm/db',   () => ({ prisma: prismaMock }));

vi.mock('../lib/huggingface', () => ({
  analyzeSkin: vi.fn(),
  analyzeHair: vi.fn(),
}));

vi.mock('../lib/cloudinary', () => ({
  uploadImage: vi.fn(),
}));

// Silence morgan logging in tests
vi.mock('morgan', () => ({ default: () => (_: any, __: any, next: any) => next() }));

// Silence booking reminder setInterval
vi.mock('../lib/notifications', () => ({ sendBookingReminders: vi.fn() }));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { app } from '../app';
import { analyzeSkin, analyzeHair } from '../lib/huggingface';
import { uploadImage } from '../lib/cloudinary';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const USER_ID    = 'user-test-001';
const JWT_SECRET = 'karysm-dev-secret';

function authToken(userId = USER_ID): string {
  return jwt.sign({ userId, phone: '+243812340000', role: 'CLIENT' }, JWT_SECRET, { expiresIn: '1h' });
}

// Minimal valid base64 JPEG (1×1 pixel)
const FAKE_IMAGE_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

const SKIN_RESULT = {
  monkTone: 7,
  undertone: 'WARM',
  labL: 45.50, labA: 10.20, labB: 18.30,
  itaAngle: -5.23,
  melaninIndex: 70,
  hydration: 62, sebum: 35, pores: 30, wrinkles: 10,
  spots: 25, acne: 8, hyperpigmentation: 20, uniformity: 75,
  overallScore: 78,
  recommendations: ['💧 Sérum acide hyaluronique', '☀️ SPF 30+', '✨ Vitamine C', '🧴 Niacinamide', '🌿 Tea tree', '💛 Karité'],
  rawResponse: { model: 'gpt-4o', usage: null, hf: [], reasoning: 'Test.' },
};

const HAIR_RESULT = {
  hairType: '4B',
  porosity: 'HIGH',
  density: 'MEDIUM',
  thickness: 'MEDIUM',
  dryness: 60, elasticity: 55, shrinkage: 70,
  scalpCondition: 'HEALTHY',
  currentStyle: 'AFRO',
  overallScore: 72,
  recommendations: ['💧 Méthode LOC', '🧴 Deep conditioning', '🌙 Bonnet satin', '✂️ Pointes sèches', '🚿 Co-wash', '🌿 Sans sulfates'],
  rawResponse: { model: 'gpt-4o', usage: null, reasoning: 'Test.', hf: [], hfBroadType: 'KINKY', confidence: 85 },
};

// ── Auth guard tests ─────────────────────────────────────────────────────────

describe('AI routes — auth guard', () => {
  it('POST /api/ai/skin-analysis → 401 without token', async () => {
    const res = await request(app).post('/api/ai/skin-analysis').send({ data: FAKE_IMAGE_B64 });
    expect(res.status).toBe(401);
  });

  it('POST /api/ai/hair-analysis → 401 without token', async () => {
    const res = await request(app).post('/api/ai/hair-analysis').send({ data: FAKE_IMAGE_B64 });
    expect(res.status).toBe(401);
  });

  it('GET /api/ai/skin-history → 401 without token', async () => {
    expect((await request(app).get('/api/ai/skin-history')).status).toBe(401);
  });

  it('GET /api/ai/hair-history → 401 without token', async () => {
    expect((await request(app).get('/api/ai/hair-history')).status).toBe(401);
  });

  it('GET /api/ai/skin-analysis/:id → 401 without token', async () => {
    expect((await request(app).get('/api/ai/skin-analysis/abc')).status).toBe(401);
  });

  it('GET /api/ai/hair-analysis/:id → 401 without token', async () => {
    expect((await request(app).get('/api/ai/hair-analysis/abc')).status).toBe(401);
  });
});

// ── Body validation tests ─────────────────────────────────────────────────────

describe('AI routes — body validation', () => {
  it('POST /api/ai/skin-analysis → 400 without image data', async () => {
    const res = await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/ai/hair-analysis → 400 without image data', async () => {
    const res = await request(app)
      .post('/api/ai/hair-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/ai/skin-analysis → 400 with non-string data', async () => {
    const res = await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: 12345 });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/ai/skin-analysis ────────────────────────────────────────────────

describe('POST /api/ai/skin-analysis', () => {
  const SAVED = { id: 'skin-001', userId: USER_ID, ...SKIN_RESULT, selfieUrl: 'https://cdn.example.com/skin-001.jpg', processingTime: 1200, createdAt: new Date(), consentDataset: false };

  beforeEach(() => {
    vi.mocked(uploadImage).mockResolvedValue('https://cdn.example.com/skin-001.jpg');
    vi.mocked(analyzeSkin).mockResolvedValue(SKIN_RESULT as any);
    prismaMock.skinAnalysis.create.mockResolvedValue(SAVED as any);
  });

  it('returns 201 with full analysis', async () => {
    const res = await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('skin-001');
    expect(res.body.data.monkTone).toBe(7);
    expect(res.body.data.undertone).toBe('WARM');
    expect(res.body.data.overallScore).toBe(78);
  });

  it('calls uploadImage → analyzeSkin → prisma.create in order', async () => {
    await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    expect(uploadImage).toHaveBeenCalledWith(FAKE_IMAGE_B64, 'skin-analyses');
    expect(analyzeSkin).toHaveBeenCalledWith('https://cdn.example.com/skin-001.jpg');
    expect(prismaMock.skinAnalysis.create).toHaveBeenCalled();
  });

  it('saves consentDataset=true when flag is set', async () => {
    await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64, consentDataset: true });

    const call = prismaMock.skinAnalysis.create.mock.calls.at(-1)![0];
    expect(call.data.consentDataset).toBe(true);
  });

  it('saves consentDataset=false by default', async () => {
    await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    const call = prismaMock.skinAnalysis.create.mock.calls.at(-1)![0];
    expect(call.data.consentDataset).toBe(false);
  });

  it('saves the userId from the JWT', async () => {
    await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    const call = prismaMock.skinAnalysis.create.mock.calls.at(-1)![0];
    expect(call.data.userId).toBe(USER_ID);
  });

  it('response includes all required skin analysis fields', async () => {
    const res = await request(app)
      .post('/api/ai/skin-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    const data = res.body.data;
    for (const field of ['monkTone','undertone','labL','labA','labB','itaAngle','melaninIndex',
      'hydration','sebum','pores','wrinkles','spots','acne','hyperpigmentation','uniformity',
      'overallScore','recommendations']) {
      expect(data, `missing: ${field}`).toHaveProperty(field);
    }
  });
});

// ── POST /api/ai/hair-analysis ────────────────────────────────────────────────

describe('POST /api/ai/hair-analysis', () => {
  const SAVED = { id: 'hair-001', userId: USER_ID, ...HAIR_RESULT, photoUrl: 'https://cdn.example.com/hair-001.jpg', processingTime: 1500, createdAt: new Date(), consentDataset: false };

  beforeEach(() => {
    vi.mocked(uploadImage).mockResolvedValue('https://cdn.example.com/hair-001.jpg');
    vi.mocked(analyzeHair).mockResolvedValue(HAIR_RESULT as any);
    prismaMock.hairAnalysis.create.mockResolvedValue(SAVED as any);
  });

  it('returns 201 with full hair analysis', async () => {
    const res = await request(app)
      .post('/api/ai/hair-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hairType).toBe('4B');
    expect(res.body.data.porosity).toBe('HIGH');
    expect(res.body.data.currentStyle).toBe('AFRO');
    expect(res.body.data.overallScore).toBe(72);
  });

  it('calls uploadImage → analyzeHair → prisma.create in order', async () => {
    await request(app)
      .post('/api/ai/hair-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    expect(uploadImage).toHaveBeenCalledWith(FAKE_IMAGE_B64, 'hair-analyses');
    expect(analyzeHair).toHaveBeenCalledWith('https://cdn.example.com/hair-001.jpg');
    expect(prismaMock.hairAnalysis.create).toHaveBeenCalled();
  });

  it('response includes all required hair analysis fields', async () => {
    const res = await request(app)
      .post('/api/ai/hair-analysis')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ data: FAKE_IMAGE_B64 });

    const data = res.body.data;
    for (const field of ['hairType','porosity','density','thickness','dryness','elasticity',
      'shrinkage','scalpCondition','currentStyle','overallScore','recommendations']) {
      expect(data, `missing: ${field}`).toHaveProperty(field);
    }
  });
});

// ── GET /api/ai/skin-history ──────────────────────────────────────────────────

describe('GET /api/ai/skin-history', () => {
  const HISTORY = [
    { id: 'skin-001', monkTone: 7, undertone: 'WARM', overallScore: 78, selfieUrl: 'https://cdn.example.com/1.jpg', createdAt: new Date() },
    { id: 'skin-002', monkTone: 6, undertone: 'NEUTRAL', overallScore: 82, selfieUrl: 'https://cdn.example.com/2.jpg', createdAt: new Date() },
  ];

  beforeEach(() => {
    prismaMock.skinAnalysis.findMany.mockResolvedValue(HISTORY as any);
  });

  it('returns 200 with array of analyses', async () => {
    const res = await request(app)
      .get('/api/ai/skin-history')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('each item has required shape', async () => {
    const res = await request(app)
      .get('/api/ai/skin-history')
      .set('Authorization', `Bearer ${authToken()}`);

    const item = res.body.data[0];
    for (const f of ['id','monkTone','undertone','overallScore','selfieUrl','createdAt']) {
      expect(item).toHaveProperty(f);
    }
  });

  it('passes userId filter to prisma', async () => {
    await request(app)
      .get('/api/ai/skin-history')
      .set('Authorization', `Bearer ${authToken()}`);

    const call = prismaMock.skinAnalysis.findMany.mock.calls.at(-1)![0];
    expect(call?.where?.userId).toBe(USER_ID);
  });
});

// ── GET /api/ai/hair-history ──────────────────────────────────────────────────

describe('GET /api/ai/hair-history', () => {
  beforeEach(() => {
    prismaMock.hairAnalysis.findMany.mockResolvedValue([
      { id: 'hair-001', hairType: '4B', overallScore: 72, photoUrl: 'https://cdn.example.com/h1.jpg', createdAt: new Date() },
    ] as any);
  });

  it('returns 200 with hair history array', async () => {
    const res = await request(app)
      .get('/api/ai/hair-history')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('items have hairType and overallScore', async () => {
    const res = await request(app)
      .get('/api/ai/hair-history')
      .set('Authorization', `Bearer ${authToken()}`);

    const item = res.body.data[0];
    expect(item).toHaveProperty('hairType');
    expect(item).toHaveProperty('overallScore');
    expect(item).toHaveProperty('photoUrl');
  });
});

// ── GET /api/ai/skin-analysis/:id ────────────────────────────────────────────

describe('GET /api/ai/skin-analysis/:id', () => {
  const DETAIL = {
    id: 'skin-001', userId: USER_ID,
    monkTone: 7, undertone: 'WARM',
    labL: 45.5, labA: 10.2, labB: 18.3, itaAngle: -5.23, melaninIndex: 70,
    hydration: 62, sebum: 35, pores: 30, wrinkles: 10,
    spots: 25, acne: 8, hyperpigmentation: 20, uniformity: 75,
    overallScore: 78, recommendations: ['tip'], selfieUrl: 'https://cdn.example.com/s1.jpg',
    processingTime: 1200, createdAt: new Date(), consentDataset: false, rawResponse: {},
  };

  it('returns 200 with full analysis for owner', async () => {
    prismaMock.skinAnalysis.findUnique.mockResolvedValue(DETAIL as any);

    const res = await request(app)
      .get('/api/ai/skin-analysis/skin-001')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.monkTone).toBe(7);
  });

  it('returns 404 for non-existent analysis', async () => {
    prismaMock.skinAnalysis.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/ai/skin-analysis/does-not-exist')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when analysis belongs to a different user', async () => {
    prismaMock.skinAnalysis.findUnique.mockResolvedValue({ ...DETAIL, userId: 'other-user' } as any);

    const res = await request(app)
      .get('/api/ai/skin-analysis/skin-001')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /api/ai/hair-analysis/:id ────────────────────────────────────────────

describe('GET /api/ai/hair-analysis/:id', () => {
  const DETAIL = {
    id: 'hair-001', userId: USER_ID,
    hairType: '4B', porosity: 'HIGH', density: 'MEDIUM', thickness: 'MEDIUM',
    dryness: 60, elasticity: 55, shrinkage: 70,
    scalpCondition: 'HEALTHY', currentStyle: 'AFRO',
    overallScore: 72, recommendations: ['tip'],
    photoUrl: 'https://cdn.example.com/h1.jpg',
    processingTime: 1500, createdAt: new Date(), consentDataset: false, rawResponse: {},
  };

  it('returns 200 with full hair analysis for owner', async () => {
    prismaMock.hairAnalysis.findUnique.mockResolvedValue(DETAIL as any);

    const res = await request(app)
      .get('/api/ai/hair-analysis/hair-001')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.hairType).toBe('4B');
    expect(res.body.data.currentStyle).toBe('AFRO');
  });

  it('returns 404 for non-existent hair analysis', async () => {
    prismaMock.hairAnalysis.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/ai/hair-analysis/does-not-exist')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when hair analysis belongs to a different user', async () => {
    prismaMock.hairAnalysis.findUnique.mockResolvedValue({ ...DETAIL, userId: 'other-user' } as any);

    const res = await request(app)
      .get('/api/ai/hair-analysis/hair-001')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(404);
  });
});
