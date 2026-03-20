import { Pattern, Faders } from '../types';
import {
  NUM_RINGS, NUM_STEPS,
  SCHEDULER_LOOKAHEAD_MS, SCHEDULER_AHEAD_S,
  REPEAT_SUBDIVISION,
} from '../constants';
import {
  triggerKick, triggerSnare, triggerHihat, triggerClap,
} from './voices';
import { generateSamples } from './sampleGeneration';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private initPromise: Promise<void> | null = null;
  private schedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();

  // Exposed for useAnimationFrame
  loopStartTime: number = 0;
  loopDuration: number = 0;

  /**
   * Called on first user interaction. MUST be called inside a
   * pointerdown/click handler for iOS compatibility.
   * Returns the same in-flight promise if called while init is running,
   * preventing the race where start() fires before ctx.resume() resolves.
   */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    // Load samples in the background so start() can fire as soon as ctx is
    // ready. Kick/snare/hihat are pure synthesis and need no sample buffers;
    // clap will be silent until buffers arrive (or if generation fails).
    generateSamples(this.ctx.sampleRate)
      .then(buffers => { this.sampleBuffers = buffers; })
      .catch(() => { /* clap silent; core drums still work */ });
    this.setupVisibilityHandling();
  }

  private setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.ctx?.suspend();
      } else {
        this.ctx?.resume();
      }
    });
  }

  start(
    getBpm: () => number,
    getPattern: () => Pattern,
    getFaders: () => Faders,
    getRepeatActive: () => boolean,
    onStepChange: (step: number) => void
  ): void {
    if (!this.ctx) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    // Store loop metadata for playhead animation
    const bpm = getBpm();
    const secondsPerStep = 60.0 / bpm / 2;
    this.loopDuration = secondsPerStep * NUM_STEPS;
    this.loopStartTime = this.nextStepTime;

    this.schedulerLoop(getBpm, getPattern, getFaders, getRepeatActive, onStepChange);
  }

  stop(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  getCtx(): AudioContext | null {
    return this.ctx;
  }

  private triggerVoice(ring: number, time: number, fader: number): void {
    if (!this.ctx) return;
    switch (ring) {
      case 0: triggerKick(this.ctx, time, fader); break;
      case 1: triggerSnare(this.ctx, time, fader); break;
      case 2: triggerHihat(this.ctx, time, fader); break;
      case 3: triggerClap(this.ctx, time, fader, this.sampleBuffers); break;
    }
  }

  private schedulerLoop(
    getBpm: () => number,
    getPattern: () => Pattern,
    getFaders: () => Faders,
    getRepeatActive: () => boolean,
    onStepChange: (step: number) => void
  ): void {
    const schedule = () => {
      if (!this.ctx || !this.isPlaying) return;

      const bpm = getBpm();
      const secondsPerStep = 60.0 / bpm / 2; // 8th-note grid
      const pattern = getPattern();
      const faders = getFaders();
      const repeatActive = getRepeatActive();

      // Update loop duration whenever bpm changes
      this.loopDuration = secondsPerStep * NUM_STEPS;

      while (this.nextStepTime < this.ctx.currentTime + SCHEDULER_AHEAD_S) {
        // Schedule all armed voices at this step
        for (let ring = 0; ring < NUM_RINGS; ring++) {
          if (pattern[ring][this.currentStep]) {
            this.triggerVoice(ring, this.nextStepTime, faders[ring]);
          }
        }

        onStepChange(this.currentStep);

        if (repeatActive) {
          // Don't advance step — re-trigger at subdivided rate
          this.nextStepTime += secondsPerStep / REPEAT_SUBDIVISION;
        } else {
          this.nextStepTime += secondsPerStep;
          this.currentStep = (this.currentStep + 1) % NUM_STEPS;
        }
      }

      this.schedulerTimer = window.setTimeout(schedule, SCHEDULER_LOOKAHEAD_MS);
    };

    schedule();
  }
}
