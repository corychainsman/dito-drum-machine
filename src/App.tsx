import { useReducer, useEffect, useCallback } from 'react';
import { reducer, getInitialState } from './state/reducer';
import { stateToURL } from './state/urlCodec';
import { RadialSequencer } from './components/RadialSequencer';
import { RandomButton } from './components/RandomButton';
import { RepeatButton } from './components/RepeatButton';
import { TempoControl } from './components/TempoControl';
import { FaderTray } from './components/FaderTray';
import { useAudioEngine } from './hooks/useAudioEngine';
import './styles/global.css';

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  // URL sync effect — only for serialized fields (pattern, faders, bpm)
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
      <div className="main-area">
        <div className="sequencer-container">
          <RadialSequencer
            pattern={state.pattern}
            currentStep={state.currentStep}
            transport={state.transport}
            dispatch={dispatch}
            onFirstInteraction={handleFirstInteraction}
          />
        </div>
        <div className="action-row">
          <RandomButton dispatch={dispatch} />
          <TempoControl bpm={state.bpm} dispatch={dispatch} />
          <RepeatButton dispatch={dispatch} />
        </div>
      </div>

      <div className="fader-panel">
        <FaderTray faders={state.faders} dispatch={dispatch} />
      </div>
    </div>
  );
}
