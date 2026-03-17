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

// ─── Layout defaults ──────────────────────────────────────────────
// Each param encoded as 2 hex digits in this order:
//   stepsStart, stepsGap, stepsRadius,
//   slidersStart, slidersGap, slidersRadius,
//   buttonsStart, buttonsGap, buttonsRadius
// Angles (0-360°) → 0x00-0xFF; Radius (0-100%) → 0x00-0xFF
export const DEFAULT_LAYOUT: import('./types').LayoutParams = {
  stepsStart: 270,   // 12 o'clock
  stepsGap: 45,      // 360° / 8 steps
  stepsRadius: 76,   // outer ring at 152 SVG units (76% of 200)

  slidersStart: 202, // approx -158°, matches legacy FADER_ANGLES[0]
  slidersGap: 72,    // 360° / 5 sliders
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
export const HAPTIC_RANDOM = [30, 20, 30, 20, 30];
export const HAPTIC_REPEAT = 10;
