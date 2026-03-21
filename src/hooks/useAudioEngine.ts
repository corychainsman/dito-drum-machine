import { useRef, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { AudioEngine } from '../audio/AudioEngine';

export function useAudioEngine(state: AppState, dispatch: React.Dispatch<{ type: 'ADVANCE_STEP' }>) {
  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const stateRef = useRef(state);

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
        (_step: number) => dispatch({ type: 'ADVANCE_STEP' })
      );
    } else if (state.transport === 'stopped') {
      engine.stop();
    }
  }, [state.transport, dispatch]);

  const init = useCallback(() => {
    engineRef.current.init();
  }, []);

  const getEngine = useCallback(() => engineRef.current, []);

  return { init, getEngine };
}
