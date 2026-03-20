import { test, expect } from '@playwright/test';

const NUM_RINGS = 4;
const NUM_STEPS = 8;

test.describe('Random', () => {
  test('randomize changes the pattern', async ({ page }) => {
    await page.goto('/');
    // First interaction to init
    await page.locator('[data-testid="pad-0-0"]').click();
    await page.waitForTimeout(100);

    const urlBefore = page.url();

    await page.locator('[data-testid="random-button"]').click();
    await page.waitForTimeout(100);

    const urlAfter = page.url();
    // Very high probability the random pattern differs from default + one toggle
    expect(urlAfter).not.toBe(urlBefore);
  });

  test('randomize always has at least 1 active step per ring', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="pad-0-0"]').click(); // init

    // Randomize 10 times and check
    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="random-button"]').click();
      await page.waitForTimeout(50);

      for (let ring = 0; ring < NUM_RINGS; ring++) {
        let hasArmed = false;
        for (let step = 0; step < NUM_STEPS; step++) {
          const fill = await page.locator(`[data-testid="pad-${ring}-${step}"]`).getAttribute('fill');
          if (fill !== '#3A3A3A') hasArmed = true;
        }
        expect(hasArmed).toBe(true);
      }
    }
  });
});
