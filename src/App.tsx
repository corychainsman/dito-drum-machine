import { useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { LayoutParams } from './types';
import { reducer, getInitialState } from './state/reducer';
import { stateToURL, getInitialLayout } from './state/urlCodec';
import { RadialSequencer } from './components/RadialSequencer';
import { useAudioEngine } from './hooks/useAudioEngine';
import './styles/global.css';

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const [layout] = useState<LayoutParams>(() => getInitialLayout());

  // Sync all state (including layout) to URL
  // Always keep a ref to the latest state+layout so the URL sync handlers
  // below can read current values without stale closures.
  const urlSyncRef = useRef({ state, layout });
  urlSyncRef.current = { state, layout };

  useEffect(() => {
    // Only write the URL when the user finishes a gesture or releases a key —
    // not on every intermediate drag event. This avoids hitting the browser
    // rate limit on history.replaceState (~100 calls/30s in Safari), which
    // throws a SecurityError in a useEffect and unmounts the React tree.
    const sync = () => {
      const { state, layout } = urlSyncRef.current;
      window.history.replaceState(null, '', stateToURL(state, layout));
    };
    document.addEventListener('pointerup', sync);
    document.addEventListener('keyup', sync);
    return () => {
      document.removeEventListener('pointerup', sync);
      document.removeEventListener('keyup', sync);
    };
  // urlSyncRef is a ref — its identity never changes, so it correctly belongs outside deps.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { init, getEngine } = useAudioEngine(state, dispatch);

  const handleFirstInteraction = useCallback(() => {
    init();
  }, [init]);

  const handleSoloTrigger = useCallback((slotIndex: number, soundIndex: number, fader: number) => {
    init();
    getEngine().triggerSoloSlotSound(slotIndex, soundIndex, fader);
  }, [getEngine, init]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSpace = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
      const isArrowUp = event.key === 'ArrowUp';
      const isArrowDown = event.key === 'ArrowDown';
      const isBpmKey = isArrowUp || isArrowDown;
      if (!isSpace && !isBpmKey) return;

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target != null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditableTarget) return;

      if (isBpmKey) {
        event.preventDefault();
        const step = event.shiftKey || event.altKey || event.ctrlKey ? 1 : 10;
        const direction = isArrowUp ? 1 : -1;
        dispatch({ type: 'SET_BPM', bpm: state.bpm + direction * step });
        return;
      }

      event.preventDefault();
      if (event.repeat) return;
      if (state.transport === 'playing') {
        dispatch({ type: 'STOP' });
      } else {
        // Keydown counts as a user gesture; initialize audio before starting.
        void handleFirstInteraction();
        dispatch({ type: 'PLAY' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, handleFirstInteraction, state.bpm, state.transport]);

  return (
    <div className="app-container">
      <div className="sequencer-container">
        <RadialSequencer
          pattern={state.pattern}
          currentStep={state.currentStep}
          transport={state.transport}
          bpm={state.bpm}
          faders={state.faders}
          layout={layout}
          dispatch={dispatch}
          onFirstInteraction={handleFirstInteraction}
          onSoloTrigger={handleSoloTrigger}
        />
      </div>
    </div>
  );
}
