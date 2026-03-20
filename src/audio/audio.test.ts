import { describe, it, expect } from 'vitest';
import { mapLeadSemitoneOffset, mapParam } from './voices';

describe('Voice parameter mapping', () => {
  it('maps fader 0.0 to min values', () => {
    expect(mapParam(0.0, [80, 150, 250])).toBe(80);
  });

  it('maps fader 0.5 to default values', () => {
    expect(mapParam(0.5, [80, 150, 250])).toBe(150);
  });

  it('maps fader 1.0 to max values', () => {
    expect(mapParam(1.0, [80, 150, 250])).toBe(250);
  });

  it('interpolates linearly in lower half', () => {
    expect(mapParam(0.25, [80, 150, 250])).toBe(115);
  });

  it('interpolates linearly in upper half', () => {
    expect(mapParam(0.75, [80, 150, 250])).toBe(200);
  });
});

describe('Lead semitone mapping', () => {
  it('maps fader bottom to -12 semitones', () => {
    expect(mapLeadSemitoneOffset(0)).toBe(-12);
  });

  it('maps fader center to original pitch (0 semitones)', () => {
    expect(mapLeadSemitoneOffset(0.5)).toBe(0);
  });

  it('maps fader top to +12 semitones', () => {
    expect(mapLeadSemitoneOffset(1)).toBe(12);
  });

  it('quantizes quarter points to chromatic intervals', () => {
    expect(mapLeadSemitoneOffset(0.25)).toBe(-6);
    expect(mapLeadSemitoneOffset(0.75)).toBe(6);
  });
});

// OfflineAudioContext is not available in jsdom — skip sample generation tests.
// These are validated in the browser via Playwright transport.spec.ts.
describe.skip('Sample generation (browser-only)', () => {
  it('generates a clap sample with non-zero audio data', async () => {
    const sampleRate = 44100;
    const duration = 0.3;
    const offCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    for (const offset of [0, 0.015, 0.030]) {
      const buf = offCtx.createBuffer(1, sampleRate * 0.04, sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = offCtx.createBufferSource();
      src.buffer = buf;
      const bpf = offCtx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2000;
      bpf.Q.value = 0.8;
      const gain = offCtx.createGain();
      gain.gain.setValueAtTime(0.8, offset);
      gain.gain.exponentialRampToValueAtTime(0.001, offset + 0.08);
      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(offCtx.destination);
      src.start(offset);
    }

    const buffer = await offCtx.startRendering();
    const data = buffer.getChannelData(0);
    const maxAmplitude = Math.max(...Array.from(data).map(Math.abs));
    expect(maxAmplitude).toBeGreaterThan(0.01);
    expect(buffer.duration).toBeCloseTo(0.3, 1);
  });

});
