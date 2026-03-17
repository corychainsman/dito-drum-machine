# Product Requirements Document: Radial Drum Machine for Kids

**Codename:** Orbit  
**Version:** 2.0 — Agent-Buildable Edition  
**Last Updated:** 2026-03-17  
**Inspired by:** Dato DUO  
**Target Audience:** Children ages 3–7 (and their parents)

> **NOTE TO BUILDING AGENT:** This document is designed to be executed end-to-end by an AI coding agent with zero human intervention. Every decision is made. Every ambiguity is resolved. Every feature has automated validation. Follow the build order in Section 18. Run the validation gate after each milestone before proceeding.

-----

## 1. Executive Summary

Orbit is a browser-based radial step sequencer designed as a musical toy for young children. It faithfully recreates the core interaction model of the Dato DUO — concentric rings of illuminated pads arranged in a circle, with a rotating playhead that triggers sounds as it sweeps past active steps. The interface is entirely icon/color-driven with zero text labels, optimized for multitouch mobile devices (phones and tablets), and supports up to 10 simultaneous touch points. The entire application state lives in URL parameters, enabling instant sharing via link.

-----

## 2. Product Goals

|Priority|Goal                                                                   |Success Metric                                                |
|--------|-----------------------------------------------------------------------|--------------------------------------------------------------|
|P0      |A 3-year-old can make music within 5 seconds of first touch            |Zero onboarding required; first sound on first tap            |
|P0      |Buttery-smooth multitouch on mobile — no missed taps, no ghost triggers|< 15ms touch-to-audio latency; 10 simultaneous touches tracked|
|P0      |Complete app state encoded in URL at all times                         |Any URL produces identical playback; copy-paste sharing works |
|P1      |Faithful Dato DUO interaction model                                    |5 concentric rings, 8 steps, diagonal faders, random, repeat  |
|P1      |Works offline after first load                                         |Service worker caches all assets; < 500KB total payload       |
|P2      |Delightful visual feedback that rewards exploration                    |Color-coded rings, animated playhead, pad glow on trigger     |

-----

## 3. Project Structure

The AI agent MUST create exactly this file tree. No deviations.

```
orbit/
├── .github/
│   └── workflows/
│       └── deploy.yml            (GitHub Actions: build + deploy to GitHub Pages)
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192.png          (generated — see Section 17.1)
│       └── icon-512.png          (generated — see Section 17.1)
├── src/
│   ├── main.tsx                  (React root mount + service worker registration)
│   ├── App.tsx                   (top-level layout + reducer + URL sync)
│   ├── types.ts                  (all TypeScript interfaces and types)
│   ├── constants.ts              (all magic numbers, colors, layout values)
│   ├── state/
│   │   ├── reducer.ts            (useReducer logic)
│   │   ├── urlCodec.ts           (stateToURL / urlToState)
│   │   └── reducer.test.ts       (Vitest unit tests)
│   ├── audio/
│   │   ├── AudioEngine.ts        (AudioContext lifecycle, scheduler, voice pool)
│   │   ├── voices.ts             (all 5 voice synthesis/playback functions)
│   │   ├── sampleData.ts         (base64-encoded clap and tom attack samples)
│   │   └── audio.test.ts         (OfflineAudioContext validation tests)
│   ├── components/
│   │   ├── RadialSequencer.tsx    (SVG container + viewBox scaling)
│   │   ├── Ring.tsx               (one concentric ring of 8 pads)
│   │   ├── Pad.tsx                (single arc-segment pad)
│   │   ├── PlayheadArm.tsx        (rotating playhead line)
│   │   ├── CenterControl.tsx      (play/stop button)
│   │   ├── FaderTray.tsx          (container for diagonal faders)
│   │   ├── DiagonalFader.tsx      (single fader with thumb)
│   │   ├── RandomButton.tsx       (dice icon button)
│   │   ├── RepeatButton.tsx       (loop icon, momentary)
│   │   ├── TempoControl.tsx       (turtle/rabbit buttons + pulsing dot)
│   │   └── icons/                 (inline SVG icon components)
│   │       ├── PlayIcon.tsx
│   │       ├── StopIcon.tsx
│   │       ├── DiceIcon.tsx
│   │       ├── LoopIcon.tsx
│   │       ├── TurtleIcon.tsx
│   │       └── RabbitIcon.tsx
│   ├── hooks/
│   │   ├── useAudioEngine.ts     (React hook wrapping AudioEngine)
│   │   ├── usePointerHandler.ts  (multitouch pad interaction)
│   │   └── useAnimationFrame.ts  (rAF loop for playhead)
│   ├── utils/
│   │   ├── geometry.ts           (arc path generation, hit-testing math)
│   │   ├── geometry.test.ts      (Vitest tests for geometry utils)
│   │   ├── urlCodec.test.ts      (Vitest URL round-trip tests)
│   │   └── parameterCurves.ts    (fader → voice parameter mapping functions)
│   ├── styles/
│   │   └── global.css            (body resets, touch-action, safe-area)
│   └── sw.ts                     (service worker — Workbox precache)
├── tests/
│   └── e2e/
│       ├── pads.spec.ts          (Playwright: pad toggle, visual states)
│       ├── url-state.spec.ts     (Playwright: URL round-trip)
│       ├── transport.spec.ts     (Playwright: play/stop/repeat)
│       ├── faders.spec.ts        (Playwright: fader drag)
│       ├── random.spec.ts        (Playwright: randomize)
│       └── responsive.spec.ts   (Playwright: layout at 3 breakpoints)
└── scripts/
    └── validate.sh               (master validation script — runs all checks)
```

-----

## 4. Dependencies & Versions

### package.json (exact)

```json
{
  "name": "orbit",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "validate": "bash scripts/validate.sh",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^2.1.0",
    "workbox-precaching": "^7.1.0"
  }
}
```

### tsconfig.json (exact)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

### vite.config.ts (exact)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  // GitHub Pages: use relative paths so it works at any subpath
  // e.g. https://username.github.io/orbit/
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      },
      manifest: false // we provide our own in public/
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: undefined // single chunk for simplicity
      }
    }
  }
});
```

-----

## 5. Architecture Overview

### 5.1 Tech Stack

|Layer           |Choice                                                              |Rationale                                                                              |
|----------------|--------------------------------------------------------------------|---------------------------------------------------------------------------------------|
|Framework       |React 18+ with hooks                                                |Declarative UI, component model fits ring/pad hierarchy                                |
|Language        |TypeScript (strict mode)                                            |Type safety prevents subtle bugs in geometry/audio math                                |
|Rendering       |SVG (primary) + CSS transforms                                      |SVG scales perfectly to any screen; GPU-composited transforms for playhead rotation    |
|Audio Engine    |Hybrid: Web Audio API synthesis + pre-decoded AudioBuffer samples   |Synthesis for kick/hat/noise voices; samples for organic sounds like clap and tom      |
|Scheduling      |Web Audio clock (`AudioContext.currentTime`) with lookahead         |Eliminates JS timer jitter; sample-accurate step timing                                |
|State Management|`useReducer` + URL sync via `History.replaceState`                  |Single source of truth; URL updated on every mutation                                  |
|Touch Handling  |Raw Pointer Events API (`pointerdown` / `pointermove` / `pointerup`)|Pointer Events unify touch, mouse, and pen; support simultaneous multi-pointer tracking|
|Build           |Vite 6                                                              |Fast HMR, tree-shaking, small production bundle                                        |

### 5.2 Component Hierarchy

```
<App>
  ├── <AudioEngine />          // Invisible — manages AudioContext, scheduling, voice pool
  ├── <RadialSequencer>        // SVG container, viewBox scales to screen
  │   ├── <PlayheadArm />      // Rotating line/wedge, driven by requestAnimationFrame
  │   ├── <Ring voice={0..4}>  // One per drum voice, concentric
  │   │   └── <Pad step={0..7} /> × 8   // Touchable SVG arc segments
  │   └── <CenterControl />    // Play/stop icon in the hub
  ├── <FaderTray>              // Slide-up drawer (phone) or side panel (tablet)
  │   └── <DiagonalFader voice={0..4} /> × 5
  ├── <ActionButtons>
  │   ├── <RandomButton />     // Dice icon
  │   └── <RepeatButton />     // Loop/stutter icon
  └── <TempoControl />         // Turtle/rabbit buttons + pulsing dot
```

-----

## 6. Constants File (src/constants.ts)

The AI agent must create this file exactly as specified. All magic numbers in the app reference these constants — no inline literals anywhere else.

```typescript
// ─── Layout ───────────────────────────────────────────────────────
export const SVG_SIZE = 400;
export const SVG_CENTER = SVG_SIZE / 2; // 200

export const NUM_RINGS = 5;
export const NUM_STEPS = 8;
export const STEP_ANGLE_DEG = 360 / NUM_STEPS; // 45
export const PAD_SUBTEND_DEG = 38; // arc width of each pad in degrees
export const PAD_GAP_DEG = STEP_ANGLE_DEG - PAD_SUBTEND_DEG; // 7
export const START_ANGLE_DEG = -90; // 12 o'clock in SVG coordinates

// Ring geometry: [innerRadius, outerRadius] from outermost to innermost
export const RING_RADII: [number, number][] = [
  [170, 190], // Ring 0: Kick (outermost)
  [140, 158], // Ring 1: Snare
  [110, 128], // Ring 2: Hi-hat
  [80, 98],   // Ring 3: Clap
  [54, 72],   // Ring 4: Tom (innermost — widened for touch target)
];

// ─── Colors ───────────────────────────────────────────────────────
export const COLOR_BG = '#1A1A2E';
export const COLOR_FIELD = '#16213E';
export const COLOR_PAD_OFF = '#3A3A3A';

export const RING_COLORS = [
  '#FF6B6B', // Kick: coral red
  '#FFD93D', // Snare: warm yellow
  '#6BCB77', // Hi-hat: lime green
  '#4D96FF', // Clap: sky blue
  '#C77DFF', // Tom: lavender purple
] as const;

export const VOICE_NAMES = ['kick', 'snare', 'hihat', 'clap', 'tom'] as const;

// ─── Audio ────────────────────────────────────────────────────────
export const SCHEDULER_LOOKAHEAD_MS = 25;
export const SCHEDULER_AHEAD_S = 0.1;
export const DEFAULT_BPM = 100;
export const MIN_BPM = 40;
export const MAX_BPM = 200;
export const BPM_STEP = 10; // turtle/rabbit increment

// ─── Voice parameter ranges: [min, default, max] ─────────────────
// Each fader (0.0–1.0) maps linearly into these ranges.
export const VOICE_PARAMS = {
  kick: {
    pitch:  [80, 150, 250],   // starting frequency Hz
    decay:  [0.05, 0.2, 0.5], // seconds
  },
  snare: {
    pitch:  [100, 200, 400],  // sine transient Hz
    decay:  [0.05, 0.15, 0.4],// noise envelope seconds
    filter: [800, 2500, 6000],// bandpass center Hz
  },
  hihat: {
    pitch:  [4000, 7000, 12000], // HPF cutoff Hz
    decay:  [0.02, 0.06, 0.2],  // seconds
    filter: [0.5, 2, 8],        // resonance Q
  },
  clap: {
    pitch:  [0.7, 1.0, 1.4],     // playbackRate
    decay:  [0.05, 0.2, 0.5],    // gain envelope seconds
    filter: [800, 4000, 12000],   // lowpass cutoff Hz
  },
  tom: {
    pitch:  [60, 120, 200],   // oscillator Hz
    decay:  [0.08, 0.25, 0.6],// seconds
    filter: [200, 1500, 4000],// lowpass cutoff Hz
  },
} as const;

// ─── Random pattern probabilities per ring ────────────────────────
export const RANDOM_PROBABILITIES = [0.30, 0.20, 0.50, 0.15, 0.20];

// ─── Repeat ───────────────────────────────────────────────────────
export const REPEAT_SUBDIVISION = 4; // 4× speed stutter

// ─── Default starter pattern (bitmasks) ───────────────────────────
// Kick: steps 0,2,4,6 (four-on-the-floor) = 0b01010101 = 0x55
// Snare: steps 2,6 (backbeat) = 0b01000100 = 0x44
// Hi-hat: all 8 = 0xFF
// Clap: empty = 0x00
// Tom: empty = 0x00
export const DEFAULT_PATTERN_HEX = '5544FF0000';
export const DEFAULT_FADERS_HEX = '88888';
export const DEFAULT_BPM_VALUE = 100;

// ─── Animation ────────────────────────────────────────────────────
export const PAD_TOGGLE_MS = 120;
export const PAD_TRIGGER_ATTACK_MS = 80;
export const PAD_TRIGGER_DECAY_MS = 200;
export const TOUCH_FLASH_MS = 100;
export const RANDOM_SHAKE_MS = 300;

// ─── Breakpoints ──────────────────────────────────────────────────
export const BP_SMALL = 480;
export const BP_TABLET = 768;
export const BP_DESKTOP = 1024;

// ─── Haptics (vibration durations in ms) ──────────────────────────
export const HAPTIC_PAD_TAP = 10;
export const HAPTIC_RANDOM = [30, 20, 30, 20, 30];
export const HAPTIC_REPEAT = 10;
```

-----

## 7. Type Definitions (src/types.ts)

```typescript
import { VOICE_NAMES, NUM_RINGS, NUM_STEPS } from './constants';

export type VoiceName = typeof VOICE_NAMES[number];

export type PatternRow = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type Pattern = [PatternRow, PatternRow, PatternRow, PatternRow, PatternRow];
export type Faders = [number, number, number, number, number]; // each 0.0–1.0

export type Transport = 'uninitialized' | 'stopped' | 'playing';

export interface AppState {
  pattern: Pattern;
  faders: Faders;
  bpm: number;
  transport: Transport;
  currentStep: number;
  repeatActive: boolean;
}

export type Action =
  | { type: 'TOGGLE_PAD'; ring: number; step: number }
  | { type: 'SET_FADER'; ring: number; value: number }
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'RANDOMIZE' }
  | { type: 'PLAY' }
  | { type: 'STOP' }
  | { type: 'SET_REPEAT'; active: boolean }
  | { type: 'ADVANCE_STEP' }
  | { type: 'HYDRATE'; state: Partial<AppState> };

// Geometry helper types
export interface ArcDescriptor {
  ring: number;
  step: number;
  innerRadius: number;
  outerRadius: number;
  startAngleDeg: number;
  endAngleDeg: number;
  path: string; // SVG path `d` attribute
  centroidX: number;
  centroidY: number;
}
```

-----

## 8. Core Feature Specifications

### 8.1 Radial Step Sequencer

#### Layout Geometry

The sequencer is rendered as an SVG with `viewBox="0 0 400 400"` (logical coordinates), centered at `(200, 200)`. Five concentric rings are drawn at the following radii:

|Ring         |Voice |Inner Radius|Outer Radius|Color (active)         |Color (inactive)|
|-------------|------|------------|------------|-----------------------|----------------|
|0 (outermost)|Kick  |170         |190         |`#FF6B6B` (coral red)  |`#3A3A3A`       |
|1            |Snare |140         |158         |`#FFD93D` (warm yellow)|`#3A3A3A`       |
|2            |Hi-hat|110         |128         |`#6BCB77` (green)      |`#3A3A3A`       |
|3            |Clap  |80          |98          |`#4D96FF` (blue)       |`#3A3A3A`       |
|4 (innermost)|Tom   |54          |72          |`#C77DFF` (purple)     |`#3A3A3A`       |

Each ring contains 8 pads, evenly distributed at 45° intervals starting from 12 o’clock (–90° in standard math). Each pad is an SVG arc segment (annular sector) subtending 38° with a 7° gap between pads.

#### SVG Arc Path Generation (src/utils/geometry.ts)

This is the exact algorithm the agent must implement. No other arc generation approach is acceptable.

```typescript
import { SVG_CENTER, RING_RADII, NUM_STEPS, STEP_ANGLE_DEG, PAD_SUBTEND_DEG, START_ANGLE_DEG } from '../constants';
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
      // NOTE: PAD_GAP_DEG is not imported above — add to imports:
      // import { ..., PAD_GAP_DEG } from '../constants';
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
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180 to 180

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

  // Determine which step
  const step = Math.floor(relAngle / STEP_ANGLE_DEG);
  if (step < 0 || step >= NUM_STEPS) return null;

  // Check if within the pad arc (not in the gap)
  const stepStart = step * STEP_ANGLE_DEG;
  const offsetInStep = relAngle - stepStart;
  const gapHalf = (STEP_ANGLE_DEG - PAD_SUBTEND_DEG) / 2;
  if (offsetInStep < gapHalf || offsetInStep > STEP_ANGLE_DEG - gapHalf) {
    return null; // in the gap between pads
  }

  return { ring, step };
}
```

**VALIDATION — geometry.test.ts must verify:**

```typescript
// Test 1: generateAllArcs returns exactly 40 arcs
expect(generateAllArcs()).toHaveLength(40);

// Test 2: Each arc path starts with M and ends with Z
generateAllArcs().forEach(arc => {
  expect(arc.path).toMatch(/^M .+ Z$/);
});

// Test 3: Hit-test at 12 o'clock on the outermost ring returns { ring: 0, step: 0 }
expect(hitTest(200, 200 - 180)).toEqual({ ring: 0, step: 0 });

// Test 4: Hit-test at 3 o'clock (90°) on ring 0 returns { ring: 0, step: 2 }
expect(hitTest(200 + 180, 200)).toEqual({ ring: 0, step: 2 });

// Test 5: Hit-test at center returns null (inside all rings)
expect(hitTest(200, 200)).toBeNull();

// Test 6: Hit-test outside all rings returns null
expect(hitTest(200, 5)).toBeNull();

// Test 7: Hit-test at 12 o'clock on innermost ring returns { ring: 4, step: 0 }
expect(hitTest(200, 200 - 63)).toEqual({ ring: 4, step: 0 });

// Test 8: All 40 centroids are within the SVG bounds (0–400)
generateAllArcs().forEach(arc => {
  expect(arc.centroidX).toBeGreaterThan(0);
  expect(arc.centroidX).toBeLessThan(400);
  expect(arc.centroidY).toBeGreaterThan(0);
  expect(arc.centroidY).toBeLessThan(400);
});
```

#### Pad States & Visual Treatment

Each pad has exactly 3 visual states:

|State                                         |SVG `fill`|`opacity`|`filter`                               |`transform`                               |
|----------------------------------------------|----------|---------|---------------------------------------|------------------------------------------|
|**Off**                                       |`#3A3A3A` |1.0      |none                                   |none                                      |
|**Armed**                                     |Ring color|0.8      |none                                   |none                                      |
|**Triggering** (armed + playhead on this step)|Ring color|1.0      |`url(#glow)` (SVG filter defined below)|`scale(1.05)` from centroid, 80ms ease-out|

A fourth transient state — **Touched** — applies `filter: brightness(1.3)` for 100ms on any `pointerdown`, even on unarmed pads, for immediate visual feedback.

**SVG filter definition (must be in the `<defs>` block of the main SVG):**

```xml
<defs>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
    <feMerge>
      <feMergeNode in="blur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
</defs>
```

**CSS transitions on each `<path>` pad element:**

```css
.pad {
  transition: opacity 120ms ease-out, filter 80ms ease-out;
  transform-origin: var(--cx) var(--cy); /* set from centroid */
  cursor: pointer;
}
.pad.triggering {
  transition: transform 80ms ease-out, opacity 80ms linear;
}
```

#### Playhead

The playhead is an SVG `<line>` extending from the center to just past the outermost ring.

```xml
<line
  x1="200" y1="200"
  x2="200" y2="5"
  stroke="white"
  stroke-opacity="0.7"
  stroke-width="3"
  stroke-linecap="round"
  filter="url(#playhead-glow)"
  style="transform: rotate(${angle}deg); transform-origin: 200px 200px;"
/>
```

With filter:

```xml
<filter id="playhead-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
</filter>
```

**Angle calculation (in useAnimationFrame hook):**

```typescript
// Called every requestAnimationFrame while transport === 'playing'
function updatePlayhead(audioCtx: AudioContext, loopStartTime: number, loopDuration: number) {
  const elapsed = audioCtx.currentTime - loopStartTime;
  const progress = (elapsed % loopDuration) / loopDuration; // 0.0 – 1.0
  const angleDeg = progress * 360; // 0 – 360 (rotation applied on top of the default -90° orientation)
  setPlayheadAngle(angleDeg);
}
```

**The playhead is purely cosmetic.** Sound triggering is handled by the audio scheduler lookahead, not by the visual position.

#### Touch Interaction

**Tapping a pad toggles its armed state.** No drag, no hold.

Implementation in `usePointerHandler.ts`:

```typescript
export function usePointerHandler(
  svgRef: React.RefObject<SVGSVGElement>,
  dispatch: React.Dispatch<Action>,
  onFirstInteraction: () => void // used to init AudioContext
) {
  const hasInitRef = useRef(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handlePointerDown(e: PointerEvent) {
      e.preventDefault();
      svg!.setPointerCapture(e.pointerId);

      if (!hasInitRef.current) {
        hasInitRef.current = true;
        onFirstInteraction();
      }

      // Convert screen coordinates to SVG coordinates
      const pt = svg!.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg!.getScreenCTM()!.inverse());

      const hit = hitTest(svgPt.x, svgPt.y);
      if (hit) {
        dispatch({ type: 'TOGGLE_PAD', ring: hit.ring, step: hit.step });

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(HAPTIC_PAD_TAP);
      }
    }

    svg.addEventListener('pointerdown', handlePointerDown);
    return () => svg.removeEventListener('pointerdown', handlePointerDown);
  }, [svgRef, dispatch, onFirstInteraction]);
}
```

**Critical:** The SVG element must have `touch-action: none` set as both a CSS property AND an HTML attribute for cross-browser safety.

### 8.2 Sound Engine (src/audio/AudioEngine.ts)

#### AudioContext Lifecycle

```typescript
class AudioEngine {
  private ctx: AudioContext | null = null;
  private schedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();

  /**
   * Called on first user interaction. MUST be called inside a
   * pointerdown/click handler for iOS compatibility.
   */
  async init(): Promise<void> {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    await this.decodeSamples();
    this.setupVisibilityHandling();
  }

  private async decodeSamples(): Promise<void> {
    // Decode base64 samples from sampleData.ts
    for (const [name, base64] of Object.entries(SAMPLE_DATA)) {
      const binary = atob(base64);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
      }
      const audioBuffer = await this.ctx!.decodeAudioData(buffer);
      this.sampleBuffers.set(name, audioBuffer);
    }
  }

  private setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.ctx?.suspend();
      } else {
        this.ctx?.resume();
      }
    });
  }

  start(bpm: number, pattern: Pattern, faders: Faders): void {
    if (!this.ctx) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05; // tiny delay for safety
    this.schedulerLoop(bpm, pattern, faders);
  }

  stop(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  // (the scheduler reads fresh state via callbacks — see hook wrapper)
}
```

#### Scheduler Architecture

The scheduler uses the **lookahead pattern**:

```typescript
private schedulerLoop(
  getBpm: () => number,
  getPattern: () => Pattern,
  getFaders: () => Faders,
  getRepeatActive: () => boolean,
  onStepChange: (step: number) => void
): void {
  const schedule = () => {
    if (!this.ctx || !this.isPlaying) return;

    const bpm = getBpm();
    const secondsPerStep = 60.0 / bpm / 2; // 8th-note grid
    const pattern = getPattern();
    const faders = getFaders();
    const repeatActive = getRepeatActive();

    while (this.nextStepTime < this.ctx.currentTime + SCHEDULER_AHEAD_S) {
      // Schedule all armed voices at this step
      for (let ring = 0; ring < NUM_RINGS; ring++) {
        if (pattern[ring][this.currentStep]) {
          this.triggerVoice(ring, this.nextStepTime, faders[ring]);
        }
      }

      onStepChange(this.currentStep);

      if (repeatActive) {
        // Don't advance step — re-trigger at subdivided rate
        this.nextStepTime += secondsPerStep / REPEAT_SUBDIVISION;
      } else {
        this.nextStepTime += secondsPerStep;
        this.currentStep = (this.currentStep + 1) % NUM_STEPS;
      }
    }

    this.schedulerTimer = window.setTimeout(schedule, SCHEDULER_LOOKAHEAD_MS);
  };

  schedule();
}
```

**Key architectural rule:** The scheduler reads state through getter callbacks, not through stale closures. The React hook wrapper passes `() => stateRef.current.bpm` etc. This ensures the scheduler always sees the latest state without re-creating the scheduler on every state change.

#### Voice Synthesis (src/audio/voices.ts)

Each function takes `(ctx: AudioContext, time: number, faderValue: number, sampleBuffers: Map<string, AudioBuffer>)` and returns `void`. All nodes are created, connected, scheduled, and will be garbage-collected automatically after their envelopes complete.

```typescript
import { VOICE_PARAMS } from '../constants';

/**
 * Map a fader value (0.0–1.0) into a parameter range [min, default, max].
 * fader=0.0 → min, fader=0.5 → default, fader=1.0 → max.
 * Uses linear interpolation within each half.
 */
function mapParam(fader: number, range: readonly [number, number, number]): number {
  const [min, def, max] = range;
  if (fader <= 0.5) {
    return min + (def - min) * (fader / 0.5);
  } else {
    return def + (max - def) * ((fader - 0.5) / 0.5);
  }
}

// ─── KICK ─────────────────────────────────────────────────────────
export function triggerKick(
  ctx: AudioContext, time: number, fader: number
): void {
  const freq = mapParam(fader, VOICE_PARAMS.kick.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.kick.decay);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay + 0.01);
}

// ─── SNARE ────────────────────────────────────────────────────────
export function triggerSnare(
  ctx: AudioContext, time: number, fader: number
): void {
  const freq = mapParam(fader, VOICE_PARAMS.snare.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.snare.decay);
  const filterFreq = mapParam(fader, VOICE_PARAMS.snare.filter);

  // Noise component
  const bufferSize = ctx.sampleRate * Math.max(decay, 0.1);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(filterFreq, time);
  bandpass.Q.setValueAtTime(1.5, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(time);
  noise.stop(time + decay + 0.01);

  // Sine transient
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  oscGain.gain.setValueAtTime(0.7, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.04);
}

// ─── HI-HAT ──────────────────────────────────────────────────────
export function triggerHihat(
  ctx: AudioContext, time: number, fader: number
): void {
  const cutoff = mapParam(fader, VOICE_PARAMS.hihat.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.hihat.decay);
  const q = mapParam(fader, VOICE_PARAMS.hihat.filter);

  const bufferSize = ctx.sampleRate * Math.max(decay, 0.05);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(cutoff, time);
  hpf.Q.setValueAtTime(q, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  noise.connect(hpf);
  hpf.connect(gain);
  gain.connect(ctx.destination);
  noise.start(time);
  noise.stop(time + decay + 0.01);
}

// ─── CLAP ─────────────────────────────────────────────────────────
export function triggerClap(
  ctx: AudioContext, time: number, fader: number,
  sampleBuffers: Map<string, AudioBuffer>
): void {
  const rate = mapParam(fader, VOICE_PARAMS.clap.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.clap.decay);
  const filterFreq = mapParam(fader, VOICE_PARAMS.clap.filter);

  const buffer = sampleBuffers.get('clap');
  if (!buffer) return; // graceful fallback

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(rate, time);

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(filterFreq, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  source.connect(lpf);
  lpf.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
}

// ─── TOM ──────────────────────────────────────────────────────────
export function triggerTom(
  ctx: AudioContext, time: number, fader: number,
  sampleBuffers: Map<string, AudioBuffer>
): void {
  const freq = mapParam(fader, VOICE_PARAMS.tom.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.tom.decay);
  const filterFreq = mapParam(fader, VOICE_PARAMS.tom.filter);

  // Sine body
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  const lpf = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, time + decay);
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(filterFreq, time);
  oscGain.gain.setValueAtTime(0.8, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  osc.connect(lpf);
  lpf.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay + 0.01);

  // Attack texture layer (sample)
  const buffer = sampleBuffers.get('tom_attack');
  if (buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    src.connect(g);
    g.connect(ctx.destination);
    src.start(time);
  }
}
```

#### Sample Data (src/audio/sampleData.ts)

Since the AI agent cannot download audio files, it must **generate the clap and tom_attack samples programmatically** using an OfflineAudioContext at build time, then export them as base64. However, for simplicity in a single-build scenario, generate them at runtime during the `init()` phase:

```typescript
/**
 * Generate synthetic samples using OfflineAudioContext.
 * Called once during AudioEngine.init().
 * Returns a Map of sample name → AudioBuffer.
 */
export async function generateSamples(sampleRate: number): Promise<Map<string, AudioBuffer>> {
  const samples = new Map<string, AudioBuffer>();

  // ─── CLAP: multiple short noise bursts with slight delays ───────
  {
    const duration = 0.3;
    const offCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    // 3 overlapping noise bursts at 0ms, 15ms, 30ms
    for (const offset of [0, 0.015, 0.030]) {
      const buf = offCtx.createBuffer(1, sampleRate * 0.04, sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      const src = offCtx.createBufferSource();
      src.buffer = buf;

      const bpf = offCtx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2000;
      bpf.Q.value = 0.8;

      const gain = offCtx.createGain();
      gain.gain.setValueAtTime(0.8, offset);
      gain.gain.exponentialRampToValueAtTime(0.001, offset + 0.08);

      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(offCtx.destination);
      src.start(offset);
    }

    samples.set('clap', await offCtx.startRendering());
  }

  // ─── TOM ATTACK: short filtered noise transient ─────────────────
  {
    const duration = 0.06;
    const offCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    const buf = offCtx.createBuffer(1, sampleRate * duration, sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = offCtx.createBufferSource();
    src.buffer = buf;

    const bpf = offCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 800;
    bpf.Q.value = 1.0;

    const gain = offCtx.createGain();
    gain.gain.setValueAtTime(1.0, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(offCtx.destination);
    src.start(0);

    samples.set('tom_attack', await offCtx.startRendering());
  }

  return samples;
}
```

This eliminates any need for external audio files. The AudioEngine calls `generateSamples(this.ctx.sampleRate)` during init instead of decoding base64. Update the AudioEngine `init()` method accordingly — remove the base64 decode logic and replace with:

```typescript
this.sampleBuffers = await generateSamples(this.ctx.sampleRate);
```

And delete `sampleData.ts` from the project — the file is no longer needed since samples are generated at runtime. Update the file tree accordingly (the agent should not create `sampleData.ts`).

**VALIDATION — audio.test.ts must verify:**

```typescript
import { describe, it, expect } from 'vitest';

describe('Sample generation', () => {
  it('generates a clap sample with non-zero audio data', async () => {
    const offCtx = new OfflineAudioContext(1, 44100 * 0.3, 44100);
    // ... (replicate the clap generation code)
    const buffer = await offCtx.startRendering();
    const data = buffer.getChannelData(0);
    const maxAmplitude = Math.max(...Array.from(data).map(Math.abs));
    expect(maxAmplitude).toBeGreaterThan(0.01);
    expect(buffer.duration).toBeCloseTo(0.3, 1);
  });

  it('generates a tom_attack sample with non-zero audio data', async () => {
    // Similar to above for tom_attack
  });
});

describe('Voice parameter mapping', () => {
  it('maps fader 0.0 to min values', () => {
    expect(mapParam(0.0, [80, 150, 250])).toBe(80);
  });
  it('maps fader 0.5 to default values', () => {
    expect(mapParam(0.5, [80, 150, 250])).toBe(150);
  });
  it('maps fader 1.0 to max values', () => {
    expect(mapParam(1.0, [80, 150, 250])).toBe(250);
  });
  it('interpolates linearly in lower half', () => {
    expect(mapParam(0.25, [80, 150, 250])).toBe(115);
  });
  it('interpolates linearly in upper half', () => {
    expect(mapParam(0.75, [80, 150, 250])).toBe(200);
  });
});
```

**NOTE:** OfflineAudioContext may not be available in the jsdom test environment. If the agent encounters this, it should skip the sample generation tests with `it.skip` and add a comment noting they must be run in a browser environment (Playwright). The `mapParam` tests will work in jsdom.

### 8.3 Diagonal Fader Controls

#### Layout

Five diagonal faders, one per voice, each rendered as an SVG group.

**Geometry (per fader):**

- Track length: 120px (in fader-local SVG coordinates)
- Track angle: 45° from horizontal (bottom-left to top-right)
- Track start point: (0, 120) — bottom-left
- Track end point: (120, 0) — top-right (wait — that’s actually -45°. Correcting: start at (0, 84.85) end at (84.85, 0) for a 120px diagonal. Simpler: use a rotated coordinate system.)

**Simplified implementation:** Render each fader as a horizontal 120px track, rotated 45° via CSS `transform: rotate(-45deg)`. The thumb position is a simple `x` offset along the horizontal track (0–120px). This avoids diagonal projection math.

```tsx
<div className="fader-wrapper" style={{ transform: 'rotate(-45deg)' }}>
  <svg width="120" height="40" viewBox="0 0 120 40">
    {/* Track line */}
    <line x1="10" y1="20" x2="110" y2="20"
          stroke={RING_COLORS[ring]} strokeWidth="4" strokeLinecap="round" opacity="0.3" />
    {/* Active portion */}
    <line x1="10" y1="20" x2={10 + value * 100} y2="20"
          stroke={RING_COLORS[ring]} strokeWidth="4" strokeLinecap="round" />
    {/* Thumb */}
    <circle cx={10 + value * 100} cy="20" r="14"
            fill={RING_COLORS[ring]} stroke="white" strokeWidth="2" />
  </svg>
</div>
```

**Touch interaction:**

1. `pointerdown` on the SVG → capture pointer.
1. `pointermove` → compute `x` position relative to the rotated SVG, clamp to `[10, 110]`, normalize to `[0.0, 1.0]`.
1. `pointerup` → release.
1. Dispatch `SET_FADER` with the new value.

**Fader tray layout:**

- Phone (< 768px): A bottom drawer. Default height: 60px (shows colored dots for each voice as a “peek” preview). Swipe-up expands to full height (~200px) revealing the 5 diagonal faders stacked vertically with 30px spacing.
- Tablet (≥ 768px): Always visible in a 200px-wide right panel.

**Drawer implementation:** CSS `transform: translateY(calc(100% - 60px))` for collapsed state. `translateY(0)` for expanded. Transition: `transform 300ms cubic-bezier(0.16, 1, 0.3, 1)`. Toggle on tap of the peek bar, or on `pointermove` with `deltaY < -20px`.

### 8.4 Random Button

An SVG icon button showing a 6-sided die.

**Die icon (inline SVG, no external assets):**

```tsx
function DiceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="white" opacity="0.9" />
      <circle cx="8" cy="8" r="1.5" fill="#1A1A2E" />
      <circle cx="16" cy="8" r="1.5" fill="#1A1A2E" />
      <circle cx="8" cy="16" r="1.5" fill="#1A1A2E" />
      <circle cx="16" cy="16" r="1.5" fill="#1A1A2E" />
      <circle cx="12" cy="12" r="1.5" fill="#1A1A2E" />
    </svg>
  );
}
```

**Behavior:**

1. On tap, dispatch `RANDOMIZE`.
1. The reducer generates a new pattern: for each ring `r`, for each step `s`, `Math.random() < RANDOM_PROBABILITIES[r]`.
1. **Guarantee:** If any ring has zero armed steps, set a random step to `true`.
1. Apply CSS animation: `@keyframes shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }` for 300ms.
1. Haptic: `navigator.vibrate?.([30, 20, 30, 20, 30])`.
1. URL is updated after state change (handled by the global URL sync effect).

### 8.5 Repeat / Stutter Button

An SVG icon button showing a loop symbol. This is a **momentary** (hold-to-activate) button.

**Loop icon:**

```tsx
function LoopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
```

**Interaction:**

- `pointerdown` → dispatch `SET_REPEAT active: true`.
- `pointerup` OR `pointercancel` OR `pointerleave` → dispatch `SET_REPEAT active: false`.
- Must also handle the case where the finger slides off the button: use `setPointerCapture` to ensure `pointerup` fires even if the finger moves away.

**Audio behavior (handled in scheduler):** When `repeatActive` is true, the scheduler does not advance `currentStep`. Instead it re-triggers at `secondsPerStep / REPEAT_SUBDIVISION` intervals.

**Visual:** Button background pulses between 50% and 100% opacity at the repeat rate while active.

### 8.6 Tempo Control (Turtle / Rabbit)

Two circular buttons flanking a pulsing dot.

**Turtle icon (−10 BPM):**

```tsx
function TurtleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40">
      {/* Simplified turtle: shell (dome) + head + legs */}
      <ellipse cx="12" cy="14" rx="8" ry="5" fill="#6BCB77" />
      <ellipse cx="12" cy="14" rx="8" ry="5" fill="none" stroke="white" strokeWidth="1" />
      <circle cx="19" cy="12" r="2.5" fill="#6BCB77" stroke="white" strokeWidth="1" />
      <circle cx="20" cy="11.5" r="0.7" fill="white" /> {/* eye */}
      <line x1="6" y1="18" x2="5" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="9" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="15" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="18" x2="19" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
```

**Rabbit icon (+10 BPM):**

```tsx
function RabbitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40">
      {/* Simplified rabbit: head + ears */}
      <ellipse cx="12" cy="16" rx="6" ry="5" fill="#FF6B6B" stroke="white" strokeWidth="1" />
      <ellipse cx="9" cy="6" rx="2.5" ry="6" fill="#FF6B6B" stroke="white" strokeWidth="1" />
      <ellipse cx="15" cy="6" rx="2.5" ry="6" fill="#FF6B6B" stroke="white" strokeWidth="1" />
      <ellipse cx="9" cy="6" rx="1.2" ry="4" fill="#FFB3B3" /> {/* inner ear */}
      <ellipse cx="15" cy="6" rx="1.2" ry="4" fill="#FFB3B3" />
      <circle cx="10" cy="15" r="1" fill="white" /> {/* eye */}
      <circle cx="14" cy="15" r="1" fill="white" />
      <ellipse cx="12" cy="17.5" rx="1.5" ry="1" fill="#FFB3B3" /> {/* nose */}
    </svg>
  );
}
```

**Pulsing dot (between the two buttons):**

A circle that scales between 0.7 and 1.0 at the current BPM rate. Use a CSS animation whose duration is set via inline style:

```tsx
<div
  className="tempo-dot"
  style={{
    animationDuration: `${60 / bpm}s`
  }}
/>
```

```css
@keyframes pulse {
  0%, 100% { transform: scale(0.7); opacity: 0.5; }
  50% { transform: scale(1.0); opacity: 1.0; }
}
.tempo-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  animation: pulse var(--duration) ease-in-out infinite;
}
```

**Button behavior:**

- Turtle tap: dispatch `SET_BPM bpm: Math.max(MIN_BPM, currentBpm - BPM_STEP)`.
- Rabbit tap: dispatch `SET_BPM bpm: Math.min(MAX_BPM, currentBpm + BPM_STEP)`.
- Bounce animation on tap: `transform: scale(0.85)` for 80ms, then spring back.

### 8.7 Play / Stop (Center Control)

A circular button (radius 35px in SVG coords) at dead center (200, 200) of the radial sequencer.

- **Stopped:** White play triangle (▶) icon, no glow.
- **Playing:** White stop square (■) icon, pulsing glow synced to beat.
- Tap toggles between PLAY and STOP.
- On STOP, reset `currentStep` to 0 and playhead angle to 0°.

**Play icon:**

```tsx
<polygon points="188,190 188,210 208,200" fill="white" />
```

**Stop icon:**

```tsx
<rect x="190" y="190" width="20" height="20" rx="2" fill="white" />
```

The center button itself is a `<circle cx="200" cy="200" r="35" fill="rgba(255,255,255,0.1)" />` with the icon centered inside.

-----

## 9. State Management

### 9.1 Reducer (src/state/reducer.ts)

```typescript
import { AppState, Action, Pattern, PatternRow, Faders } from '../types';
import { NUM_RINGS, NUM_STEPS, RANDOM_PROBABILITIES, MIN_BPM, MAX_BPM, DEFAULT_BPM } from '../constants';
import { urlToState, stateToURL } from './urlCodec';

export function createDefaultPattern(): Pattern {
  // Default: kick on 0,2,4,6; snare on 2,6; hihat all; clap none; tom none
  return [
    [true, false, true, false, true, false, true, false],   // kick
    [false, false, true, false, false, false, true, false],  // snare
    [true, true, true, true, true, true, true, true],        // hihat
    [false, false, false, false, false, false, false, false], // clap
    [false, false, false, false, false, false, false, false], // tom
  ] as Pattern;
}

export function getInitialState(): AppState {
  // Try to hydrate from URL
  const fromUrl = urlToState(window.location.search);
  return {
    pattern: fromUrl?.pattern ?? createDefaultPattern(),
    faders: fromUrl?.faders ?? [0.5, 0.5, 0.5, 0.5, 0.5] as Faders,
    bpm: fromUrl?.bpm ?? DEFAULT_BPM,
    transport: 'uninitialized',
    currentStep: 0,
    repeatActive: false,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_PAD': {
      const newPattern = state.pattern.map((row, r) =>
        r === action.ring
          ? row.map((v, s) => (s === action.step ? !v : v)) as PatternRow
          : row
      ) as Pattern;
      return { ...state, pattern: newPattern };
    }

    case 'SET_FADER': {
      const newFaders = [...state.faders] as Faders;
      newFaders[action.ring] = Math.max(0, Math.min(1, action.value));
      return { ...state, faders: newFaders };
    }

    case 'SET_BPM': {
      const bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, action.bpm));
      return { ...state, bpm };
    }

    case 'RANDOMIZE': {
      const newPattern = Array.from({ length: NUM_RINGS }, (_, r) => {
        const row = Array.from({ length: NUM_STEPS }, () =>
          Math.random() < RANDOM_PROBABILITIES[r]
        ) as PatternRow;
        // Guarantee at least 1 active step
        if (!row.some(Boolean)) {
          row[Math.floor(Math.random() * NUM_STEPS)] = true;
        }
        return row;
      }) as Pattern;
      return { ...state, pattern: newPattern };
    }

    case 'PLAY':
      return { ...state, transport: 'playing', currentStep: 0 };

    case 'STOP':
      return { ...state, transport: 'stopped', currentStep: 0, repeatActive: false };

    case 'SET_REPEAT':
      return { ...state, repeatActive: action.active };

    case 'ADVANCE_STEP':
      return { ...state, currentStep: (state.currentStep + 1) % NUM_STEPS };

    case 'HYDRATE':
      return {
        ...state,
        ...(action.state.pattern && { pattern: action.state.pattern }),
        ...(action.state.faders && { faders: action.state.faders }),
        ...(action.state.bpm !== undefined && { bpm: action.state.bpm }),
      };

    default:
      return state;
  }
}
```

### 9.2 URL Codec (src/state/urlCodec.ts)

```typescript
import { AppState, Pattern, PatternRow, Faders } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM } from '../constants';

export function stateToURL(state: AppState): string {
  const p = state.pattern
    .map(ring => ring.reduce((byte, armed, i) => byte | (armed ? 1 << i : 0), 0))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  const f = state.faders
    .map(v => Math.round(v * 15).toString(16))
    .join('');

  return `?p=${p}&f=${f}&t=${state.bpm}`;
}

export function urlToState(search: string): Partial<AppState> | null {
  const params = new URLSearchParams(search);
  const p = params.get('p');
  const f = params.get('f');
  const t = params.get('t');

  if (!p || !f || !t) return null;

  // Validate pattern: exactly 10 hex chars
  if (!/^[0-9a-fA-F]{10}$/.test(p)) return null;

  // Validate faders: exactly 5 hex chars
  if (!/^[0-9a-fA-F]{5}$/.test(f)) return null;

  // Validate tempo
  const bpm = parseInt(t, 10);
  if (isNaN(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) return null;

  // Parse pattern
  const pattern: Pattern = [] as unknown as Pattern;
  for (let r = 0; r < NUM_RINGS; r++) {
    const byte = parseInt(p.substring(r * 2, r * 2 + 2), 16);
    const row = Array.from({ length: NUM_STEPS }, (_, i) =>
      Boolean(byte & (1 << i))
    ) as PatternRow;
    pattern.push(row);
  }

  // Parse faders
  const faders = Array.from({ length: NUM_RINGS }, (_, i) =>
    parseInt(f[i], 16) / 15
  ) as Faders;

  return { pattern, faders, bpm };
}
```

### 9.3 URL Sync Effect (in App.tsx)

```typescript
// Inside App component, after useReducer:
useEffect(() => {
  if (state.transport === 'uninitialized') return; // don't write URL before first interaction
  const url = stateToURL(state);
  window.history.replaceState(null, '', url);
}, [state.pattern, state.faders, state.bpm]);
```

**IMPORTANT:** The dependency array only includes serialized fields (pattern, faders, bpm), NOT transport/currentStep/repeatActive. This prevents URL thrashing on every step advance.

**VALIDATION — urlCodec.test.ts must verify:**

```typescript
describe('URL Codec round-trip', () => {
  it('round-trips the default pattern', () => {
    const state = getInitialState(); // with no URL params
    const url = stateToURL(state);
    const parsed = urlToState(url.substring(1)); // remove leading ?...wait, urlToState takes the full search string
    // Actually stateToURL returns "?p=...&f=...&t=..." so pass that:
    const parsed2 = urlToState(url);
    expect(parsed2).not.toBeNull();
    expect(parsed2!.pattern).toEqual(state.pattern);
    expect(parsed2!.bpm).toBe(state.bpm);
    parsed2!.faders!.forEach((f, i) => {
      // Faders lose precision (quantized to 4 bits), so check within tolerance
      expect(Math.abs(f - state.faders[i])).toBeLessThan(0.07);
    });
  });

  it('round-trips all-on pattern', () => {
    const allOn: Pattern = Array(5).fill(Array(8).fill(true)) as Pattern;
    const state = { pattern: allOn, faders: [1,1,1,1,1] as Faders, bpm: 200 } as AppState;
    const url = stateToURL(state);
    expect(url).toBe('?p=ffffffffff&f=fffff&t=200');
    const parsed = urlToState(url);
    expect(parsed!.pattern!.every(row => row.every(Boolean))).toBe(true);
  });

  it('round-trips all-off pattern', () => {
    const allOff: Pattern = Array(5).fill(Array(8).fill(false)) as Pattern;
    const state = { pattern: allOff, faders: [0,0,0,0,0] as Faders, bpm: 40 } as AppState;
    const url = stateToURL(state);
    expect(url).toBe('?p=0000000000&f=00000&t=40');
  });

  it('rejects malformed URLs', () => {
    expect(urlToState('?p=ZZ&f=00000&t=100')).toBeNull(); // p too short
    expect(urlToState('?p=0000000000&f=000&t=100')).toBeNull(); // f too short
    expect(urlToState('?p=0000000000&f=00000&t=999')).toBeNull(); // bpm out of range
    expect(urlToState('')).toBeNull(); // empty
    expect(urlToState('?garbage=true')).toBeNull(); // wrong params
  });

  it('encodes default pattern to expected hex', () => {
    // kick: 0,2,4,6 = bits 0,2,4,6 = 0b01010101 = 0x55
    // snare: 2,6 = bits 2,6 = 0b01000100 = 0x44
    // hihat: all = 0xFF
    // clap: none = 0x00
    // tom: none = 0x00
    const state = { ...getInitialState(), transport: 'stopped' as const };
    const url = stateToURL(state);
    expect(url).toContain('p=5544ff0000');
  });
});

describe('Reducer', () => {
  it('TOGGLE_PAD flips a single step', () => {
    const state = getInitialState();
    const toggled = reducer(state, { type: 'TOGGLE_PAD', ring: 0, step: 1 });
    expect(toggled.pattern[0][1]).toBe(!state.pattern[0][1]);
    // Other steps unchanged
    expect(toggled.pattern[0][0]).toBe(state.pattern[0][0]);
    expect(toggled.pattern[1][1]).toBe(state.pattern[1][1]);
  });

  it('RANDOMIZE produces at least 1 active step per ring', () => {
    for (let i = 0; i < 100; i++) { // statistical test
      const state = reducer(getInitialState(), { type: 'RANDOMIZE' });
      state.pattern.forEach(ring => {
        expect(ring.some(Boolean)).toBe(true);
      });
    }
  });

  it('SET_BPM clamps to valid range', () => {
    const state = reducer(getInitialState(), { type: 'SET_BPM', bpm: 999 });
    expect(state.bpm).toBe(200);
    const state2 = reducer(getInitialState(), { type: 'SET_BPM', bpm: 1 });
    expect(state2.bpm).toBe(40);
  });

  it('STOP resets currentStep and repeatActive', () => {
    let state = reducer(getInitialState(), { type: 'PLAY' });
    state = { ...state, currentStep: 5, repeatActive: true };
    state = reducer(state, { type: 'STOP' });
    expect(state.currentStep).toBe(0);
    expect(state.repeatActive).toBe(false);
    expect(state.transport).toBe('stopped');
  });

  it('SET_FADER clamps to 0–1', () => {
    const state = reducer(getInitialState(), { type: 'SET_FADER', ring: 0, value: 1.5 });
    expect(state.faders[0]).toBe(1.0);
    const state2 = reducer(getInitialState(), { type: 'SET_FADER', ring: 0, value: -0.3 });
    expect(state2.faders[0]).toBe(0.0);
  });
});
```

-----

## 10. Responsive Layout

### 10.1 CSS Global Styles (src/styles/global.css)

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  background: #1A1A2E;
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  position: fixed;
  inset: 0;
}

/* Safe area for notched devices */
#root {
  padding:
    env(safe-area-inset-top)
    env(safe-area-inset-right)
    env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}

/* Prevent context menu on long-press */
* {
  -webkit-touch-callout: none;
}
```

### 10.2 index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#1A1A2E" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="manifest" href="/manifest.json" />
  <title>Orbit</title>
</head>
<body oncontextmenu="return false">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### 10.3 App Layout (App.tsx structure)

```tsx
// Simplified layout structure (the agent fills in full implementation)
function App() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  // ... URL sync effect, audio engine hook, etc.

  return (
    <div className="app-container">
      {/* Main area: sequencer + action buttons */}
      <div className="main-area">
        <RadialSequencer
          pattern={state.pattern}
          currentStep={state.currentStep}
          transport={state.transport}
          dispatch={dispatch}
        />
        <div className="action-row">
          <RandomButton dispatch={dispatch} />
          <TempoControl bpm={state.bpm} dispatch={dispatch} />
          <RepeatButton dispatch={dispatch} />
        </div>
      </div>

      {/* Fader tray */}
      <FaderTray faders={state.faders} dispatch={dispatch} />
    </div>
  );
}
```

**CSS layout for `.app-container`:**

```css
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 8px;
}

/* Phone: stack vertically */
.main-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-height: 0;
}

/* The SVG sequencer should fill available space while staying square */
.sequencer-container {
  width: min(85vw, 85vh - 160px); /* leave room for action row + fader peek */
  height: min(85vw, 85vh - 160px);
  max-width: 500px;
  max-height: 500px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 0;
}

/* Tablet: side-by-side */
@media (min-width: 768px) {
  .app-container {
    flex-direction: row;
    gap: 24px;
    padding: 16px;
  }
  .sequencer-container {
    width: min(60vw, 500px);
    height: min(60vw, 500px);
  }
}
```

-----

## 11. Accessibility

|Feature       |Implementation                                                                                                                                                                                                                                                            |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Reduced motion|Respect `prefers-reduced-motion: reduce`. Disable playhead glow, pad pulse, and decorative animations. Keep functional animations (pad state change, playhead position). Use `const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;`|
|High contrast |Pad colors already meet 4.5:1 contrast ratio against `#1A1A2E` background.                                                                                                                                                                                                |
|ARIA labels   |Each pad path: `aria-label={`${VOICE_NAMES[ring]}, step ${step + 1}, ${armed ? ‘on’ : ‘off’}`}` and `role="switch"` with `aria-checked={armed}`.                                                                                                                          |
|SVG role      |Main SVG: `role="grid"`, `aria-label="Drum pattern editor"`.                                                                                                                                                                                                              |

-----

## 12. PWA Manifest (public/manifest.json)

```json
{
  "name": "Orbit — Drum Machine for Kids",
  "short_name": "Orbit",
  "start_url": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#1A1A2E",
  "theme_color": "#1A1A2E",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Icon generation:** The agent should generate simple PNG icons programmatically using an HTML canvas rendered to PNG via a Node script, or create simple SVG-to-PNG conversions. The icon should be a colored circle on the dark background with 5 concentric colored arcs representing the rings. If this is too complex, a solid circle with the 5 ring colors as concentric bands is acceptable. If icon generation proves too difficult (no canvas in Node without dependencies), create placeholder solid-color PNGs using ImageMagick or a simple script:

```bash
# Fallback: generate simple colored square icons
convert -size 192x192 xc:'#1A1A2E' -fill '#FF6B6B' -draw "circle 96,96 96,40" icons/icon-192.png
convert -size 512x512 xc:'#1A1A2E' -fill '#FF6B6B' -draw "circle 256,256 256,100" icons/icon-512.png
```

If ImageMagick is not available, the agent should create a simple Node script using the `canvas` package, or simply skip icon generation and note it as a manual step. **The app will work without icons.**

-----

## 12b. GitHub Pages Deployment

The app deploys to GitHub Pages via GitHub Actions. Every push to `main` triggers a build-and-deploy pipeline.

### GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npx vitest run

      - name: Build
        run: npx vite build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Vite Base Path

The `vite.config.ts` uses `base: './'` (relative paths). This ensures all asset references (JS, CSS, manifest, icons) resolve correctly whether the app is hosted at:

- `https://username.github.io/orbit/` (repo named “orbit”)
- `https://username.github.io/my-drum-machine/` (any other name)
- `https://custom-domain.com/` (custom domain)

No repo-name-specific configuration is needed.

### URL State and GitHub Pages

URL parameters (`?p=...&f=...&t=...`) work identically on GitHub Pages. The `urlCodec.ts` reads from `window.location.search`, which is path-independent. Shareable URLs will look like:

```
https://username.github.io/orbit/?p=5544ff0000&f=88888&t=100
```

### Repository Setup (One-Time Manual Steps)

After the agent pushes code to GitHub, the repo owner must enable GitHub Pages:

1. Go to **Settings → Pages**.
1. Under **Source**, select **GitHub Actions**.
1. The next push to `main` will trigger the workflow and deploy.

These steps cannot be automated by the agent. All other steps (build, test, deploy) are fully automated.

### Deployment Validation

After the first successful deployment, the agent (or a CI job) can verify the live site:

```bash
# Check that the site returns 200
SITE_URL="https://username.github.io/orbit/"
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "$SITE_URL")
[ "$HTTP_STATUS" = "200" ] && echo "✅ Site is live" || echo "❌ Site returned $HTTP_STATUS"
```

-----

## 13. Performance Budgets

|Metric                   |Target                                              |How to Validate                                                                    |
|-------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------|
|TypeScript compiles      |0 errors                                            |`npx tsc --noEmit` exits with code 0                                               |
|Vitest unit tests        |100% pass                                           |`npx vitest run` exits with code 0                                                 |
|Vite build succeeds      |0 errors                                            |`npx vite build` exits with code 0                                                 |
|JS bundle (gzipped)      |< 80KB                                              |`ls -la dist/assets/*.js` + check gzip size with `gzip -c dist/assets/*.js | wc -c`|
|Playwright e2e tests     |100% pass                                           |`npx playwright test` exits with code 0                                            |
|40 pad arcs rendered     |Exactly 40 `<path>` elements with class `pad`       |Playwright: `page.locator('.pad').count()` === 40                                  |
|URL updates on pad toggle|URL search params change                            |Playwright: compare `page.url()` before and after click                            |
|Audio context created    |`AudioContext` state === ‘running’ after first click|Playwright: `page.evaluate(() => ...)`                                             |

-----

## 14. End-to-End Tests (tests/e2e/)

### 14.1 pads.spec.ts

```typescript
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
```

### 14.2 url-state.spec.ts

```typescript
import { test, expect } from '@playwright/test';

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
    await page.goto('/?p=ffffffffff&f=fffff&t=180');
    // Every pad should be armed
    for (let ring = 0; ring < 5; ring++) {
      for (let step = 0; step < 8; step++) {
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
```

### 14.3 transport.spec.ts

```typescript
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
```

### 14.4 random.spec.ts

```typescript
import { test, expect } from '@playwright/test';

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

      for (let ring = 0; ring < 5; ring++) {
        let hasArmed = false;
        for (let step = 0; step < 8; step++) {
          const fill = await page.locator(`[data-testid="pad-${ring}-${step}"]`).getAttribute('fill');
          if (fill !== '#3A3A3A') hasArmed = true;
        }
        expect(hasArmed).toBe(true);
      }
    }
  });
});
```

### 14.5 responsive.spec.ts

```typescript
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
```

-----

## 15. Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173', // vite preview port
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
});
```

-----

## 16. Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: [],
  },
});
```

-----

## 17. Master Validation Script (scripts/validate.sh)

This script is the single source of truth for “is the build good?” The AI agent must run this after each milestone and only proceed if it exits 0.

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo "  ORBIT — Master Validation Script"
echo "═══════════════════════════════════════════════════"

FAIL=0

# ─── Gate 1: TypeScript compiles ─────────────────────────────────
echo ""
echo "▸ Gate 1: TypeScript compilation"
if npx tsc --noEmit 2>&1; then
  echo "  ✅ TypeScript: PASS"
else
  echo "  ❌ TypeScript: FAIL"
  FAIL=1
fi

# ─── Gate 2: Unit tests ─────────────────────────────────────────
echo ""
echo "▸ Gate 2: Vitest unit tests"
if npx vitest run 2>&1; then
  echo "  ✅ Unit tests: PASS"
else
  echo "  ❌ Unit tests: FAIL"
  FAIL=1
fi

# ─── Gate 3: Production build ────────────────────────────────────
echo ""
echo "▸ Gate 3: Vite production build"
if npx vite build 2>&1; then
  echo "  ✅ Build: PASS"
else
  echo "  ❌ Build: FAIL"
  FAIL=1
fi

# ─── Gate 4: Bundle size ─────────────────────────────────────────
echo ""
echo "▸ Gate 4: Bundle size check (< 80KB gzipped JS)"
JS_FILE=$(ls -S dist/assets/*.js | head -1)
if [ -f "$JS_FILE" ]; then
  GZIP_SIZE=$(gzip -c "$JS_FILE" | wc -c)
  echo "  JS bundle gzipped: ${GZIP_SIZE} bytes"
  if [ "$GZIP_SIZE" -lt 81920 ]; then
    echo "  ✅ Bundle size: PASS"
  else
    echo "  ❌ Bundle size: FAIL (${GZIP_SIZE} > 81920)"
    FAIL=1
  fi
else
  echo "  ❌ Bundle size: FAIL (no JS file found in dist/assets/)"
  FAIL=1
fi

# ─── Gate 5: E2E tests ──────────────────────────────────────────
echo ""
echo "▸ Gate 5: Playwright end-to-end tests"
npx playwright install chromium --with-deps 2>&1 || true
if npx playwright test --project=chromium 2>&1; then
  echo "  ✅ E2E tests: PASS"
else
  echo "  ❌ E2E tests: FAIL"
  FAIL=1
fi

# ─── Gate 6: File structure audit ────────────────────────────────
echo ""
echo "▸ Gate 6: Required files exist"
REQUIRED_FILES=(
  "src/main.tsx"
  "src/App.tsx"
  "src/types.ts"
  "src/constants.ts"
  "src/state/reducer.ts"
  "src/state/urlCodec.ts"
  "src/audio/AudioEngine.ts"
  "src/audio/voices.ts"
  "src/components/RadialSequencer.tsx"
  "src/components/Ring.tsx"
  "src/components/Pad.tsx"
  "src/components/PlayheadArm.tsx"
  "src/components/CenterControl.tsx"
  "src/components/FaderTray.tsx"
  "src/components/DiagonalFader.tsx"
  "src/components/RandomButton.tsx"
  "src/components/RepeatButton.tsx"
  "src/components/TempoControl.tsx"
  "src/hooks/useAudioEngine.ts"
  "src/hooks/usePointerHandler.ts"
  "src/hooks/useAnimationFrame.ts"
  "src/utils/geometry.ts"
  "src/styles/global.css"
  "public/manifest.json"
  "index.html"
  "vite.config.ts"
  "vitest.config.ts"
  "playwright.config.ts"
  "scripts/validate.sh"
  "scripts/dev-validate.ts"
  ".gitignore"
  ".github/workflows/deploy.yml"
)

FILE_FAIL=0
for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  ❌ Missing: $f"
    FILE_FAIL=1
  fi
done
if [ "$FILE_FAIL" -eq 0 ]; then
  echo "  ✅ File structure: PASS (all ${#REQUIRED_FILES[@]} files present)"
else
  echo "  ❌ File structure: FAIL"
  FAIL=1
fi

# ─── Gate 7: data-testid audit ───────────────────────────────────
echo ""
echo "▸ Gate 7: Required data-testid attributes in source"
REQUIRED_TESTIDS=(
  "pad-"
  "sequencer-svg"
  "center-control"
  "play-icon"
  "stop-icon"
  "random-button"
  "repeat-button"
  "fader-tray"
  "tempo-turtle"
  "tempo-rabbit"
  "tempo-dot"
)

TESTID_FAIL=0
for tid in "${REQUIRED_TESTIDS[@]}"; do
  if ! grep -r "data-testid=\"${tid}" src/ > /dev/null 2>&1; then
    # Also check for template literal form
    if ! grep -r "data-testid={\`${tid}" src/ > /dev/null 2>&1; then
      echo "  ❌ Missing data-testid: ${tid}*"
      TESTID_FAIL=1
    fi
  fi
done
if [ "$TESTID_FAIL" -eq 0 ]; then
  echo "  ✅ Test IDs: PASS"
else
  echo "  ❌ Test IDs: FAIL"
  FAIL=1
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  🎉 ALL GATES PASSED"
else
  echo "  💥 ONE OR MORE GATES FAILED"
fi
echo "═══════════════════════════════════════════════════"

exit $FAIL
```

-----

## 18. Build Order (for the AI agent)

Execute these phases sequentially. After each phase, run the validation script. Only proceed if the relevant gates pass.

### Phase 1: Scaffold & Static Layout

**Tasks:**

1. `npm init` and install all dependencies per Section 4.
1. Create all config files exactly: `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `public/manifest.json`.
1. Create `src/constants.ts` exactly as specified in Section 6.
1. Create `src/types.ts` exactly as specified in Section 7.
1. Create `src/utils/geometry.ts` with `arcPath`, `generateAllArcs`, `hitTest`.
1. Create `src/utils/geometry.test.ts` with all 8 tests.
1. Create `src/state/urlCodec.ts` with `stateToURL`, `urlToState`.
1. Create `src/state/reducer.ts` with full reducer + `getInitialState`.
1. Create `src/utils/urlCodec.test.ts` and `src/state/reducer.test.ts` with all tests from Section 9.3.
1. Create `src/styles/global.css` exactly as in Section 10.1.
1. Create `src/main.tsx` (basic React root mount).
1. Create `src/App.tsx` with reducer + URL sync effect + static layout.
1. Create all component files as stubs (render placeholder divs/SVGs).
1. Create `scripts/validate.sh`.

**Validation gates:** 1 (TypeScript), 2 (unit tests), 6 (file structure).

### Phase 2: Visual Sequencer

**Tasks:**

1. Implement `RadialSequencer.tsx`: SVG with viewBox, background circle, glow filter defs.
1. Implement `Ring.tsx`: renders 8 `<Pad>` components using `generateAllArcs()`.
1. Implement `Pad.tsx`: SVG `<path>` with conditional fill based on armed state. Include `data-testid={`pad-${ring}-${step}`}`.
1. Implement `CenterControl.tsx`: circle + play/stop icon toggle.
1. Implement `PlayheadArm.tsx`: SVG `<line>` with rotation (static at 0° for now — animation in Phase 4).
1. Implement `usePointerHandler.ts`: pointer event listener with SVG coordinate transform + `hitTest`.
1. Wire everything in `App.tsx`: pads toggle on click, URL updates on every state change.

**Validation gates:** 1, 2, 3, 5 (e2e: pads.spec.ts, url-state.spec.ts), 6, 7.

### Phase 3: Audio Engine

**Tasks:**

1. Implement `src/audio/voices.ts` with all 5 voice trigger functions exactly as specified in Section 8.2.
1. Implement `src/audio/AudioEngine.ts` with:
- `init()` (AudioContext creation + sample generation via `generateSamples`).
- `start()` / `stop()` / scheduler loop.
- Visibility handling.
1. Create the `generateSamples` function (either in `AudioEngine.ts` or a separate `sampleGeneration.ts`).
1. Implement `src/hooks/useAudioEngine.ts`: wraps AudioEngine as a React hook, passes state getter callbacks to scheduler.
1. Wire AudioEngine into `App.tsx`: first interaction calls `init`, play/stop controls transport.
1. Implement `src/audio/audio.test.ts` with `mapParam` tests (skip OfflineAudioContext tests if jsdom doesn’t support them).

**Validation gates:** 1, 2, 3. (Audio correctness validated by: app loads, click play, sounds play. E2E transport.spec.ts checks icon state.)

### Phase 4: Playhead + Animation

**Tasks:**

1. Implement `src/hooks/useAnimationFrame.ts`: rAF loop that reads `audioCtx.currentTime` and computes playhead angle.
1. Wire into `PlayheadArm.tsx`: rotate line by computed angle.
1. Add triggering state to pads: `currentStep` from state highlights the active column.

**Validation gates:** 1, 3, 5 (transport.spec.ts).

### Phase 5: Faders, Random, Repeat, Tempo

**Tasks:**

1. Implement `DiagonalFader.tsx` with pointer drag interaction.
1. Implement `FaderTray.tsx` with bottom-drawer behavior (phone) and side-panel (tablet).
1. Implement `RandomButton.tsx` with dice icon + shake animation + haptic.
1. Implement `RepeatButton.tsx` with momentary hold behavior + pointer capture.
1. Implement `TempoControl.tsx` with turtle/rabbit icons + pulsing dot.
1. Wire fader values into voice parameters (the AudioEngine reads `faders` via getter callback).
1. Wire repeat flag into scheduler (stutter logic).

**Validation gates:** 1, 2, 3, 5 (all e2e tests), 6, 7.

### Phase 6: Responsive + Polish

**Tasks:**

1. Implement responsive CSS from Section 10.
1. Add `prefers-reduced-motion` media query support.
1. Add all ARIA attributes per Section 11.
1. Test at phone (375×667), tablet portrait (768×1024), tablet landscape (1024×768) viewports.
1. Generate PWA icons (or create placeholders).

**Validation gates:** ALL gates (1–7). Run full `bash scripts/validate.sh`. Must exit 0.

-----

## 19. data-testid Reference

Every interactive element must have a `data-testid` attribute for automated testing. Complete list:

|Element                 |data-testid        |Format                     |
|------------------------|-------------------|---------------------------|
|Each pad                |`pad-{ring}-{step}`|`pad-0-0` through `pad-4-7`|
|SVG container           |`sequencer-svg`    |Static                     |
|Center play/stop button |`center-control`   |Static                     |
|Play icon (when stopped)|`play-icon`        |Static                     |
|Stop icon (when playing)|`stop-icon`        |Static                     |
|Random button           |`random-button`    |Static                     |
|Repeat button           |`repeat-button`    |Static                     |
|Fader tray container    |`fader-tray`       |Static                     |
|Each fader              |`fader-{ring}`     |`fader-0` through `fader-4`|
|Turtle (slow) button    |`tempo-turtle`     |Static                     |
|Rabbit (fast) button    |`tempo-rabbit`     |Static                     |
|Tempo pulsing dot       |`tempo-dot`        |Static                     |

-----

## 20. Known Edge Cases & Agent Guidance

|Scenario                                               |Expected Behavior                                 |Implementation Note                                                                                                                                         |
|-------------------------------------------------------|--------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
|User opens URL with no params                          |Load default starter beat                         |`urlToState` returns null → `getInitialState` uses defaults                                                                                                 |
|User opens URL with partial params (e.g., `?p=AA` only)|Fall back to defaults                             |`urlToState` returns null if any param is missing or malformed                                                                                              |
|Two fingers hit same pad simultaneously                |Single toggle (not double-toggle back to original)|Deduplicate by pad identity: if `pad-{ring}-{step}` was toggled within the last 50ms, ignore. Use a `Map<string, number>` of `padKey → lastToggleTimestamp`.|
|Finger slides from one pad to another                  |Only the initial pad is toggled                   |No `pointermove` handler on pads — only `pointerdown` triggers toggle.                                                                                      |
|AudioContext suspended by browser (tab backgrounded)   |Suspend on hidden, resume on visible              |`visibilitychange` listener in AudioEngine                                                                                                                  |
|iOS Safari refuses AudioContext                        |First `pointerdown` calls `audioCtx.resume()`     |The `onFirstInteraction` callback in `usePointerHandler`                                                                                                    |
|BPM change while playing                               |Scheduler picks up new BPM on next loop iteration |BPM read via getter callback `getBpm()`, not stale closure                                                                                                  |
|Pattern change while playing                           |Scheduler picks up new pattern on next step       |Same getter callback pattern                                                                                                                                |
|All pads cleared (no armed steps in any ring)          |Sequencer plays silently — playhead still rotates |No special case needed; scheduler just doesn’t trigger any voices                                                                                           |
|Repeat button held while stopped                       |No effect                                         |Scheduler only runs while playing; `repeatActive` flag is set but does nothing until play starts                                                            |
|URL contains uppercase hex                             |Treat as valid                                    |`parseInt` with radix 16 handles both cases. The regex in `urlToState` uses `[0-9a-fA-F]`.                                                                  |
|Window resize while playing                            |SVG scales automatically (viewBox)                |No resize handler needed for the sequencer itself. Fader tray layout re-evaluated by CSS media queries.                                                     |

-----

## 21. Open Questions & Future Considerations

|#|Question / Idea                                                                                                                                      |Status            |
|-|-----------------------------------------------------------------------------------------------------------------------------------------------------|------------------|
|1|**Sound kit swapping:** Multiple sound kits (e.g., “Animals”, “Space”, “Kitchen”). Each kit swaps all 5 voice samples. Massive replay value for kids.|P2 — defer to v1.1|
|2|**Collaborative mode:** Two devices sync state via WebRTC or shared URL polling.                                                                     |P3 — explore      |
|3|**Visual themes:** A “day mode” with pastel colors on white for bright rooms.                                                                        |P2                |
|4|**MIDI output:** `navigator.requestMIDIAccess()` for DAW connectivity.                                                                               |P3                |
|5|**Recording / export:** `MediaRecorder` + `AudioContext.createMediaStreamDestination()`.                                                             |P2                |
|6|**Variable steps per ring (polyrhythm):** Complex evolving patterns.                                                                                 |P3                |

-----

## 22. Visual Reference Mockups

This section provides pixel-accurate visual targets for every breakpoint and component. The building agent must match these specifications exactly. An interactive rendering of all mockups is provided as a companion React artifact (`orbit_visual_reference.jsx`) — the agent should render this artifact in a browser to see the exact expected output.

### 22.1 Layout Specifications Per Breakpoint

#### Phone (< 480px) — Portrait Only

```
┌─────────────────────────────┐
│        ● ● ● (status bar)   │  ← Safe area inset top
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │   ╭─── Ring 0 ───╮│    │
│    │   │ ╭── Ring 1 ──╮│    │
│    │   │ │╭─ Ring 2 ─╮││    │  Sequencer: 85vw square
│    │   │ ││╭Ring 3 ╮│││    │  (max 320px on iPhone SE)
│    │   │ ││╰Ring 4 ╯│││    │
│    │   │ │╰──────────╯││    │
│    │   │ ╰────────────╯│    │
│    │   ╰──── ▶/■ ──────╯    │
│    └───────────────────┘    │
│                             │
│   🎲    🐢  ●  🐇    🔁   │  ← Action row: 48px buttons
│                             │
│ ┌─────────────────────────┐ │  ← Fader drawer (collapsed)
│ │  ● ● ● ● ●  (peek dots)│ │     60px visible, 5 color dots
│ └─────────────────────────┘ │     Swipe up → 200px expanded
└─────────────────────────────┘
```

**Exact measurements (at 375px viewport):**

- Sequencer SVG: `width: min(85vw, 85vh - 160px)` = ~319px on iPhone SE, ~340px on iPhone 15
- Action row: height 56px, centered horizontally, 20px gap between items
- Fader drawer collapsed: 60px from bottom edge, full width, `border-radius: 12px 12px 0 0`
- Fader drawer expanded: 200px from bottom edge, 5 diagonal faders stacked with 8px vertical gap
- Vertical gap between sequencer and action row: 8px
- Padding: 8px on all sides

#### Tablet Portrait (768px–1023px)

```
┌──────────────────────────────────┐
│                                  │
│       ┌──────────────────┐       │
│       │                  │       │
│       │    Sequencer     │       │  Sequencer: min(60vw, 500px)
│       │    (5 rings)     │       │  = ~461px at 768px viewport
│       │    + playhead    │       │
│       │    + center ▶/■  │       │
│       │                  │       │
│       └──────────────────┘       │
│                                  │
│      🎲    🐢  ●  🐇    🔁     │  Action row
│                                  │
│    ┌──────────────────────────┐  │
│    │  ╲   ╲   ╲   ╲   ╲     │  │  Fader panel: always visible
│    │  Kick Snr Hat Clp Tom   │  │  width: 85% of container
│    └──────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

#### Tablet Landscape / Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│    ┌──────────────────┐    ┌──────────────────┐     │
│    │                  │    │  ╲  Kick          │     │
│    │    Sequencer     │    │  ╲  Snare         │     │
│    │    (5 rings)     │    │  ╲  Hi-hat        │     │  Two-column layout
│    │    + playhead    │    │  ╲  Clap          │     │  Left: sequencer + actions
│    │    + center ▶/■  │    │  ╲  Tom           │     │  Right: fader panel (200px)
│    │                  │    │                   │     │
│    └──────────────────┘    └──────────────────┘     │
│                                                     │
│      🎲    🐢  ●  🐇    🔁                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Exact measurements (at 1024px viewport):**

- Container: `display: flex; flex-direction: row; gap: 24px; padding: 16px`
- Sequencer: `width: min(60vw, 500px)` = 500px (capped)
- Fader panel: `flex: 0 0 200px`, always visible, `border-radius: 12px`
- Action row: below sequencer, within left column

### 22.2 Radial Sequencer Geometry (SVG)

The exact SVG structure the agent must produce:

```svg
<svg
  data-testid="sequencer-svg"
  viewBox="0 0 400 400"
  width="100%"
  height="100%"
  style="touch-action: none"
  touch-action="none"
>
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="playhead-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
    </filter>
  </defs>

  <!-- Background field -->
  <circle cx="200" cy="200" r="195" fill="#16213E"/>

  <!-- 40 pad arcs (5 rings × 8 steps) -->
  <!-- Ring 0 (Kick, outermost): r_inner=170, r_outer=190 -->
  <!-- Ring 1 (Snare): r_inner=140, r_outer=158 -->
  <!-- Ring 2 (Hi-hat): r_inner=110, r_outer=128 -->
  <!-- Ring 3 (Clap): r_inner=80, r_outer=98 -->
  <!-- Ring 4 (Tom, innermost): r_inner=54, r_outer=72 -->
  <!--
    For each pad at ring=R, step=S:
    startAngle = -90 + S*45 + 3.5
    endAngle = startAngle + 38
    Path = annular sector from startAngle to endAngle
    data-testid="pad-{R}-{S}"
    fill = armed ? RING_COLORS[R] : '#3A3A3A'
    opacity = triggering ? 1.0 : armed ? 0.8 : 1.0
    filter = triggering ? 'url(#glow)' : 'none'
    stroke = !armed ? RING_COLORS[R] : 'none'
    stroke-opacity = 0.2
    stroke-width = !armed ? 0.5 : 0
  -->
  <path data-testid="pad-0-0" d="M ... Z" fill="..." />
  <!-- ... 39 more paths ... -->

  <!-- Playhead line (rotate from center to past outermost ring) -->
  <line
    x1="200" y1="200"
    x2="200" y2="5"
    stroke="white" stroke-opacity="0.7"
    stroke-width="3" stroke-linecap="round"
    filter="url(#playhead-glow)"
    style="transform: rotate({angle}deg); transform-origin: 200px 200px;"
  />

  <!-- Center play/stop button -->
  <circle
    data-testid="center-control"
    cx="200" cy="200" r="35"
    fill="rgba(255,255,255,0.08)"
    stroke="rgba(255,255,255,0.15)"
    stroke-width="1.5"
  />
  <!-- Play icon (when stopped): -->
  <polygon data-testid="play-icon" points="192,188 192,212 214,200" fill="white"/>
  <!-- OR Stop icon (when playing): -->
  <rect data-testid="stop-icon" x="190" y="190" width="20" height="20" rx="2" fill="white"/>
</svg>
```

### 22.3 Pad Arc Geometry Diagram

Each pad is an annular sector. This ASCII diagram shows the angular layout for Ring 0 (Kick):

```
                    Step 0
                  (-90° ± 19°)
                     ╱╲
                    ╱  ╲
           Step 7  ╱    ╲  Step 1
          (225°)  │      │  (-45°)
                  │  ●●  │
           Step 6 │center│ Step 2
          (180°)  │      │  (0°)
                   ╲    ╱
            Step 5  ╲  ╱  Step 3
            (135°)   ╲╱   (45°)
                   Step 4
                   (90°)

  Each step occupies 45° total:
  ├── 3.5° gap ──├── 38° pad arc ──├── 3.5° gap ──┤

  Step 0 center angle: -90° (12 o'clock)
  Step 0 pad arc: -90° + 3.5° = -86.5° to -86.5° + 38° = -48.5°
  Step 1 center angle: -45° (1:30 position)
  ...etc
```

### 22.4 Color Palette (Exact Hex Values)

```
Background     ██  #1A1A2E    rgb(26, 26, 46)
Field          ██  #16213E    rgb(22, 33, 62)
Pad Off        ██  #3A3A3A    rgb(58, 58, 58)
Kick (Ring 0)  ██  #FF6B6B    rgb(255, 107, 107)
Snare (Ring 1) ██  #FFD93D    rgb(255, 217, 61)
Hi-hat (Ring 2)██  #6BCB77    rgb(107, 203, 119)
Clap (Ring 3)  ██  #4D96FF    rgb(77, 150, 255)
Tom (Ring 4)   ██  #C77DFF    rgb(199, 125, 255)
Playhead       ██  rgba(255, 255, 255, 0.7)
```

### 22.5 Pad State Visual Matrix

This table defines the exact visual properties for every combination of pad state. The agent must implement these exactly:

```
┌────────────┬──────────────────┬─────────┬────────────────┬─────────────────┬──────────────────┐
│ State      │ fill             │ opacity │ filter         │ stroke          │ transform        │
├────────────┼──────────────────┼─────────┼────────────────┼─────────────────┼──────────────────┤
│ Off        │ #3A3A3A          │ 1.0     │ none           │ RING_COLOR 0.2  │ none             │
│ Armed      │ RING_COLOR       │ 0.8     │ none           │ none            │ none             │
│ Triggering │ RING_COLOR       │ 1.0     │ url(#glow)     │ none            │ scale(1.05) 80ms │
│ Touched    │ (current fill)   │ (same)  │ brightness(1.3)│ (same)          │ none, 100ms      │
└────────────┴──────────────────┴─────────┴────────────────┴─────────────────┴──────────────────┘

"Triggering" = armed AND currentStep matches AND transport === 'playing'
"Touched" = any pointerdown on this pad, transient 100ms flash, overlay on current state
```

### 22.6 Icon SVG Specifications

All icons are inline SVG — no external files, no emoji, no icon libraries. Each icon’s exact `viewBox` and path data are specified in Section 8 of this document. Summary of icon bounding boxes:

|Icon                   |viewBox                  |Default render size       |Used in      |
|-----------------------|-------------------------|-------------------------:|-------------|
|Play (triangle)        |`0 0 400 400` (SVG-local)|Fits in r=35 center circle|CenterControl|
|Stop (square)          |`0 0 400 400` (SVG-local)|Fits in r=35 center circle|CenterControl|
|Dice (5 dots on square)|`0 0 24 24`              |48×48px button            |RandomButton |
|Loop (arrows in circle)|`0 0 24 24`              |48×48px button            |RepeatButton |
|Turtle                 |`0 0 24 24`              |40×40px button            |TempoControl |
|Rabbit                 |`0 0 24 24`              |40×40px button            |TempoControl |

All icon buttons share the same container style:

```css
.icon-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 120ms ease-out;
}
.icon-button:active {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(0.92);
}
```

Turtle/rabbit tempo buttons are smaller: `width: 36px; height: 36px`.

### 22.7 Fader Drawer Behavior (Phone)

```
COLLAPSED (default on < 768px):
┌─────────────────────────────┐
│  ● ● ● ● ●   ↑ drag handle │  60px visible
└─────────────────────────────┘

EXPANDED (swipe up or tap handle):
┌─────────────────────────────┐
│  ╲ Kick fader               │
│  ╲ Snare fader              │
│  ╲ Hi-hat fader             │  200px total height
│  ╲ Clap fader               │
│  ╲ Tom fader                │
│                             │
│  ● ● ● ● ●   ↓ drag handle │
└─────────────────────────────┘

Transition: transform: translateY(calc(100% - 60px)) → translateY(0)
Duration: 300ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)  (overshoot spring)

Trigger to expand:
  - Tap on the collapsed peek bar
  - pointerdown + pointermove with deltaY < -20px on the peek bar

Trigger to collapse:
  - Tap on the expanded handle area
  - pointerdown + pointermove with deltaY > 20px
  - Tap outside the drawer (on the sequencer area)
```

### 22.8 Animation Timing Reference

```
               0ms      80ms     120ms    200ms    300ms
                │        │        │        │        │
Pad toggle:     ████████████████──                         ease-out opacity
Pad trigger:    ████████──────────────────                 80ms attack, 200ms decay
Touched flash:  ████████████──                             brightness 100ms
Playhead glow:  (continuous while playing)
Random shake:   ████████████████████████████████████████   rotate ±8° ease-in-out
Button press:   ██████████──                               scale(0.92) → 1.0
Fader drawer:   ████████████████████████████████████████████████████  spring 300ms
Tempo dot:      (continuous pulse at BPM rate)
```

### 22.9 Validation: Visual Regression

The agent should add the following Playwright visual assertions to `tests/e2e/responsive.spec.ts`:

```typescript
test('phone layout matches visual spec', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/?p=5544ff0000&f=88888&t=100');
  await page.waitForTimeout(500); // let CSS settle

  // Sequencer SVG is square and fills ~85% of viewport width
  const svg = page.locator('[data-testid="sequencer-svg"]');
  const box = await svg.boundingBox();
  expect(box!.width).toBeGreaterThan(290);
  expect(box!.width).toBeLessThan(340);
  expect(Math.abs(box!.width - box!.height)).toBeLessThan(5); // square

  // Action buttons exist below the sequencer
  const dice = page.locator('[data-testid="random-button"]');
  const diceBox = await dice.boundingBox();
  expect(diceBox!.y).toBeGreaterThan(box!.y + box!.height);

  // Fader tray exists at bottom
  const faderTray = page.locator('[data-testid="fader-tray"]');
  const faderBox = await faderTray.boundingBox();
  expect(faderBox!.y + faderBox!.height).toBeCloseTo(667, -1);
});

test('tablet landscape: two-column layout', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/?p=5544ff0000&f=88888&t=100');
  await page.waitForTimeout(500);

  const svg = page.locator('[data-testid="sequencer-svg"]');
  const faderTray = page.locator('[data-testid="fader-tray"]');
  const svgBox = await svg.boundingBox();
  const faderBox = await faderTray.boundingBox();

  // Fader tray is to the RIGHT of the sequencer
  expect(faderBox!.x).toBeGreaterThan(svgBox!.x + svgBox!.width - 50);
  // Both are visible
  expect(svgBox!.width).toBeGreaterThan(200);
  expect(faderBox!.width).toBeGreaterThan(100);
});

test('all 40 pads visible and non-overlapping', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  for (let ring = 0; ring < 5; ring++) {
    for (let step = 0; step < 8; step++) {
      const pad = page.locator(`[data-testid="pad-${ring}-${step}"]`);
      await expect(pad).toBeVisible();
      const box = await pad.boundingBox();
      boxes.push({ x: box!.x, y: box!.y, w: box!.width, h: box!.height });
    }
  }

  // Verify no two pads on the same ring share the exact same bounding box
  // (basic non-overlap check — they should be spatially distinct)
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const same = Math.abs(boxes[i].x - boxes[j].x) < 1 &&
                   Math.abs(boxes[i].y - boxes[j].y) < 1;
      expect(same).toBe(false);
    }
  }
});

test('center control button is inside the sequencer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const svg = page.locator('[data-testid="sequencer-svg"]');
  const btn = page.locator('[data-testid="center-control"]');
  const svgBox = await svg.boundingBox();
  const btnBox = await btn.boundingBox();

  // Button center is within the SVG bounds
  const btnCenterX = btnBox!.x + btnBox!.width / 2;
  const btnCenterY = btnBox!.y + btnBox!.height / 2;
  expect(btnCenterX).toBeGreaterThan(svgBox!.x);
  expect(btnCenterX).toBeLessThan(svgBox!.x + svgBox!.width);
  expect(btnCenterY).toBeGreaterThan(svgBox!.y);
  expect(btnCenterY).toBeLessThan(svgBox!.y + svgBox!.height);
});
```

-----

## 23. Hot-Reload Development Validation

This section specifies a file-watcher-based validation system that runs automatically on every source file change during development. This eliminates the need for the building agent to manually run `validate.sh` — instead, a background process watches for changes and runs relevant validation gates in under 3 seconds, providing instant pass/fail feedback.

### 23.1 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Vite Dev Server (port 5173)                                 │
│  ├── HMR WebSocket ← standard Vite hot module replacement    │
│  └── serves app for Playwright                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────┐
│  Validation Watcher (scripts/dev-validate.ts)                │
│  ├── chokidar watches src/**/*.{ts,tsx,css}                  │
│  ├── On change → determine which gate(s) to run              │
│  │   ├── *.test.ts changed → run Vitest on that file         │
│  │   ├── state/*.ts changed → run reducer + urlCodec tests   │
│  │   ├── utils/*.ts changed → run geometry tests             │
│  │   ├── audio/*.ts changed → run audio tests                │
│  │   ├── components/*.tsx changed → run TypeScript check      │
│  │   └── ANY .ts/.tsx changed → run tsc --noEmit             │
│  ├── Emits results via WebSocket (port 5174)                 │
│  └── Writes results to .validation-status.json               │
└──────────────────────────────────────────────────────────────┘
```

### 23.2 File: scripts/dev-validate.ts

The agent must create this file. It uses `chokidar` for file watching and runs validation gates as child processes.

```typescript
import { watch } from 'chokidar';
import { execSync, exec } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import path from 'path';

// ─── Configuration ────────────────────────────────────────────────
const SRC_DIR = path.resolve('./src');
const STATUS_FILE = '.validation-status.json';
const WS_PORT = 5174;

// ─── WebSocket server for live status ─────────────────────────────
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`🔌 Validation WebSocket on ws://localhost:${WS_PORT}`);

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
  writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

// ─── Gate runners ─────────────────────────────────────────────────
interface GateResult {
  gate: string;
  passed: boolean;
  duration_ms: number;
  error?: string;
}

function runGate(gate: string, command: string): GateResult {
  const start = Date.now();
  try {
    execSync(command, {
      stdio: 'pipe',
      timeout: 30000,
      encoding: 'utf-8',
    });
    return { gate, passed: true, duration_ms: Date.now() - start };
  } catch (err: any) {
    return {
      gate,
      passed: false,
      duration_ms: Date.now() - start,
      error: (err.stdout || err.message || '').slice(0, 500),
    };
  }
}

// ─── Determine which gates to run based on changed file ───────────
function gatesForFile(filePath: string): { gate: string; command: string }[] {
  const rel = path.relative(SRC_DIR, filePath);
  const gates: { gate: string; command: string }[] = [];

  // Always run TypeScript check
  gates.push({ gate: 'tsc', command: 'npx tsc --noEmit' });

  // Route to specific test suites based on file path
  if (rel.includes('.test.')) {
    // Run the specific test file
    gates.push({ gate: 'vitest:specific', command: `npx vitest run ${filePath}` });
  } else if (rel.startsWith('state/')) {
    gates.push({ gate: 'vitest:state', command: 'npx vitest run src/state/ src/utils/urlCodec.test.ts' });
  } else if (rel.startsWith('utils/')) {
    gates.push({ gate: 'vitest:utils', command: 'npx vitest run src/utils/' });
  } else if (rel.startsWith('audio/')) {
    gates.push({ gate: 'vitest:audio', command: 'npx vitest run src/audio/' });
  } else if (rel.endsWith('.tsx') || rel.endsWith('.ts')) {
    // For component/hook changes, run all unit tests
    gates.push({ gate: 'vitest:all', command: 'npx vitest run' });
  }

  return gates;
}

// ─── Debounce + run ───────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingFiles: Set<string> = new Set();

function scheduleValidation(filePath: string) {
  pendingFiles.add(filePath);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const files = Array.from(pendingFiles);
    pendingFiles.clear();

    // Merge all gates from all changed files, deduplicate
    const allGates = new Map<string, string>();
    for (const f of files) {
      for (const { gate, command } of gatesForFile(f)) {
        allGates.set(gate, command);
      }
    }

    console.log(`\n⏳ Running ${allGates.size} gate(s) for ${files.length} changed file(s)...`);
    broadcast({
      status: 'running',
      gates: Array.from(allGates.keys()),
      changedFiles: files.map(f => path.relative(SRC_DIR, f)),
      timestamp: new Date().toISOString(),
    });

    const results: GateResult[] = [];
    for (const [gate, command] of allGates) {
      const result = runGate(gate, command);
      results.push(result);
      const icon = result.passed ? '✅' : '❌';
      console.log(`  ${icon} ${gate} (${result.duration_ms}ms)`);
      if (!result.passed && result.error) {
        // Print first 3 lines of error for quick diagnosis
        const errorLines = result.error.split('\n').slice(0, 3).join('\n');
        console.log(`     ${errorLines}`);
      }
    }

    const allPassed = results.every(r => r.passed);
    const totalTime = results.reduce((sum, r) => sum + r.duration_ms, 0);

    broadcast({
      status: allPassed ? 'pass' : 'fail',
      results,
      totalTime_ms: totalTime,
      changedFiles: files.map(f => path.relative(SRC_DIR, f)),
      timestamp: new Date().toISOString(),
    });

    console.log(allPassed
      ? `\n🎉 ALL GATES PASSED (${totalTime}ms)`
      : `\n💥 VALIDATION FAILED (${totalTime}ms)`
    );
  }, 300); // 300ms debounce — collects rapid saves
}

// ─── Watch for changes ────────────────────────────────────────────
const watcher = watch('src/**/*.{ts,tsx,css}', {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
});

watcher.on('change', (filePath) => {
  console.log(`📝 Changed: ${path.relative('.', filePath)}`);
  scheduleValidation(path.resolve(filePath));
});

watcher.on('add', (filePath) => {
  console.log(`➕ Added: ${path.relative('.', filePath)}`);
  scheduleValidation(path.resolve(filePath));
});

console.log('👀 Watching src/ for changes...');
console.log('   Validation runs automatically on every save.');
console.log(`   Status: ws://localhost:${WS_PORT} or .validation-status.json\n`);
```

### 23.3 Additional Dependencies

Add these to `devDependencies` in `package.json`:

```json
{
  "chokidar": "^4.0.0",
  "ws": "^8.18.0",
  "@types/ws": "^8.5.0",
  "tsx": "^4.19.0"
}
```

Add this script to `package.json`:

```json
{
  "scripts": {
    "dev:validate": "tsx scripts/dev-validate.ts",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:validate\""
  }
}
```

Also add `concurrently` to devDependencies:

```json
{
  "concurrently": "^9.0.0"
}
```

### 23.4 .validation-status.json Schema

The watcher writes this file on every validation run. The building agent can read this file programmatically to decide whether to proceed.

```typescript
interface ValidationStatus {
  status: 'running' | 'pass' | 'fail';
  results?: Array<{
    gate: string;         // e.g. 'tsc', 'vitest:state'
    passed: boolean;
    duration_ms: number;
    error?: string;       // first 500 chars of stderr if failed
  }>;
  totalTime_ms?: number;
  changedFiles: string[];  // relative paths
  timestamp: string;       // ISO 8601
}
```

**Example (passing):**

```json
{
  "status": "pass",
  "results": [
    { "gate": "tsc", "passed": true, "duration_ms": 1200 },
    { "gate": "vitest:state", "passed": true, "duration_ms": 450 }
  ],
  "totalTime_ms": 1650,
  "changedFiles": ["state/reducer.ts"],
  "timestamp": "2026-03-17T14:23:01.000Z"
}
```

**Example (failing):**

```json
{
  "status": "fail",
  "results": [
    { "gate": "tsc", "passed": false, "duration_ms": 800, "error": "src/state/reducer.ts(42,7): error TS2322: Type 'string' is not assignable to type 'boolean'." },
    { "gate": "vitest:state", "passed": false, "duration_ms": 320, "error": "FAIL src/state/reducer.test.ts > Reducer > TOGGLE_PAD flips a single step" }
  ],
  "totalTime_ms": 1120,
  "changedFiles": ["state/reducer.ts"],
  "timestamp": "2026-03-17T14:23:45.000Z"
}
```

### 23.5 Agent Integration Protocol

The building agent should use `dev:validate` as follows:

```
1. Start the watcher: `npm run dev:validate &` (background process)
2. Write/edit a source file.
3. Wait 500ms for the debounce + validation to complete.
4. Read `.validation-status.json`.
5. If `status === 'pass'` → proceed to next file.
6. If `status === 'fail'` → read `results[].error` for the first failing gate,
   fix the issue, save the file, and repeat from step 3.
7. After all files in a phase are written, run full `bash scripts/validate.sh`
   as a final gate before proceeding to the next phase.
```

**The agent must never proceed to the next build phase (Section 18) while `.validation-status.json` shows `status: 'fail'`.**

### 23.6 WebSocket Client (Optional: Agent Dev Dashboard)

If the building agent supports real-time WebSocket monitoring, it can connect to `ws://localhost:5174` and receive live validation events. The message format matches the `.validation-status.json` schema. This enables the agent to react to validation failures without polling the file.

```typescript
// Example client (agent-side)
const ws = new WebSocket('ws://localhost:5174');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.status === 'fail') {
    console.error('Validation failed:', data.results.filter(r => !r.passed));
    // Agent can now auto-fix based on error messages
  }
};
```

### 23.7 Gate Routing Matrix

This table shows exactly which validation gates run for each file path pattern:

|File changed                  |Gates triggered                           |Expected total time|
|------------------------------|------------------------------------------|------------------:|
|`src/state/reducer.ts`        |`tsc` + `vitest:state`                    |~1.5s              |
|`src/state/urlCodec.ts`       |`tsc` + `vitest:state`                    |~1.5s              |
|`src/utils/geometry.ts`       |`tsc` + `vitest:utils`                    |~1.2s              |
|`src/utils/parameterCurves.ts`|`tsc` + `vitest:utils`                    |~1.2s              |
|`src/audio/voices.ts`         |`tsc` + `vitest:audio`                    |~1.3s              |
|`src/audio/AudioEngine.ts`    |`tsc` + `vitest:audio`                    |~1.3s              |
|`src/components/*.tsx`        |`tsc` + `vitest:all`                      |~2.5s              |
|`src/hooks/*.ts`              |`tsc` + `vitest:all`                      |~2.5s              |
|`src/constants.ts`            |`tsc` + `vitest:all`                      |~2.5s              |
|`src/types.ts`                |`tsc` + `vitest:all`                      |~2.5s              |
|`src/styles/global.css`       |(none — CSS-only changes skip gates)      |0s                 |
|`src/**/*.test.ts`            |`tsc` + `vitest:specific` (just that file)|~1.0s              |
|Multiple files at once        |Merged + deduplicated gates               |varies             |

### 23.8 Updated Project File Tree

The following files are added to the project structure from Section 3:

```
orbit/
├── scripts/
│   ├── validate.sh               (existing — full validation)
│   └── dev-validate.ts           (NEW — hot-reload watcher)
├── .validation-status.json       (NEW — auto-generated, gitignored)
└── ... (all other files unchanged)
```

Add `.validation-status.json` to `.gitignore`:

```
# .gitignore
node_modules/
dist/
.validation-status.json
```

### 23.9 Updated package.json Scripts

The full scripts block now becomes:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:validate": "tsx scripts/dev-validate.ts",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:validate\"",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "validate": "bash scripts/validate.sh",
    "lint": "tsc --noEmit"
  }
}
```

### 23.10 Updated Build Order (replaces Section 18 preamble)

When using hot-reload validation, the agent’s workflow for each phase becomes:

```
1. Run `npm run dev:full` once at the start of each phase.
   This starts both Vite dev server and the validation watcher.

2. For each file to create/edit:
   a. Write the file.
   b. Wait for .validation-status.json to update (poll every 500ms, timeout 10s).
   c. If status === 'pass' → proceed to next file.
   d. If status === 'fail' → read the error, fix, save, repeat from (b).
   e. If timeout → run `npx tsc --noEmit` manually to diagnose.

3. After all files in the phase are written and all hot-reload validations pass:
   a. Kill the dev server.
   b. Run `bash scripts/validate.sh` (full validation including build + e2e).
   c. Only proceed to next phase on exit code 0.
```

This cuts the feedback loop from ~30s (full validate.sh) to ~1.5s per file change during active development, while still maintaining the full validation gate between phases.
