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

  // Layout params managed separately from drum state
  const [layout, setLayout] = useState<LayoutParams>(getInitialLayout);
  const layoutRef = useRef<LayoutParams>(layout);

  // Keep layoutRef in sync with React state for Tweakpane reads
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  // Sync all state (including layout) to URL
  useEffect(() => {
    const url = stateToURL(state, layout);
    window.history.replaceState(null, '', url);
  }, [state.pattern, state.faders, state.bpm, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tweakpane — created once, bound to layoutRef
  useEffect(() => {
    const pane = new Pane({ title: 'Layout', expanded: false });

    const stepsFolder = pane.addFolder({ title: 'Steps' });
    stepsFolder.addBinding(layoutRef.current, 'stepsStart',  { label: 'start',    min: 0, max: 360, step: 1 });
    stepsFolder.addBinding(layoutRef.current, 'stepsGap',    { label: 'gap',      min: 0, max: 360, step: 1 });
    stepsFolder.addBinding(layoutRef.current, 'stepsRadius', { label: 'radius %', min: 0, max: 100, step: 1 });

    const slidersFolder = pane.addFolder({ title: 'Sliders' });
    slidersFolder.addBinding(layoutRef.current, 'slidersStart',  { label: 'start',    min: 0, max: 360, step: 1 });
    slidersFolder.addBinding(layoutRef.current, 'slidersGap',    { label: 'gap',      min: 0, max: 360, step: 1 });
    slidersFolder.addBinding(layoutRef.current, 'slidersRadius', { label: 'radius %', min: 0, max: 100, step: 1 });

    const buttonsFolder = pane.addFolder({ title: 'Buttons' });
    buttonsFolder.addBinding(layoutRef.current, 'buttonsStart',  { label: 'start',    min: 0, max: 360, step: 1 });
    buttonsFolder.addBinding(layoutRef.current, 'buttonsGap',    { label: 'gap',      min: 0, max: 360, step: 1 });
    buttonsFolder.addBinding(layoutRef.current, 'buttonsRadius', { label: 'radius %', min: 0, max: 100, step: 1 });

    pane.on('change', () => {
      setLayout({ ...layoutRef.current });
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
