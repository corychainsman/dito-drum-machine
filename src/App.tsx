import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { Pane } from 'tweakpane';
import { LayoutParams } from './types';
import { reducer, getInitialState } from './state/reducer';
import { stateToURL, getInitialLayout } from './state/urlCodec';
import { RadialSequencer } from './components/RadialSequencer';
import { useAudioEngine } from './hooks/useAudioEngine';
import './styles/global.css';

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  // tpParams is the single stable object Tweakpane writes to in place.
  // It is NEVER reassigned so Tweakpane's bindings always point at the right object.
  const tpParams = useRef<LayoutParams>(getInitialLayout());

  // layout is derived read-only state for rendering — copied from tpParams on each change.
  const [layout, setLayout] = useState<LayoutParams>(() => ({ ...tpParams.current }));

  // Sync all state (including layout) to URL
  useEffect(() => {
    const url = stateToURL(state, layout);
    window.history.replaceState(null, '', url);
  }, [state.pattern, state.faders, state.bpm, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tweakpane — bound once to the stable tpParams object
  useEffect(() => {
    const pane = new Pane({ title: 'Layout', expanded: false });

    const stepsFolder = pane.addFolder({ title: 'Steps' });
    stepsFolder.addBinding(tpParams.current, 'stepsStart',  { label: 'start',    min: 0, max: 360, step: 1 });
    stepsFolder.addBinding(tpParams.current, 'stepsGap',    { label: 'gap',      min: 0, max: 360, step: 1 });
    stepsFolder.addBinding(tpParams.current, 'stepsRadius', { label: 'radius %', min: 0, max: 100, step: 1 });

    const slidersFolder = pane.addFolder({ title: 'Sliders' });
    slidersFolder.addBinding(tpParams.current, 'slidersStart',  { label: 'start',    min: 0, max: 360, step: 1 });
    slidersFolder.addBinding(tpParams.current, 'slidersGap',    { label: 'gap',      min: 0, max: 360, step: 1 });
    slidersFolder.addBinding(tpParams.current, 'slidersRadius', { label: 'radius %', min: 0, max: 100, step: 1 });

    const buttonsFolder = pane.addFolder({ title: 'Buttons' });
    buttonsFolder.addBinding(tpParams.current, 'buttonsStart',  { label: 'start',    min: 0, max: 360, step: 1 });
    buttonsFolder.addBinding(tpParams.current, 'buttonsGap',    { label: 'gap',      min: 0, max: 360, step: 1 });
    buttonsFolder.addBinding(tpParams.current, 'buttonsRadius', { label: 'radius %', min: 0, max: 100, step: 1 });

    pane.on('change', () => {
      // tpParams.current was mutated in place by Tweakpane — copy into React state
      setLayout({ ...tpParams.current });
    });

    return () => { pane.dispose(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
