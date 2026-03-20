/**
 * Generate synthetic audio samples using OfflineAudioContext.
 * Called once during AudioEngine.init().
 * Returns a Map of sample name → AudioBuffer.
 */
export async function generateSamples(sampleRate: number): Promise<Map<string, AudioBuffer>> {
  const samples = new Map<string, AudioBuffer>();

  // ─── CLAP: multiple short noise bursts with slight delays ───────
  {
    const duration = 0.3;
    const offCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

    // 3 overlapping noise bursts at 0ms, 15ms, 30ms
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

    samples.set('clap', await offCtx.startRendering());
  }

  return samples;
}
