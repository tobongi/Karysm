/**
 * E2E: Skin analysis — full user flow
 *
 * Requires the mobile web app running on localhost:8081.
 * API calls are intercepted so no real OpenAI key is needed.
 */

import { test, expect, Page } from '@playwright/test';

// ── Fixture data ──────────────────────────────────────────────────────────────

const SKIN_ANALYSIS = {
  id: 'e2e-skin-001',
  userId: 'e2e-user-001',
  monkTone: 7,
  undertone: 'WARM',
  labL: 45.5, labA: 10.2, labB: 18.3,
  itaAngle: -5.23,
  melaninIndex: 70,
  hydration: 62, sebum: 35, pores: 30, wrinkles: 10,
  spots: 25, acne: 8, hyperpigmentation: 20, uniformity: 75,
  overallScore: 78,
  recommendations: [
    '💧 Sérum acide hyaluronique quotidien',
    '☀️ Protection solaire SPF 30+ indispensable',
    '✨ Vitamine C pour uniformiser le teint',
    '🧴 Niacinamide contre les pores dilatés',
    '🌿 Tea tree ciblé sur les imperfections',
    '💛 Beurre de karité pour les zones sèches',
  ],
  selfieUrl: 'https://res.cloudinary.com/test/skin-001.jpg',
  processingTime: 1200,
  createdAt: new Date().toISOString(),
  consentDataset: false,
  rawResponse: { reasoning: 'Peau foncée, teint chaud, légère hyperpigmentation.' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function mockSkinAnalysisAPI(page: Page) {
  // POST skin-analysis → return fixture
  await page.route('**/api/ai/skin-analysis', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: SKIN_ANALYSIS }),
      });
    } else {
      await route.continue();
    }
  });

  // GET skin-analysis/:id → return fixture
  await page.route(`**/api/ai/skin-analysis/${SKIN_ANALYSIS.id}`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: SKIN_ANALYSIS }),
    });
  });

  // Auth OTP + verify (needed to log in during test)
  await page.route('**/api/auth/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        token: 'e2e-test-token',
        refreshToken: 'e2e-refresh-token',
        user: { id: 'e2e-user-001', name: 'Testeur', phone: '+243812340000', role: 'CLIENT' },
      },
    }),
  }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Skin analysis screen', () => {
  test('skin-capture page loads with all three tips', async ({ page }) => {
    await mockSkinAnalysisAPI(page);
    await page.goto('/ai/skin-capture');

    await expect(page.getByText('Analyse de peau').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Lumière naturelle').first()).toBeVisible();
    await expect(page.getByText('Regard caméra').first()).toBeVisible();
    await expect(page.getByText('Peau nue').first()).toBeVisible();
  });

  test('skin-capture has a photo button', async ({ page }) => {
    await mockSkinAnalysisAPI(page);
    await page.goto('/ai/skin-capture');

    await expect(page.getByText(/Prendre.*selfie|Photographier|Photo/i)).toBeVisible({ timeout: 8_000 });
  });

  test('skin-results page renders all Monk scale data', async ({ page }) => {
    await mockSkinAnalysisAPI(page);
    await page.goto(`/ai/skin-results/${SKIN_ANALYSIS.id}`);

    // Monk card title is "Carnation" (always visible, outside tabs)
    await expect(page.getByText('Carnation')).toBeVisible({ timeout: 10_000 });

    // Undertone shows "Chaud" for WARM
    await expect(page.getByText('Chaud')).toBeVisible();

    // Overall score
    await expect(page.getByText('78').first()).toBeVisible();
  });

  test('skin-results shows all 6 recommendations', async ({ page }) => {
    await mockSkinAnalysisAPI(page);
    await page.goto(`/ai/skin-results/${SKIN_ANALYSIS.id}`);

    // Recommendations are in the "Conseils" tab — click it first (exact to avoid "Conseils pour toi")
    await expect(page.getByText('Conseils', { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.getByText('Conseils', { exact: true }).click();

    await expect(page.getByText(/acide hyaluronique/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/SPF/i)).toBeVisible();
    await expect(page.getByText(/Vitamine C/i)).toBeVisible();
    await expect(page.getByText(/Niacinamide/i)).toBeVisible();
    await expect(page.getByText(/Tea tree/i)).toBeVisible();
    await expect(page.getByText(/karité/i)).toBeVisible();
  });

  test('skin-results shows skin metrics section', async ({ page }) => {
    await mockSkinAnalysisAPI(page);
    await page.goto(`/ai/skin-results/${SKIN_ANALYSIS.id}`);

    // At least some metrics should be visible
    const metricsText = page.getByText(/hydrat|sébum|pores|teint|acné/i).first();
    await expect(metricsText).toBeVisible({ timeout: 10_000 });
  });
});
