import { test, expect } from '@playwright/test';

test.describe('Transport', () => {
  test('play button starts playback, stop button stops it', async ({ page }) => {
    await page.goto('/');
    const playStop = page.locator('[data-testid="center-control"]');

    // Initially shows play icon
    await expect(page.locator('[data-testid="play-icon"]')).toBeVisible();

    // Click to play
    await playStop.click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="stop-icon"]')).toBeVisible();

    // Click to stop
    await playStop.click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="play-icon"]')).toBeVisible();
  });
});
