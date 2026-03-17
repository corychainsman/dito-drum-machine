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
