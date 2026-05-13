/**
 * Unit tests for huggingface.ts pure math functions.
 * These functions have no external dependencies — test them directly.
 *
 * We stub the SDK constructors so the module-level `new OpenAI()` and
 * `new HfInference()` calls don't throw during import.
 */

import { describe, it, expect, vi } from 'vitest';

// Stub SDK constructors before module import (vitest hoists vi.mock calls)
vi.mock('openai', () => ({ default: class OpenAI { constructor() {} } }));
vi.mock('@huggingface/inference', () => ({ HfInference: class HfInference { constructor() {} } }));

import { rgbToLab, computeITA, computeMelaninIndex, classifyMonkTone } from '../lib/huggingface';

// Official Monk Scale hex codes → RGB (Ellis et al. 2023, Google)
const MONK = [
  { tone: 1,  rgb: [246, 237, 228] as [number,number,number] },
  { tone: 2,  rgb: [243, 231, 219] as [number,number,number] },
  { tone: 3,  rgb: [247, 234, 208] as [number,number,number] },
  { tone: 4,  rgb: [234, 218, 186] as [number,number,number] },
  { tone: 5,  rgb: [215, 189, 150] as [number,number,number] },
  { tone: 6,  rgb: [160, 120, 80]  as [number,number,number] },
  { tone: 7,  rgb: [130, 92, 67]   as [number,number,number] },
  { tone: 8,  rgb: [96, 65, 52]    as [number,number,number] },
  { tone: 9,  rgb: [58, 49, 42]    as [number,number,number] },
  { tone: 10, rgb: [41, 36, 32]    as [number,number,number] },
];

// ── rgbToLab ─────────────────────────────────────────────────────────────────

describe('rgbToLab', () => {
  it('returns L*=100 for pure white', () => {
    const lab = rgbToLab(255, 255, 255);
    expect(lab.L).toBeCloseTo(100, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  it('returns L*=0 for pure black', () => {
    const lab = rgbToLab(0, 0, 0);
    expect(lab.L).toBeCloseTo(0, 0);
  });

  it('Monk tone 1 (very light) has L* > 90', () => {
    const lab = rgbToLab(...MONK[0].rgb);
    expect(lab.L).toBeGreaterThan(90);
  });

  it('Monk tone 10 (deepest) has L* < 25', () => {
    const lab = rgbToLab(...MONK[9].rgb);
    expect(lab.L).toBeLessThan(25);
  });

  it('L* decreases monotonically across Monk tones 5-10', () => {
    const labs = MONK.slice(4).map(m => rgbToLab(...m.rgb));
    for (let i = 1; i < labs.length; i++) {
      expect(labs[i].L).toBeLessThan(labs[i - 1].L);
    }
  });

  it('Monk tone 7 (#825c43) has warm undertone (positive b*)', () => {
    const lab = rgbToLab(130, 92, 67);
    expect(lab.b).toBeGreaterThan(0); // yellowish-warm
  });
});

// ── computeITA ───────────────────────────────────────────────────────────────

describe('computeITA', () => {
  it('returns angle in degrees (−90 to +90 range for skin)', () => {
    const ita = computeITA(50, 0);
    expect(ita).toBeCloseTo(0, 0); // L=50, b=0 → atan(0)=0°
  });

  it('very light skin (L=94, b=15) gives positive ITA (> 28° = light)', () => {
    const ita = computeITA(94, 15);
    expect(ita).toBeGreaterThan(28);
  });

  it('very dark skin (L=19, b=8) gives negative ITA (< −28° = very dark)', () => {
    const ita = computeITA(19, 8);
    expect(ita).toBeLessThan(-28);
  });

  it('Monk tone 1 produces positive ITA', () => {
    const lab = rgbToLab(...MONK[0].rgb);
    expect(computeITA(lab.L, lab.b)).toBeGreaterThan(0);
  });

  it('Monk tone 10 produces negative ITA', () => {
    const lab = rgbToLab(...MONK[9].rgb);
    expect(computeITA(lab.L, lab.b)).toBeLessThan(0);
  });
});

// ── computeMelaninIndex ───────────────────────────────────────────────────────

describe('computeMelaninIndex', () => {
  it('returns value in [0, 100]', () => {
    for (const ita of [-90, -50, -28, 0, 28, 55, 90]) {
      const m = computeMelaninIndex(ita);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(100);
    }
  });

  it('high ITA (very light) → low melanin index', () => {
    expect(computeMelaninIndex(55)).toBe(0);
  });

  it('very low ITA (very dark) → high melanin index', () => {
    expect(computeMelaninIndex(-90)).toBe(100);
  });

  it('melanin index increases as ITA decreases (darker = more melanin)', () => {
    const itas = [40, 20, 0, -20, -40];
    const melanins = itas.map(computeMelaninIndex);
    for (let i = 1; i < melanins.length; i++) {
      expect(melanins[i]).toBeGreaterThanOrEqual(melanins[i - 1]);
    }
  });

  it('Monk tone 1 melanin < Monk tone 10 melanin', () => {
    const lab1  = rgbToLab(...MONK[0].rgb);
    const lab10 = rgbToLab(...MONK[9].rgb);
    const m1  = computeMelaninIndex(computeITA(lab1.L, lab1.b));
    const m10 = computeMelaninIndex(computeITA(lab10.L, lab10.b));
    expect(m1).toBeLessThan(m10);
  });
});

// ── classifyMonkTone (LAB nearest-neighbor) ───────────────────────────────────

describe('classifyMonkTone', () => {
  it('each official Monk hex maps back to its own tone', () => {
    for (const m of MONK) {
      const lab = rgbToLab(...m.rgb);
      const classified = classifyMonkTone(lab.L, lab.a, lab.b);
      expect(classified, `Monk ${m.tone} should classify as ${m.tone}`).toBe(m.tone);
    }
  });

  it('pure white classifies as tone 1', () => {
    const lab = rgbToLab(255, 255, 255);
    expect(classifyMonkTone(lab.L, lab.a, lab.b)).toBe(1);
  });

  it('pure black classifies as tone 10', () => {
    const lab = rgbToLab(0, 0, 0);
    expect(classifyMonkTone(lab.L, lab.a, lab.b)).toBe(10);
  });

  it('Monk 7 neighbours (slightly lighter/darker) classify as 7 or adjacent', () => {
    // Slightly lighter than tone 7
    const labLight = rgbToLab(140, 100, 75);
    const toneLight = classifyMonkTone(labLight.L, labLight.a, labLight.b);
    expect([6, 7]).toContain(toneLight);

    // Slightly darker than tone 7
    const labDark = rgbToLab(110, 80, 58);
    const toneDark = classifyMonkTone(labDark.L, labDark.a, labDark.b);
    expect([7, 8]).toContain(toneDark);
  });
});
