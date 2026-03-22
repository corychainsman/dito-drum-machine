import { AppState, LayoutParams, Pattern, PatternRow, Faders, StepSounds, StepSoundRow } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM, DEFAULT_LAYOUT, DEFAULT_LAYOUT_HEX, SOLO_SOUND_COUNT } from '../constants';

// ─── Layout encoding helpers ──────────────────────────────────────
// Angles (0-360°) encoded as one byte (0x00-0xFF)
// Radius (0-100%) encoded as one byte (0x00-0xFF)

function encodeAngle(deg: number): string {
  // Guard against NaN/Infinity before clamping (Math.min/max propagate NaN)
  const safe = isFinite(deg) ? Math.max(0, Math.min(360, deg)) : 0;
  return Math.round((safe / 360) * 255).toString(16).padStart(2, '0');
}

function encodeRadius(pct: number): string {
  const safe = isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  return Math.round((safe / 100) * 255).toString(16).padStart(2, '0');
}

function decodeAngle(hex: string): number {
  // Round to nearest integer so Tweakpane (step:1) starts without a phantom jump
  return Math.round((parseInt(hex, 16) / 255) * 360);
}

function decodeRadius(hex: string): number {
  return Math.round((parseInt(hex, 16) / 255) * 100);
}

export function layoutToHex(l: LayoutParams): string {
  return (
    encodeAngle(l.stepsStart) +
    encodeAngle(l.stepsGap) +
    encodeRadius(l.stepsRadius) +
    encodeAngle(l.slidersStart) +
    encodeAngle(l.slidersGap) +
    encodeRadius(l.slidersRadius) +
    encodeAngle(l.buttonsStart) +
    encodeAngle(l.buttonsGap) +
    encodeRadius(l.buttonsRadius)
  );
}

export function hexToLayout(hex: string): LayoutParams | null {
  if (!/^[0-9a-fA-F]{18}$/.test(hex)) return null;
  return {
    stepsStart:    decodeAngle(hex.slice(0, 2)),
    stepsGap:      decodeAngle(hex.slice(2, 4)),
    stepsRadius:   decodeRadius(hex.slice(4, 6)),
    slidersStart:  decodeAngle(hex.slice(6, 8)),
    slidersGap:    decodeAngle(hex.slice(8, 10)),
    slidersRadius: decodeRadius(hex.slice(10, 12)),
    buttonsStart:  decodeAngle(hex.slice(12, 14)),
    buttonsGap:    decodeAngle(hex.slice(14, 16)),
    buttonsRadius: decodeRadius(hex.slice(16, 18)),
  };
}

export function getInitialLayout(): LayoutParams {
  const params = new URLSearchParams(window.location.search);
  const l = params.get('l');
  if (l) {
    const parsed = hexToLayout(l);
    if (parsed) return parsed;
  }
  return { ...DEFAULT_LAYOUT };
}

// ─── Main state codec ─────────────────────────────────────────────

export function stateToURL(state: AppState, layout: LayoutParams): string {
  const p = state.pattern
    .map(ring => ring.reduce((byte, armed, i) => byte | (armed ? 1 << i : 0), 0))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  const f = state.faders
    .map(v => Math.round(v * 15).toString(16))
    .join('');

  // Hex encoding gives headroom for up to 15 variants per step without a format change.
  const s = state.stepSounds
    .map(row => row.map(v => v.toString(16)).join(''))
    .join('');
  const isDefaultStepSounds = s === '0'.repeat(NUM_RINGS * NUM_STEPS);

  const lHex = layoutToHex(layout);
  const isDefaultLayout = lHex.toLowerCase() === DEFAULT_LAYOUT_HEX.toLowerCase();

  return `?p=${p}&f=${f}&t=${state.bpm}` +
    (isDefaultStepSounds ? '' : `&s=${s}`) +
    (isDefaultLayout ? '' : `&l=${lHex}`);
}

export function urlToState(search: string): Partial<AppState> | null {
  const params = new URLSearchParams(search);
  const p = params.get('p');
  const f = params.get('f');
  const t = params.get('t');

  if (!p || !f || !t) return null;

  // Validate pattern: exactly 2 hex chars per ring
  if (!new RegExp(`^[0-9a-fA-F]{${NUM_RINGS * 2}}$`).test(p)) return null;

  // Validate faders: exactly 1 hex char per ring
  if (!new RegExp(`^[0-9a-fA-F]{${NUM_RINGS}}$`).test(f)) return null;

  // Validate tempo
  if (!/^\d+$/.test(t)) return null;

  const bpm = Number(t);
  if (isNaN(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) return null;

  // Parse pattern
  const patternRows: PatternRow[] = [];
  for (let r = 0; r < NUM_RINGS; r++) {
    const byte = parseInt(p.substring(r * 2, r * 2 + 2), 16);
    const row = Array.from({ length: NUM_STEPS }, (_, i) =>
      Boolean(byte & (1 << i))
    ) as PatternRow;
    patternRows.push(row);
  }
  const pattern = patternRows as Pattern;

  // Parse faders
  const faders = Array.from({ length: NUM_RINGS }, (_, i) =>
    parseInt(f[i], 16) / 15
  ) as Faders;

  // Parse stepSounds (optional — absent means all-zero defaults)
  // Validate as generic hex chars; clamp decoded values to [0, SOLO_SOUND_COUNT-1]
  // so the codec stays correct even if SOLO_SOUND_COUNT changes.
  const sParam = params.get('s');
  let stepSounds: StepSounds | undefined;
  if (sParam && new RegExp(`^[0-9a-fA-F]{${NUM_RINGS * NUM_STEPS}}$`).test(sParam)) {
    const soundRows: StepSoundRow[] = [];
    for (let r = 0; r < NUM_RINGS; r++) {
      const row = Array.from({ length: NUM_STEPS }, (_, i) => {
        const v = parseInt(sParam[r * NUM_STEPS + i], 16);
        return Math.min(v, SOLO_SOUND_COUNT - 1);
      }) as StepSoundRow;
      soundRows.push(row);
    }
    stepSounds = soundRows as StepSounds;
  }

  return { pattern, faders, bpm, ...(stepSounds && { stepSounds }) };
}
