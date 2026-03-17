import { AppState, LayoutParams, Pattern, PatternRow, Faders } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM, DEFAULT_LAYOUT, DEFAULT_LAYOUT_HEX } from '../constants';

// ─── Layout encoding helpers ──────────────────────────────────────
// Angles (0-360°) encoded as one byte (0x00-0xFF)
// Radius (0-100%) encoded as one byte (0x00-0xFF)

function encodeAngle(deg: number): string {
  return Math.round((Math.max(0, Math.min(360, deg)) / 360) * 255)
    .toString(16).padStart(2, '0');
}

function encodeRadius(pct: number): string {
  return Math.round((Math.max(0, Math.min(100, pct)) / 100) * 255)
    .toString(16).padStart(2, '0');
}

function decodeAngle(hex: string): number {
  return (parseInt(hex, 16) / 255) * 360;
}

function decodeRadius(hex: string): number {
  return (parseInt(hex, 16) / 255) * 100;
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

  const lHex = layoutToHex(layout);
  const isDefaultLayout = lHex.toLowerCase() === DEFAULT_LAYOUT_HEX.toLowerCase();

  return `?p=${p}&f=${f}&t=${state.bpm}` + (isDefaultLayout ? '' : `&l=${lHex}`);
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
  if (!/^\d+$/.test(t)) return null;

  const bpm = Number(t);
  if (isNaN(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) return null;

  // Parse pattern
  const pattern: Pattern = [] as unknown as Pattern;
  for (let r = 0; r < NUM_RINGS; r++) {
    const byte = parseInt(p.substring(r * 2, r * 2 + 2), 16);
    const row = Array.from({ length: NUM_STEPS }, (_, i) =>
      Boolean(byte & (1 << i))
    ) as PatternRow;
    (pattern as PatternRow[]).push(row);
  }

  // Parse faders
  const faders = Array.from({ length: NUM_RINGS }, (_, i) =>
    parseInt(f[i], 16) / 15
  ) as Faders;

  return { pattern, faders, bpm };
}
