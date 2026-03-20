import { describe, it, expect } from 'vitest';
import { reducer, getInitialState } from './reducer';

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
    expect(state.bpm).toBe(220);
    const state2 = reducer(getInitialState(), { type: 'SET_BPM', bpm: 1 });
    expect(state2.bpm).toBe(25);
  });

  it('SET_BPM rounds to integer BPM', () => {
    const state = reducer(getInitialState(), { type: 'SET_BPM', bpm: 101.6 });
    expect(state.bpm).toBe(102);
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
