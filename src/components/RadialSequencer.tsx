import React from 'react';
import { Pattern, Action, Transport, Faders } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM } from '../constants';
import { CenterControl } from './CenterControl';
import { DiagonalFader } from './DiagonalFader';

interface RadialSequencerProps {
  pattern: Pattern;
  currentStep: number;
  transport: Transport;
  bpm: number;
  faders: Faders;
  dispatch: React.Dispatch<Action>;
  onFirstInteraction?: () => void;
}

const RING_RADII = [152, 124, 96, 68, 40];
const STEP_SIZE = 14;
const TOUCH_SIZE = 28;
const FADER_ANGLES = [-157.5, -67.5, -22.5, 22.5, 112.5];
const ACTION_BUTTONS = {
  random: { x: 140, y: 60 },
  repeat: { x: 140, y: 340 },
  tempo: { x: 330, y: 250 },
};

export function RadialSequencer({
  pattern,
  currentStep,
  transport,
  bpm,
  faders,
  dispatch,
  onFirstInteraction,
}: RadialSequencerProps) {
  const isPlaying = transport === 'playing';

  const handleStepPress = (ring: number, step: number) => {
    onFirstInteraction?.();
    dispatch({ type: 'TOGGLE_PAD', ring, step });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleTempoChange = (delta: number) => {
    onFirstInteraction?.();
    dispatch({ type: 'SET_BPM', bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, bpm + delta)) });
  };

  const handleRandomize = () => {
    onFirstInteraction?.();
    dispatch({ type: 'RANDOMIZE' });
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
  };

  const handleRepeatDown = (e: React.PointerEvent<SVGGElement>) => {
    onFirstInteraction?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    dispatch({ type: 'SET_REPEAT', active: true });
  };

  const handleRepeatUp = () => {
    dispatch({ type: 'SET_REPEAT', active: false });
  };

  const octagonPoints = '200,24 322,74 376,200 322,326 200,376 78,326 24,200 78,74';

  return (
    <div className="board-shell" data-testid="board-shell">
      <svg
        data-testid="sequencer-svg"
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        style={{ display: 'block', touchAction: 'none' }}
        role="grid"
        aria-label="Drum pattern editor"
      >
        <polygon points={octagonPoints} fill="#6ea6a1" />
        <polygon points="200,36 312,82 364,200 312,318 200,364 88,318 36,200 88,82" fill="#f7f9fc" />

        {Array.from({ length: NUM_RINGS }, (_, ring) =>
          Array.from({ length: NUM_STEPS }, (_, step) => {
            const angle = (-90 + step * 45) * (Math.PI / 180);
            const x = 200 + Math.cos(angle) * RING_RADII[ring];
            const y = 200 + Math.sin(angle) * RING_RADII[ring];
            const active = pattern[ring][step];
            const isCurrent = isPlaying && currentStep === step;
            return (
              <g key={`${ring}-${step}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={TOUCH_SIZE}
                  fill="transparent"
                  onPointerDown={() => handleStepPress(ring, step)}
                  style={{ cursor: 'pointer' }}
                  aria-label={`Step ${step + 1}, track ${ring + 1}`}
                />
                <circle
                  data-testid={`pad-${ring}-${step}`}
                  cx={x}
                  cy={y}
                  r={STEP_SIZE}
                  fill={active ? '#6f7cff' : '#d9e0e7'}
                  stroke={isCurrent ? '#1f2442' : '#b9c5d0'}
                  strokeWidth={isCurrent ? 3 : 1.5}
                />
              </g>
            );
          })
        )}

        <g onPointerDown={handleRandomize} style={{ cursor: 'pointer' }} data-testid="random-button">
          <circle cx={ACTION_BUTTONS.random.x} cy={ACTION_BUTTONS.random.y} r="30" fill="transparent" />
          <circle cx={ACTION_BUTTONS.random.x} cy={ACTION_BUTTONS.random.y} r="14" fill="#25d66f" />
        </g>

        <g
          onPointerDown={handleRepeatDown}
          onPointerUp={handleRepeatUp}
          onPointerCancel={handleRepeatUp}
          style={{ cursor: 'pointer' }}
          data-testid="repeat-button"
        >
          <circle cx={ACTION_BUTTONS.repeat.x} cy={ACTION_BUTTONS.repeat.y} r="30" fill="transparent" />
          <circle cx={ACTION_BUTTONS.repeat.x} cy={ACTION_BUTTONS.repeat.y} r="14" fill="#27a7f7" />
        </g>

        <g data-testid="tempo-control">
          <circle cx={ACTION_BUTTONS.tempo.x} cy={ACTION_BUTTONS.tempo.y} r="32" fill="transparent" />
          <circle cx={ACTION_BUTTONS.tempo.x} cy={ACTION_BUTTONS.tempo.y} r="14" fill="#ff3f33" stroke="#b42a22" strokeWidth="2" />
          <text x={ACTION_BUTTONS.tempo.x} y={ACTION_BUTTONS.tempo.y + 28} fontSize="12" textAnchor="middle" fill="#111">{bpm}</text>
          <g onPointerDown={() => handleTempoChange(-10)} style={{ cursor: 'pointer' }}>
            <circle cx={ACTION_BUTTONS.tempo.x - 27} cy={ACTION_BUTTONS.tempo.y} r="18" fill="transparent" />
            <text x={ACTION_BUTTONS.tempo.x - 27} y={ACTION_BUTTONS.tempo.y + 4} textAnchor="middle" fontSize="18" fill="#111">-</text>
          </g>
          <g onPointerDown={() => handleTempoChange(10)} style={{ cursor: 'pointer' }}>
            <circle cx={ACTION_BUTTONS.tempo.x + 27} cy={ACTION_BUTTONS.tempo.y} r="18" fill="transparent" />
            <text x={ACTION_BUTTONS.tempo.x + 27} y={ACTION_BUTTONS.tempo.y + 4} textAnchor="middle" fontSize="18" fill="#111">+</text>
          </g>
        </g>

        <CenterControl transport={transport} dispatch={dispatch} onFirstInteraction={onFirstInteraction} />
      </svg>

      <div data-testid="fader-tray" className="fader-tray">
        {faders.map((fader, ring) => (
          <div
            key={ring}
            className="fader-overlay"
            style={{
              ['--fader-angle' as string]: `${FADER_ANGLES[ring]}deg`,
              ['--fader-radius' as string]: '74px',
            }}
          >
            <DiagonalFader ring={ring} value={fader} dispatch={dispatch} />
          </div>
        ))}
      </div>
    </div>
  );
}
