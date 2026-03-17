import { VOICE_PARAMS } from '../constants';

/**
 * Map a fader value (0.0–1.0) into a parameter range [min, default, max].
 * fader=0.0 → min, fader=0.5 → default, fader=1.0 → max.
 * Uses linear interpolation within each half.
 */
export function mapParam(fader: number, range: readonly [number, number, number]): number {
  const [min, def, max] = range;
  if (fader <= 0.5) {
    return min + (def - min) * (fader / 0.5);
  } else {
    return def + (max - def) * ((fader - 0.5) / 0.5);
  }
}

// ─── KICK ─────────────────────────────────────────────────────────
export function triggerKick(
  ctx: AudioContext, time: number, fader: number
): void {
  const freq = mapParam(fader, VOICE_PARAMS.kick.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.kick.decay);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay + 0.01);
}

// ─── SNARE ────────────────────────────────────────────────────────
export function triggerSnare(
  ctx: AudioContext, time: number, fader: number
): void {
  const freq = mapParam(fader, VOICE_PARAMS.snare.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.snare.decay);
  const filterFreq = mapParam(fader, VOICE_PARAMS.snare.filter);

  // Noise component
  const bufferSize = ctx.sampleRate * Math.max(decay, 0.1);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(filterFreq, time);
  bandpass.Q.setValueAtTime(1.5, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(time);
  noise.stop(time + decay + 0.01);

  // Sine transient
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  oscGain.gain.setValueAtTime(0.7, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.04);
}

// ─── HI-HAT ──────────────────────────────────────────────────────
export function triggerHihat(
  ctx: AudioContext, time: number, fader: number
): void {
  const cutoff = mapParam(fader, VOICE_PARAMS.hihat.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.hihat.decay);
  const q = mapParam(fader, VOICE_PARAMS.hihat.filter);

  const bufferSize = ctx.sampleRate * Math.max(decay, 0.05);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(cutoff, time);
  hpf.Q.setValueAtTime(q, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  noise.connect(hpf);
  hpf.connect(gain);
  gain.connect(ctx.destination);
  noise.start(time);
  noise.stop(time + decay + 0.01);
}

// ─── CLAP ─────────────────────────────────────────────────────────
export function triggerClap(
  ctx: AudioContext, time: number, fader: number,
  sampleBuffers: Map<string, AudioBuffer>
): void {
  const rate = mapParam(fader, VOICE_PARAMS.clap.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.clap.decay);
  const filterFreq = mapParam(fader, VOICE_PARAMS.clap.filter);

  const buffer = sampleBuffers.get('clap');
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(rate, time);

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(filterFreq, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  source.connect(lpf);
  lpf.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
}

// ─── TOM ──────────────────────────────────────────────────────────
export function triggerTom(
  ctx: AudioContext, time: number, fader: number,
  sampleBuffers: Map<string, AudioBuffer>
): void {
  const freq = mapParam(fader, VOICE_PARAMS.tom.pitch);
  const decay = mapParam(fader, VOICE_PARAMS.tom.decay);
  const filterFreq = mapParam(fader, VOICE_PARAMS.tom.filter);

  // Sine body
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  const lpf = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, time + decay);
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(filterFreq, time);
  oscGain.gain.setValueAtTime(0.8, time);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  osc.connect(lpf);
  lpf.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + decay + 0.01);

  // Attack texture layer (sample)
  const buffer = sampleBuffers.get('tom_attack');
  if (buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    src.connect(g);
    g.connect(ctx.destination);
    src.start(time);
  }
}
