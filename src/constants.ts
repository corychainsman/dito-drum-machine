import type { LayoutParams } from './types';

// ─── Layout ───────────────────────────────────────────────────────
export const NUM_RINGS = 4;
export const NUM_STEPS = 8;

// Radii of each step-circle ring in the SVG faceplate (outermost to innermost),
// derived from the positions in dito-v1.svg.
export const STEP_BASE_RADII = [184, 139, 94, 49] as const;

// ─── Colors ───────────────────────────────────────────────────────
export const RING_COLORS = [
  '#FF6B6B', // Kick: coral red
  '#FFD93D', // Snare: warm yellow
  '#6BCB77', // Hi-hat: lime green
  '#4D96FF', // Clap: sky blue
] as const;

export const VOICE_NAMES = ['kick', 'snare', 'hihat', 'clap'] as const;
export const SOLO_SOUND_COUNT = 5;

// ─── Audio ────────────────────────────────────────────────────────
export const SCHEDULER_LOOKAHEAD_MS = 25;
export const SCHEDULER_AHEAD_S = 0.2; // 200ms — gives room if iOS throttles setTimeout beyond 100ms
export const DEFAULT_BPM = 100;
export const MIN_BPM = 25;
export const MAX_BPM = 220;
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
} as const;

// ─── Random pattern probabilities per ring ────────────────────────
export const RANDOM_PROBABILITIES = [0.30, 0.20, 0.50, 0.15];

// ─── Repeat ───────────────────────────────────────────────────────
export const REPEAT_SUBDIVISION = 4; // 4× speed stutter

// ─── Default starter pattern (bitmasks) ───────────────────────────
// Kick: steps 0,2,4,6 (four-on-the-floor) = 0b01010101 = 0x55
// Snare: steps 2,6 (backbeat) = 0b01000100 = 0x44
// Hi-hat: all 8 = 0xFF
// Clap: empty = 0x00
export const DEFAULT_PATTERN_HEX = '5544FF00';
export const DEFAULT_FADERS_HEX = '8888';
export const DEFAULT_BPM_VALUE = 100;

// ─── Layout defaults ──────────────────────────────────────────────
// Each param encoded as 2 hex digits in this order:
//   stepsStart, stepsGap, stepsRadius,
//   slidersStart, slidersGap, slidersRadius,
//   buttonsStart, buttonsGap, buttonsRadius
// Angles (0-360°) → 0x00-0xFF; Radius (0-100%) → 0x00-0xFF
export const DEFAULT_LAYOUT: LayoutParams = {
  stepsStart: 270,   // 12 o'clock
  stepsGap: 45,      // 360° / 8 steps
  stepsRadius: 76,   // outer ring at 152 SVG units (76% of 200)

  slidersStart: 202, // approx -158°, matches legacy FADER_ANGLES[0]
  slidersGap: 72,    // legacy spacing for the 4 visible sliders
  slidersRadius: 37, // 74 SVG units (37% of 200)

  buttonsStart: 135, // bottom-left area
  buttonsGap: 90,    // 3 buttons at 135°, 225°, 315°
  buttonsRadius: 76, // same distance as outer ring
};
// Pre-encoded: BF20C28F335E6040C2
export const DEFAULT_LAYOUT_HEX = 'BF20C28F335E6040C2';

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
export const HAPTIC_SOLO = 8;
export const HAPTIC_RANDOM = [30, 20, 30];
