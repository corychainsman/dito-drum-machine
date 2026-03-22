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

// iOS Safari defines a non-standard 'interrupted' AudioContextState not in the W3C spec.
const IOS_INTERRUPTED = 'interrupted' as AudioContextState;

/**
 * Resume the AudioContext if it is suspended or in the iOS-specific
 * 'interrupted' state. Safe to call unconditionally — no-ops when running.
 */
function resumeIfNeeded(ctx: AudioContext): void {
  if (ctx.state === 'suspended' || ctx.state === IOS_INTERRUPTED) {
    ctx.resume();
  }
}

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
  private schedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private keepAliveNode: OscillatorNode | null = null;
  private kickoffTimer: number | null = null;

  // Exposed for useAnimationFrame
  loopStartTime: number = 0;
  loopDuration: number = 0;

  /**
   * Called on first user interaction. MUST be called inside a
   * pointerdown/click handler for iOS compatibility.
   * Returns the same in-flight promise if called while init is running,
   * preventing the race where start() fires before ctx.resume() resolves.
   */
  init(): void {
    if (this.ctx) return;
    this._doInit();
  }

  private _doInit(): void {
    this.ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 });

    // iOS Safari requires a sound to be scheduled synchronously within the
    // gesture handler to fully unlock the AudioContext. A silent 1-frame buffer
    // does the job without making a sound.
    const silentBuf = this.ctx.createBuffer(1, 1, 22050);
    const silentSrc = this.ctx.createBufferSource();
    silentSrc.buffer = silentBuf;
    silentSrc.connect(this.ctx.destination);
    silentSrc.start(0);

    // iOS auto-suspends AudioContexts it considers idle. A silent oscillator
    // running through a zero-gain node keeps the context active so the
    // scheduler's ctx.currentTime advances continuously without needing a
    // user gesture to resume.
    const keepAliveGain = this.ctx.createGain();
    keepAliveGain.gain.value = 0;
    this.keepAliveNode = this.ctx.createOscillator();
    this.keepAliveNode.connect(keepAliveGain);
    keepAliveGain.connect(this.ctx.destination);
    this.keepAliveNode.start();

    // Fire-and-forget: do NOT await ctx.resume(). On iOS Safari the promise can
    // stall indefinitely, which would block engine.start() from ever being
    // called. The statechange listener below handles recovery instead.
    this.ctx.resume();

    // Auto-recover from any future suspension or iOS-specific 'interrupted' state.
    this.ctx.addEventListener('statechange', () => {
      if (this.ctx) resumeIfNeeded(this.ctx);
    });

    this.setupVisibilityHandling();
  }

  private setupVisibilityHandling(): void {
    // Do NOT suspend the AudioContext when the page hides. The scheduler's
    // document.hidden guard already stops new sounds from being scheduled.
    // Suspending creates a resume-on-return problem: ctx.resume() requires a
    // user gesture on iOS, so audio silently stays dead until the user taps.
    // Keeping the context alive (via the keepAlive oscillator) means audio
    // resumes immediately when the user returns without any gesture.

    // iOS Safari can spontaneously re-suspend the AudioContext. Resume it on
    // every user gesture so playback recovers without requiring a stop/start.
    const resumeOnGesture = () => {
      if (this.ctx) resumeIfNeeded(this.ctx);
    };
    document.addEventListener('touchstart', resumeOnGesture, { passive: true });
    document.addEventListener('pointerdown', resumeOnGesture, { passive: true });
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

    const kickoff = () => {
      if (!this.ctx || !this.isPlaying) return;
      // iOS Safari does not reliably fire statechange, so poll until running.
      if (this.ctx.state !== 'running') {
        resumeIfNeeded(this.ctx);
        this.kickoffTimer = window.setTimeout(kickoff, 50);
        return;
      }
      this.kickoffTimer = null;
      // Anchor nextStepTime to real currentTime so audio is scheduled
      // relative to when the context is actually running, not a frozen value.
      this.nextStepTime = this.ctx.currentTime + 0.05;
      const bpm = getBpm();
      const secondsPerStep = 60.0 / bpm / 2;
      this.loopDuration = secondsPerStep * NUM_STEPS;
      this.loopStartTime = this.nextStepTime;
      this.schedulerLoop(getBpm, getPattern, getStepSounds, getFaders, getRepeatActive, onStepChange);
    };

    kickoff();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.kickoffTimer !== null) {
      clearTimeout(this.kickoffTimer);
      this.kickoffTimer = null;
    }
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

      // When the page is hidden (user switched apps), skip scheduling entirely.
      // Only guarding resumeIfNeeded is not enough — if ctx.suspend() hasn't
      // resolved yet, the while loop below would still commit audio to the
      // Web Audio graph, producing a stray sound as the context suspends.
      if (document.hidden) {
        this.schedulerTimer = window.setTimeout(schedule, SCHEDULER_LOOKAHEAD_MS);
        return;
      }

      // Mobile Safari aggressively re-suspends AudioContext after the initial
      // resume. When suspended or interrupted (iOS-specific state), currentTime
      // freezes and the while loop below never fires, sticking the sequencer on
      // the first step with no audio. Calling resume() on every tick recovers it.
      resumeIfNeeded(this.ctx);

      // If nextStepTime has fallen behind currentTime (e.g. after a long
      // suspension), reset it so we don't schedule a burst of past events.
      if (this.nextStepTime < this.ctx.currentTime) {
        this.nextStepTime = this.ctx.currentTime + 0.05;
      }

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
