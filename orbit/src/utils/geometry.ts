import { SVG_CENTER, RING_RADII, NUM_STEPS, STEP_ANGLE_DEG, PAD_SUBTEND_DEG, PAD_GAP_DEG, START_ANGLE_DEG } from '../constants';
import { ArcDescriptor } from '../types';

/**
 * Convert degrees to radians.
 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert polar coordinates to cartesian, centered on SVG_CENTER.
 */
function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = degToRad(angleDeg);
  return [
    SVG_CENTER + radius * Math.cos(rad),
    SVG_CENTER + radius * Math.sin(rad),
  ];
}

/**
 * Generate the SVG path `d` attribute for a single annular sector (pad).
 *
 * The path traces:
 *   1. Move to outer arc start
 *   2. Arc along outer radius to outer arc end
 *   3. Line to inner arc end
 *   4. Arc along inner radius back to inner arc start (counter-clockwise)
 *   5. Close path
 */
export function arcPath(
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const [ox1, oy1] = polarToXY(startAngleDeg, outerRadius);
  const [ox2, oy2] = polarToXY(endAngleDeg, outerRadius);
  const [ix1, iy1] = polarToXY(startAngleDeg, innerRadius);
  const [ix2, iy2] = polarToXY(endAngleDeg, innerRadius);

  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ');
}

/**
 * Generate all 40 arc descriptors (5 rings × 8 steps).
 */
export function generateAllArcs(): ArcDescriptor[] {
  const arcs: ArcDescriptor[] = [];

  for (let ring = 0; ring < RING_RADII.length; ring++) {
    const [innerR, outerR] = RING_RADII[ring];

    for (let step = 0; step < NUM_STEPS; step++) {
      const startDeg = START_ANGLE_DEG + step * STEP_ANGLE_DEG + PAD_GAP_DEG / 2;
      const endDeg = startDeg + PAD_SUBTEND_DEG;
      const midAngleDeg = (startDeg + endDeg) / 2;
      const midRadius = (innerR + outerR) / 2;
      const [cx, cy] = polarToXY(midAngleDeg, midRadius);

      arcs.push({
        ring,
        step,
        innerRadius: innerR,
        outerRadius: outerR,
        startAngleDeg: startDeg,
        endAngleDeg: endDeg,
        path: arcPath(innerR, outerR, startDeg, endDeg),
        centroidX: cx,
        centroidY: cy,
      });
    }
  }

  return arcs;
}

/**
 * Hit-test: given a click/touch point in SVG coordinates,
 * determine which pad (ring, step) was hit, or null.
 */
export function hitTest(
  svgX: number,
  svgY: number
): { ring: number; step: number } | null {
  const dx = svgX - SVG_CENTER;
  const dy = svgY - SVG_CENTER;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180 to 180

  // Find which ring (if any) based on distance from center
  let ring = -1;
  for (let r = 0; r < RING_RADII.length; r++) {
    const [innerR, outerR] = RING_RADII[r];
    if (dist >= innerR && dist <= outerR) {
      ring = r;
      break;
    }
  }
  if (ring === -1) return null;

  // Normalize angle relative to START_ANGLE_DEG
  let relAngle = angleDeg - START_ANGLE_DEG;
  if (relAngle < 0) relAngle += 360;
  if (relAngle >= 360) relAngle -= 360;

  // Determine which step (map the full 45° per step, no gap rejection)
  const step = Math.floor(relAngle / STEP_ANGLE_DEG);
  if (step < 0 || step >= NUM_STEPS) return null;

  return { ring, step };
}
