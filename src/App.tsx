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

  const { init } = useAudioEngine(state, dispatch);

  const handleFirstInteraction = useCallback(async () => {
    await init();
  }, [init]);

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
        />
      </div>
    </div>
  );
}
