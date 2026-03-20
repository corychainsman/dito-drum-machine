import { useReducer, useEffect, useCallback, useState } from 'react';
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
  useEffect(() => {
    const url = stateToURL(state, layout);
    window.history.replaceState(null, '', url);
  }, [state.pattern, state.faders, state.bpm, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const { init, getEngine } = useAudioEngine(state, dispatch);

  const handleFirstInteraction = useCallback(async () => {
    await init();
  }, [init]);

  const handleSoloTrigger = useCallback(async (slotIndex: number, soundIndex: number, fader: number) => {
    await init();
    getEngine().triggerSoloSlotSound(slotIndex, soundIndex, fader);
  }, [getEngine, init]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSpace = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
      if (!isSpace) return;

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target != null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditableTarget) return;

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
  }, [dispatch, handleFirstInteraction, state.transport]);

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
