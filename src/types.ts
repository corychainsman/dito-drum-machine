import { VOICE_NAMES } from './constants';

export type VoiceName = typeof VOICE_NAMES[number];

export type PatternRow = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type Pattern = [PatternRow, PatternRow, PatternRow, PatternRow];
export type StepSoundRow = [number, number, number, number, number, number, number, number];
export type StepSounds = [StepSoundRow, StepSoundRow, StepSoundRow, StepSoundRow];
export type Faders = [number, number, number, number]; // each 0.0–1.0

export type Transport = 'uninitialized' | 'stopped' | 'playing';

export interface AppState {
  pattern: Pattern;
  stepSounds: StepSounds;
  faders: Faders;
  bpm: number;
  transport: Transport;
  currentStep: number;
  repeatActive: boolean;
}

export type Action =
  | { type: 'TOGGLE_PAD'; ring: number; step: number; soundIndex?: number }
  | { type: 'SET_FADER'; ring: number; value: number }
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'RANDOMIZE' }
  | { type: 'PLAY' }
  | { type: 'STOP' }
  | { type: 'SET_REPEAT'; active: boolean }
  | { type: 'SET_CURRENT_STEP'; step: number }
  | { type: 'ADVANCE_STEP' }
  | { type: 'HYDRATE'; state: Partial<AppState> };

export interface LayoutParams {
  // Sequencer step circles
  stepsStart: number;   // degrees 0-360, where first step is placed
  stepsGap: number;     // degrees 0-360, angular spacing between steps
  stepsRadius: number;  // 0-100, percent of SVG half-size (200px) for outer ring

  // Fader sliders
  slidersStart: number;  // degrees 0-360
  slidersGap: number;    // degrees 0-360
  slidersRadius: number; // 0-100, percent of SVG half-size

  // Action buttons (random, repeat, tempo)
  buttonsStart: number;  // degrees 0-360
  buttonsGap: number;    // degrees 0-360
  buttonsRadius: number; // 0-100, percent of SVG half-size
}

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
