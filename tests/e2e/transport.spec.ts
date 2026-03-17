import { test, expect } from '@playwright/test';

test.describe('Transport', () => {
  test('play button is centered and toggles playback', async ({ page }) => {
    await page.goto('/');
    const playStop = page.locator('[data-testid="center-control"]');


    const svg = page.locator('[data-testid="sequencer-svg"]');
    const svgBox = await svg.boundingBox();
    const controlBox = await playStop.boundingBox();

    expect(svgBox).not.toBeNull();
    expect(controlBox).not.toBeNull();

    const svgCenterX = svgBox!.x + svgBox!.width / 2;
    const svgCenterY = svgBox!.y + svgBox!.height / 2;
    const controlCenterX = controlBox!.x + controlBox!.width / 2;
    const controlCenterY = controlBox!.y + controlBox!.height / 2;

    expect(Math.abs(controlCenterX - svgCenterX)).toBeLessThanOrEqual(1);
    expect(Math.abs(controlCenterY - svgCenterY)).toBeLessThanOrEqual(1);

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
