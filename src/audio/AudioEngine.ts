import { Pattern, Faders, StepSounds } from '../types';
import {
  NUM_RINGS, NUM_STEPS,
  SCHEDULER_LOOKAHEAD_MS, SCHEDULER_AHEAD_S,
  REPEAT_SUBDIVISION, SOLO_SOUND_COUNT,
} from '../constants';
import {
  triggerKick, triggerSnare, triggerHihat, triggerLead,
} from './voices';

type SoloCategory = 'cymbal' | 'kick' | 'snare' | 'lead';

const SOLO_SLOT_CATEGORIES: SoloCategory[] = ['cymbal', 'kick', 'snare', 'lead'];
const SOLO_VARIANT_FADERS = {
  kick: [0.1, 0.3, 0.5, 0.7, 0.9] as const,
  snare: [0.15, 0.35, 0.5, 0.7, 0.88] as const,
  cymbal: [0.2, 0.4, 0.55, 0.72, 0.9] as const,
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeIndex(value: number, size: number): number {
  return ((Math.round(value) % size) + size) % size;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private initPromise: Promise<void> | null = null;
  private schedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private isPlaying: boolean = false;

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
    getStepSounds: () => StepSounds,
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

    this.schedulerLoop(getBpm, getPattern, getStepSounds, getFaders, getRepeatActive, onStepChange);
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

  triggerSoloSlotSound(slotIndex: number, soundIndex: number, fader: number): void {
    if (!this.ctx) return;
    this.triggerSlotSoundAtTime(slotIndex, soundIndex, this.ctx.currentTime + 0.005, fader);
  }

  private triggerSlotSoundAtTime(slotIndex: number, soundIndex: number, time: number, fader: number): void {
    if (!this.ctx) return;

    const safeSlot = Math.max(0, Math.min(SOLO_SLOT_CATEGORIES.length - 1, Math.round(slotIndex)));
    const safeSoundIndex = normalizeIndex(soundIndex, SOLO_SOUND_COUNT);
    const safeFader = clamp01(fader);
    const category = SOLO_SLOT_CATEGORIES[safeSlot];

    switch (category) {
      case 'kick': {
        const variantFader = SOLO_VARIANT_FADERS.kick[safeSoundIndex];
        triggerKick(this.ctx, time, clamp01((safeFader + variantFader) / 2));
        if (safeSoundIndex >= 3) {
          triggerKick(this.ctx, time + 0.045, clamp01(variantFader * 0.8));
        }
        break;
      }

      case 'snare': {
        const variantFader = SOLO_VARIANT_FADERS.snare[safeSoundIndex];
        triggerSnare(this.ctx, time, clamp01((safeFader + variantFader) / 2));
        if (safeSoundIndex === 4) {
          triggerSnare(this.ctx, time + 0.03, clamp01(variantFader * 0.6));
        }
        break;
      }

      case 'cymbal': {
        const variantFader = SOLO_VARIANT_FADERS.cymbal[safeSoundIndex];
        triggerHihat(this.ctx, time, clamp01((safeFader + variantFader) / 2));
        if (safeSoundIndex >= 2) {
          triggerHihat(this.ctx, time + 0.02, clamp01(variantFader * 0.7));
        }
        break;
      }

      case 'lead':
        triggerLead(this.ctx, time, safeSoundIndex, safeFader);
        break;
    }
  }

  private schedulerLoop(
    getBpm: () => number,
    getPattern: () => Pattern,
    getStepSounds: () => StepSounds,
    getFaders: () => Faders,
    getRepeatActive: () => boolean,
    onStepChange: (step: number) => void
  ): void {
    const schedule = () => {
      if (!this.ctx || !this.isPlaying) return;

      const bpm = getBpm();
      const secondsPerStep = 60.0 / bpm / 2; // 8th-note grid
      const pattern = getPattern();
      const stepSounds = getStepSounds();
      const faders = getFaders();
      const repeatActive = getRepeatActive();

      // Update loop duration whenever bpm changes
      this.loopDuration = secondsPerStep * NUM_STEPS;

      while (this.nextStepTime < this.ctx.currentTime + SCHEDULER_AHEAD_S) {
        // Schedule all armed voices at this step
        for (let ring = 0; ring < NUM_RINGS; ring++) {
          if (pattern[ring][this.currentStep]) {
            this.triggerSlotSoundAtTime(ring, stepSounds[ring][this.currentStep], this.nextStepTime, faders[ring]);
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
