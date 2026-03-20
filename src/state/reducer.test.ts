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

  it('TOGGLE_PAD latches step sound when activating', () => {
    let state = getInitialState();
    if (state.pattern[0][1]) {
      state = reducer(state, { type: 'TOGGLE_PAD', ring: 0, step: 1 });
    }

    const activated = reducer(state, { type: 'TOGGLE_PAD', ring: 0, step: 1, soundIndex: 4 });
    expect(activated.pattern[0][1]).toBe(true);
    expect(activated.stepSounds[0][1]).toBe(4);
  });

  it('TOGGLE_PAD only updates latched sound after deactivate/reactivate', () => {
    let state = getInitialState();
    if (state.pattern[1][3]) {
      state = reducer(state, { type: 'TOGGLE_PAD', ring: 1, step: 3 });
    }

    const firstActivation = reducer(state, { type: 'TOGGLE_PAD', ring: 1, step: 3, soundIndex: 1 });
    expect(firstActivation.stepSounds[1][3]).toBe(1);

    const deactivated = reducer(firstActivation, { type: 'TOGGLE_PAD', ring: 1, step: 3 });
    expect(deactivated.pattern[1][3]).toBe(false);

    const reactivated = reducer(deactivated, { type: 'TOGGLE_PAD', ring: 1, step: 3, soundIndex: 3 });
    expect(reactivated.pattern[1][3]).toBe(true);
    expect(reactivated.stepSounds[1][3]).toBe(3);
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

  it('SET_CURRENT_STEP sets step directly and wraps', () => {
    let state = reducer(getInitialState(), { type: 'SET_CURRENT_STEP', step: 3 });
    expect(state.currentStep).toBe(3);

    state = reducer(state, { type: 'SET_CURRENT_STEP', step: 10 });
    expect(state.currentStep).toBe(2);
  });

  it('SET_FADER clamps to 0–1', () => {
    const state = reducer(getInitialState(), { type: 'SET_FADER', ring: 0, value: 1.5 });
    expect(state.faders[0]).toBe(1.0);
    const state2 = reducer(getInitialState(), { type: 'SET_FADER', ring: 0, value: -0.3 });
    expect(state2.faders[0]).toBe(0.0);
  });
});
