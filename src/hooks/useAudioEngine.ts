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
      // init() is idempotent — safe to call if already initialized.
      // Await ensures start() only runs after AudioContext is ready.
      engine.init().then(() => {
        engine.start(
          () => stateRef.current.bpm,
          () => stateRef.current.pattern,
          () => stateRef.current.faders,
          () => stateRef.current.repeatActive,
          (_step: number) => dispatch({ type: 'ADVANCE_STEP' })
        );
      }).catch(console.error);
    } else if (state.transport === 'stopped') {
      engine.stop();
    }
  }, [state.transport, dispatch]);

  const init = useCallback(async () => {
    await engineRef.current.init();
  }, []);

  const getEngine = useCallback(() => engineRef.current, []);

  return { init, getEngine };
}
