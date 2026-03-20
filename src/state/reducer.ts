import { AppState, Action, Pattern, PatternRow, Faders } from '../types';
import { NUM_RINGS, NUM_STEPS, RANDOM_PROBABILITIES, MIN_BPM, MAX_BPM, DEFAULT_BPM } from '../constants';
import { urlToState } from './urlCodec';

export function createDefaultPattern(): Pattern {
  // Default: kick on 0,2,4,6; snare on 2,6; hihat all; clap none
  return [
    [true, false, true, false, true, false, true, false],   // kick
    [false, false, true, false, false, false, true, false],  // snare
    [true, true, true, true, true, true, true, true],        // hihat
    [false, false, false, false, false, false, false, false], // clap
  ] as Pattern;
}

export function getInitialState(): AppState {
  // Try to hydrate from URL
  const fromUrl = urlToState(window.location.search);
  return {
    pattern: fromUrl?.pattern ?? createDefaultPattern(),
    faders: fromUrl?.faders ?? [0.5, 0.5, 0.5, 0.5] as Faders,
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
