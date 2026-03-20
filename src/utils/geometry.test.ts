import { describe, it, expect } from 'vitest';
import { generateAllArcs, hitTest } from './geometry';

describe('geometry', () => {
  it('generateAllArcs returns exactly 32 arcs', () => {
    expect(generateAllArcs()).toHaveLength(32);
  });

  it('each arc path starts with M and ends with Z', () => {
    generateAllArcs().forEach(arc => {
      expect(arc.path).toMatch(/^M .+ Z$/);
    });
  });

  it('hit-test at 12 o\'clock on the outermost ring returns { ring: 0, step: 0 }', () => {
    expect(hitTest(200, 200 - 180)).toEqual({ ring: 0, step: 0 });
  });

  it('hit-test at 3 o\'clock (90°) on ring 0 returns { ring: 0, step: 2 }', () => {
    expect(hitTest(200 + 180, 200)).toEqual({ ring: 0, step: 2 });
  });

  it('hit-test at center returns null (inside all rings)', () => {
    expect(hitTest(200, 200)).toBeNull();
  });

  it('hit-test outside all rings returns null', () => {
    expect(hitTest(200, 5)).toBeNull();
  });

  it('hit-test at 12 o\'clock on innermost ring returns { ring: 3, step: 0 }', () => {
    expect(hitTest(200, 200 - 89)).toEqual({ ring: 3, step: 0 });
  });

  it('all 32 centroids are within the SVG bounds (0–400)', () => {
    generateAllArcs().forEach(arc => {
      expect(arc.centroidX).toBeGreaterThan(0);
      expect(arc.centroidX).toBeLessThan(400);
      expect(arc.centroidY).toBeGreaterThan(0);
      expect(arc.centroidY).toBeLessThan(400);
    });
  });
});
