import { useReducer, useEffect, useCallback } from 'react';
import { reducer, getInitialState } from './state/reducer';
import { stateToURL } from './state/urlCodec';
import { RadialSequencer } from './components/RadialSequencer';
import { useAudioEngine } from './hooks/useAudioEngine';
import './styles/global.css';

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  useEffect(() => {
    const url = stateToURL(state);
    window.history.replaceState(null, '', url);
  }, [state.pattern, state.faders, state.bpm]); // eslint-disable-line react-hooks/exhaustive-deps

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
          dispatch={dispatch}
          onFirstInteraction={handleFirstInteraction}
        />
      </div>
    </div>
  );
}
