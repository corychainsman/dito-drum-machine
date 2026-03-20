import { test, expect } from '@playwright/test';

const NUM_RINGS = 4;
const NUM_STEPS = 8;

test.describe('URL State', () => {
  test('loads with default pattern when no URL params', async ({ page }) => {
    await page.goto('/');
    // Kick step 0 should be armed (default pattern)
    const pad = page.locator('[data-testid="pad-0-0"]');
    // Check it has the "armed" visual state (ring color, not gray)
    const fill = await pad.getAttribute('fill');
    expect(fill).not.toBe('#3A3A3A');
  });

  test('hydrates state from URL params', async ({ page }) => {
    // All pads on, all faders max, tempo 180
    await page.goto('/?p=ffffffff&f=ffff&t=180');
    // Every pad should be armed
    for (let ring = 0; ring < NUM_RINGS; ring++) {
      for (let step = 0; step < NUM_STEPS; step++) {
        const fill = await page.locator(`[data-testid="pad-${ring}-${step}"]`).getAttribute('fill');
        expect(fill).not.toBe('#3A3A3A');
      }
    }
  });

  test('survives URL round-trip: toggle pad → reload → same state', async ({ page }) => {
    await page.goto('/');
    // Toggle clap step 3 (starts off)
    await page.locator('[data-testid="pad-3-3"]').click();
    await page.waitForTimeout(100);

    const url = page.url();

    // Reload with same URL
    await page.goto(url);
    await page.waitForTimeout(100);

    // Clap step 3 should still be armed
    const fill = await page.locator('[data-testid="pad-3-3"]').getAttribute('fill');
    expect(fill).not.toBe('#3A3A3A');
  });

  test('rejects invalid URL params and falls back to defaults', async ({ page }) => {
    await page.goto('/?p=ZZZZ&f=bad&t=999');
    // Should load default pattern — kick step 0 armed
    const fill = await page.locator('[data-testid="pad-0-0"]').getAttribute('fill');
    expect(fill).not.toBe('#3A3A3A');
  });
});
