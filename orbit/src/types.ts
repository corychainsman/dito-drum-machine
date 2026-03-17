import { VOICE_NAMES } from './constants';

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
