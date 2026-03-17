import { test, expect } from '@playwright/test';

test.describe('Pad Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders exactly 40 pad elements', async ({ page }) => {
    const pads = page.locator('[data-testid^="pad-"]');
    await expect(pads).toHaveCount(40);
  });

  test('each pad has correct data attributes', async ({ page }) => {
    // Check pad-0-0 through pad-4-7 exist
    for (let ring = 0; ring < 5; ring++) {
      for (let step = 0; step < 8; step++) {
        await expect(page.locator(`[data-testid="pad-${ring}-${step}"]`)).toBeVisible();
      }
    }
  });

  test('clicking a pad toggles its armed state', async ({ page }) => {
    const pad = page.locator('[data-testid="pad-3-0"]'); // clap ring, step 0 (starts off)
    const initialFill = await pad.getAttribute('fill');
    await pad.click();
    const newFill = await pad.getAttribute('fill');
    expect(newFill).not.toBe(initialFill);
  });

  test('clicking a pad updates the URL', async ({ page }) => {
    // First click to initialize audio context
    await page.locator('[data-testid="pad-0-0"]').click();
    await page.waitForTimeout(100);

    const urlBefore = new URL(page.url());
    const pBefore = urlBefore.searchParams.get('p');

    // Toggle clap ring step 0 (should be off by default)
    await page.locator('[data-testid="pad-3-0"]').click();
    await page.waitForTimeout(100);

    const urlAfter = new URL(page.url());
    const pAfter = urlAfter.searchParams.get('p');

    expect(pAfter).not.toBe(pBefore);
  });
});
