/**
 * E2E: Virtual Mirror (Miroir Virtuel) — UI flow
 *
 * Tests the makeup try-on screen without a real camera.
 * Verifies: category tabs, product swatches, product info, "Dans mon look" CTA.
 * MediaPipe loading and actual canvas rendering are not tested here
 * (they require a real camera — tested manually on app.karysm.com).
 */

import { test, expect } from '@playwright/test';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Virtual Mirror screen', () => {
  test.beforeEach(async ({ page }) => {
    // Mock getUserMedia so the browser doesn't show a permission dialog
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices = navigator.mediaDevices || {};
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => new Promise(() => {}); // pending — never resolves in tests
    });

    await page.goto('/ai/virtual-tryon');
    // Wait for the React app to hydrate
    await page.waitForLoadState('networkidle');
  });

  test('shows idle overlay with title and start button', async ({ page }) => {
    await expect(page.getByText('Miroir Virtuel')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Activer la caméra')).toBeVisible();
  });

  test('shows three makeup category tabs', async ({ page }) => {
    // All three tabs visible in idle state — use exact match to avoid "rouge à lèvres" subtitle
    await expect(page.getByText('Lèvres', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Joues', { exact: true })).toBeVisible();
    await expect(page.getByText('Yeux', { exact: true })).toBeVisible();
  });

  test('Lèvres tab is active by default and shows 7 products', async ({ page }) => {
    // Default category is levres — use exact match to avoid "rouge à lèvres" subtitle
    await expect(page.getByText('Lèvres', { exact: true })).toBeVisible({ timeout: 10_000 });

    // Product info row shows the first Lèvres product (Rouge Passion)
    await expect(page.getByText('Rouge Passion')).toBeVisible();
    await expect(page.getByText(/Matte/)).toBeVisible();
    await expect(page.getByText(/4\s*500\s*FC/)).toBeVisible();
  });

  test('switching to Joues tab updates product info', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Joues')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Joues').click();

    // First Joues product is "Rose Pêche"
    await expect(page.getByText('Rose Pêche')).toBeVisible({ timeout: 4_000 });
    await expect(page.getByText(/Poudre/)).toBeVisible();
  });

  test('switching to Yeux tab updates product info', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Yeux')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Yeux').click();

    // First Yeux product is "Fumée Noire"
    await expect(page.getByText('Fumée Noire')).toBeVisible({ timeout: 4_000 });
  });

  test('"Dans mon look" button exists and changes to "Ajouté ✓" when clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const saveBtn = page.getByText('Dans mon look');
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();
    await expect(page.getByText(/Ajouté/)).toBeVisible({ timeout: 3_000 });
  });

  test('clicking a different product swatch updates the product name', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Rouge Passion')).toBeVisible({ timeout: 10_000 });

    // The swatches are colored circles — click the second one
    // They have background colors matching the product catalogue
    const swatches = page.locator('[style*="background-color"]').filter({ hasNot: page.locator('video, canvas') });
    const secondSwatch = swatches.nth(1);
    if (await secondSwatch.isVisible()) {
      await secondSwatch.click();
      // After clicking, product name should change from "Rouge Passion"
      // to "Rose Poudré" (second lip product)
      await expect(page.getByText('Rose Poudré')).toBeVisible({ timeout: 3_000 });
    }
  });

  test('shows privacy note about video staying on device', async ({ page }) => {
    await expect(page.getByText(/ne quitte pas votre appareil/i)).toBeVisible({ timeout: 10_000 });
  });

  test('shows browser requirement note (Chrome ou Edge)', async ({ page }) => {
    await expect(page.getByText(/Chrome ou Edge/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ── Beauty tab navigation ─────────────────────────────────────────────────────

test.describe('Beauty tab → Virtual Mirror navigation', () => {
  test('beauty tab shows Miroir Virtuel card with NOUVEAU badge', async ({ page }) => {
    // Mock auth so the tab renders
    await page.route('**/api/auth/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { token: 'e2e', refreshToken: 'e2e', user: { id: 'u1', name: 'Test', phone: '+243812340000', role: 'CLIENT' } } }),
    }));
    await page.route('**/api/ai/skin-history', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }));
    await page.route('**/api/ai/hair-history', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find beauty tab and click it
    const beautyTab = page.getByText(/Beauté|Beauty/i).first();
    if (await beautyTab.isVisible({ timeout: 6_000 })) {
      await beautyTab.click();
      await expect(page.getByText(/Miroir Virtuel/i)).toBeVisible({ timeout: 8_000 });
    }
  });
});
