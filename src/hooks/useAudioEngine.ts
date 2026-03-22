import { useRef, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { AudioEngine } from '../audio/AudioEngine';

export function useAudioEngine(state: AppState, dispatch: React.Dispatch<{ type: 'SET_CURRENT_STEP'; step: number }>) {
  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const stateRef = useRef(state);
  const rafRef = useRef<number | null>(null);

  // Keep stateRef always current so scheduler callbacks read fresh values
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // React to transport changes
  useEffect(() => {
    const engine = engineRef.current;
    if (state.transport === 'playing') {
      // init() is synchronous — AudioContext is created immediately in the
      // gesture handler. We do not await ctx.resume() because on iOS Safari
      // that promise can stall, blocking start() from ever being called.
      engine.init();
      engine.start(
        () => stateRef.current.bpm,
        () => stateRef.current.pattern,
        () => stateRef.current.stepSounds,
        () => stateRef.current.faders,
        () => stateRef.current.repeatActive,
      );

      // Drive the visual step highlight from the audio clock via rAF so the
      // highlight is in sync with actual playback, not the look-ahead scheduler.
      let lastStep = -1;
      const tick = () => {
        const step = engine.getDisplayStep();
        if (step !== -1 && step !== lastStep) {
          lastStep = step;
          dispatch({ type: 'SET_CURRENT_STEP', step });
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else if (state.transport === 'stopped') {
      engine.stop();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [state.transport, dispatch]);

  const init = useCallback(() => {
    engineRef.current.init();
  }, []);

  const getEngine = useCallback(() => engineRef.current, []);

  return { init, getEngine };
}
