import { describe, it, expect } from 'vitest';
import { stateToURL, urlToState } from '../state/urlCodec';
import { getInitialState } from '../state/reducer';
import { AppState, Pattern, Faders } from '../types';
import { DEFAULT_LAYOUT } from '../constants';

describe('URL Codec round-trip', () => {
  it('round-trips the default pattern', () => {
    const state = getInitialState(); // with no URL params
    const url = stateToURL(state, DEFAULT_LAYOUT);
    const parsed = urlToState(url);
    expect(parsed).not.toBeNull();
    expect(parsed!.pattern).toEqual(state.pattern);
    expect(parsed!.bpm).toBe(state.bpm);
    parsed!.faders!.forEach((f, i) => {
      // Faders lose precision (quantized to 4 bits), so check within tolerance
      expect(Math.abs(f - state.faders[i])).toBeLessThan(0.07);
    });
  });

  it('round-trips all-on pattern', () => {
    const allOn: Pattern = Array(4).fill(Array(8).fill(true)) as Pattern;
    const state = { pattern: allOn, faders: [1,1,1,1] as Faders, bpm: 200 } as AppState;
    const url = stateToURL(state, DEFAULT_LAYOUT);
    expect(url).toBe('?p=ffffffff&f=ffff&t=200');
    const parsed = urlToState(url);
    expect(parsed!.pattern!.every(row => row.every(Boolean))).toBe(true);
  });

  it('round-trips all-off pattern', () => {
    const allOff: Pattern = Array(4).fill(Array(8).fill(false)) as Pattern;
    const state = { pattern: allOff, faders: [0,0,0,0] as Faders, bpm: 40 } as AppState;
    const url = stateToURL(state, DEFAULT_LAYOUT);
    expect(url).toBe('?p=00000000&f=0000&t=40');
  });

  it('rejects malformed URLs', () => {
    expect(urlToState('?p=ZZ&f=0000&t=100')).toBeNull(); // p too short
    expect(urlToState('?p=00000000&f=000&t=100')).toBeNull(); // f too short
    expect(urlToState('?p=00000000&f=0000&t=999')).toBeNull(); // bpm out of range
    expect(urlToState('')).toBeNull(); // empty
    expect(urlToState('?garbage=true')).toBeNull(); // wrong params
  });

  it('rejects tempo values containing non-digit suffixes', () => {
    expect(urlToState('?p=00000000&f=0000&t=100abc')).toBeNull();
  });

  it('encodes default pattern to expected hex', () => {
    // kick: 0,2,4,6 = bits 0,2,4,6 = 0b01010101 = 0x55
    // snare: 2,6 = bits 2,6 = 0b01000100 = 0x44
    // hihat: all = 0xFF
    // clap: none = 0x00
    const state = { ...getInitialState(), transport: 'stopped' as const };
    const url = stateToURL(state, DEFAULT_LAYOUT);
    expect(url).toContain('p=5544ff00');
  });
});
