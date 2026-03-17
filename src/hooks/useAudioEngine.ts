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
      engine.start(
        () => stateRef.current.bpm,
        () => stateRef.current.pattern,
        () => stateRef.current.faders,
        () => stateRef.current.repeatActive,
        (_step: number) => dispatch({ type: 'ADVANCE_STEP' })
      );
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
