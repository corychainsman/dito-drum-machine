import { test, expect } from '@playwright/test';

test.describe('Responsive Layout', () => {
  test('phone layout: sequencer visible at 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const svg = page.locator('[data-testid="sequencer-svg"]');
    await expect(svg).toBeVisible();
    const box = await svg.boundingBox();
    expect(box!.width).toBeGreaterThan(280);
    expect(box!.width).toBeLessThan(375);
  });

  test('tablet layout: sequencer and faders side by side at 1024x768', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    const svg = page.locator('[data-testid="sequencer-svg"]');
    const faderTray = page.locator('[data-testid="fader-tray"]');
    await expect(svg).toBeVisible();
    await expect(faderTray).toBeVisible();
  });
});
