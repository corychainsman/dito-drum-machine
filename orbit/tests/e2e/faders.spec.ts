import { test, expect } from '@playwright/test';

// Stub - fader drag tests implemented in Phase 5
test.describe('Faders', () => {
  test('fader tray is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="fader-tray"]')).toBeVisible();
  });
});
