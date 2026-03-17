import React from 'react';
import { Pattern, Action, Transport, Faders, LayoutParams } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM } from '../constants';
import { CenterControl } from './CenterControl';
import { DiagonalFader } from './DiagonalFader';

interface RadialSequencerProps {
  pattern: Pattern;
  currentStep: number;
  transport: Transport;
  bpm: number;
  faders: Faders;
  layout: LayoutParams;
  dispatch: React.Dispatch<Action>;
  onFirstInteraction?: () => void;
}

// Relative ring radii (normalized so outer ring = 1.0)
const BASE_RING_RADII = [152, 124, 96, 68, 40];
const NORM_RING_RADII = BASE_RING_RADII.map(r => r / BASE_RING_RADII[0]);

const STEP_SIZE = 14;
const TOUCH_SIZE = 28;

const SVG_HALF = 200; // half of the 400×400 viewBox

function toRad(deg: number) { return deg * (Math.PI / 180); }

export function RadialSequencer({
  pattern,
  currentStep,
  transport,
  bpm,
  faders,
  layout,
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

  // ─── Sequencer step positions ───────────────────────────────────
  const outerRingRadius = (layout.stepsRadius / 100) * SVG_HALF;

  // ─── Action button positions (random, repeat, tempo) ──────────
  const buttonPositions = [0, 1, 2].map(i => {
    const angleDeg = layout.buttonsStart + i * layout.buttonsGap;
    const r = (layout.buttonsRadius / 100) * SVG_HALF;
    return {
      x: SVG_HALF + Math.cos(toRad(angleDeg)) * r,
      y: SVG_HALF + Math.sin(toRad(angleDeg)) * r,
    };
  });
  const [btnRandom, btnRepeat, btnTempo] = buttonPositions;

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
            const angleDeg = layout.stepsStart + step * layout.stepsGap;
            const r = outerRingRadius * NORM_RING_RADII[ring];
            const x = SVG_HALF + Math.cos(toRad(angleDeg)) * r;
            const y = SVG_HALF + Math.sin(toRad(angleDeg)) * r;
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

        {/* Random button */}
        <g onPointerDown={handleRandomize} style={{ cursor: 'pointer' }} data-testid="random-button">
          <circle cx={btnRandom.x} cy={btnRandom.y} r="30" fill="transparent" />
          <circle cx={btnRandom.x} cy={btnRandom.y} r="14" fill="#25d66f" />
        </g>

        {/* Repeat button */}
        <g
          onPointerDown={handleRepeatDown}
          onPointerUp={handleRepeatUp}
          onPointerCancel={handleRepeatUp}
          style={{ cursor: 'pointer' }}
          data-testid="repeat-button"
        >
          <circle cx={btnRepeat.x} cy={btnRepeat.y} r="30" fill="transparent" />
          <circle cx={btnRepeat.x} cy={btnRepeat.y} r="14" fill="#27a7f7" />
        </g>

        {/* Tempo button */}
        <g data-testid="tempo-control">
          <circle cx={btnTempo.x} cy={btnTempo.y} r="32" fill="transparent" />
          <circle cx={btnTempo.x} cy={btnTempo.y} r="14" fill="#ff3f33" stroke="#b42a22" strokeWidth="2" />
          <text x={btnTempo.x} y={btnTempo.y + 28} fontSize="12" textAnchor="middle" fill="#111">{bpm}</text>
          <g onPointerDown={() => handleTempoChange(-10)} style={{ cursor: 'pointer' }}>
            <circle cx={btnTempo.x - 27} cy={btnTempo.y} r="18" fill="transparent" />
            <text x={btnTempo.x - 27} y={btnTempo.y + 4} textAnchor="middle" fontSize="18" fill="#111">-</text>
          </g>
          <g onPointerDown={() => handleTempoChange(10)} style={{ cursor: 'pointer' }}>
            <circle cx={btnTempo.x + 27} cy={btnTempo.y} r="18" fill="transparent" />
            <text x={btnTempo.x + 27} y={btnTempo.y + 4} textAnchor="middle" fontSize="18" fill="#111">+</text>
          </g>
        </g>

        <CenterControl transport={transport} dispatch={dispatch} onFirstInteraction={onFirstInteraction} />
      </svg>

      {/* Fader tray — positioned via polar layout params */}
      <div data-testid="fader-tray" className="fader-tray">
        {faders.map((fader, ring) => {
          const angleDeg = layout.slidersStart + ring * layout.slidersGap;
          const r = (layout.slidersRadius / 100) * SVG_HALF;
          // Convert SVG units to % of board-shell (SVG_HALF = 50% of board)
          const leftPct = 50 + Math.cos(toRad(angleDeg)) * (r / SVG_HALF) * 50;
          const topPct  = 50 + Math.sin(toRad(angleDeg)) * (r / SVG_HALF) * 50;
          return (
            <div
              key={ring}
              className="fader-overlay"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
              }}
            >
              <DiagonalFader ring={ring} value={fader} dispatch={dispatch} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
