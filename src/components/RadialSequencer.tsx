import { useEffect, useRef } from 'react';
import React from 'react';
import { Pattern, Action, Transport, Faders, LayoutParams } from '../types';
import { NUM_RINGS, NUM_STEPS, DEFAULT_LAYOUT, RING_COLORS, STEP_BASE_RADII, HAPTIC_PAD_TAP, HAPTIC_RANDOM } from '../constants';
import { haptic } from '../utils/haptic';
import { CenterControl } from './CenterControl';
import { TempoDial } from './TempoDial';
import { SoloControls } from './SoloControls';
import ditoFaceplateRaw from '../assets/dito-v1.svg?raw';

interface RadialSequencerProps {
  pattern: Pattern;
  currentStep: number;
  transport: Transport;
  bpm: number;
  faders: Faders;
  layout: LayoutParams;
  dispatch: React.Dispatch<Action>;
  onFirstInteraction?: () => void;
  onSoloTrigger?: (slotIndex: number, soundIndex: number, fader: number) => void | Promise<void>;
}

const SVG_SIZE = 425;
const SVG_HALF = SVG_SIZE / 2;

const STEP_OFF_COLOR = '#D2DBE4';
const STEP_START_IN_SVG = 247.5;

const RANDOM_POS = { x: 213, y: 66 };
const REPEAT_POS = { x: 213, y: 359 };

const FACEPLATE_INNER = ditoFaceplateRaw
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

function toRad(deg: number) {
  return deg * (Math.PI / 180);
}

export function RadialSequencer({
  pattern,
  currentStep,
  transport,
  bpm,
  faders,
  layout,
  dispatch,
  onFirstInteraction,
  onSoloTrigger,
}: RadialSequencerProps) {
  const isPlaying = transport === 'playing';
  const faceplateRef = useRef<SVGGElement>(null);

  const stepStartDeg = STEP_START_IN_SVG + (layout.stepsStart - DEFAULT_LAYOUT.stepsStart);
  const stepGapDeg = layout.stepsGap;
  const outerScale = layout.stepsRadius / DEFAULT_LAYOUT.stepsRadius;
  const stepRadii = STEP_BASE_RADII.map((r) => r * outerScale);

  // Sync step circle positions and colors into the faceplate SVG DOM
  useEffect(() => {
    const faceplate = faceplateRef.current;
    if (!faceplate) return;

    for (let ring = 0; ring < NUM_RINGS; ring++) {
      for (let step = 0; step < NUM_STEPS; step++) {
        const node = faceplate.querySelector<SVGCircleElement>(`#step-${ring}-${step}`);
        if (!node) continue;

        const angleDeg = stepStartDeg + step * stepGapDeg;
        const ringRadius = stepRadii[ring] ?? stepRadii[stepRadii.length - 1];
        const x = SVG_HALF + Math.cos(toRad(angleDeg)) * ringRadius;
        const y = SVG_HALF + Math.sin(toRad(angleDeg)) * ringRadius;
        const active = pattern[ring][step];
        const isCurrent = isPlaying && currentStep === step;

        node.setAttribute('cx', x.toFixed(3));
        node.setAttribute('cy', y.toFixed(3));
        node.setAttribute('fill', active ? RING_COLORS[ring] : STEP_OFF_COLOR);
        node.setAttribute('stroke', isCurrent ? '#161616' : '#9EA8B2');
        node.setAttribute('stroke-width', isCurrent ? '3' : '1.5');
        node.style.cursor = 'pointer';
      }
    }
  }, [currentStep, isPlaying, pattern, stepGapDeg, stepRadii, stepStartDeg]);

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement | null;
    if (!target) return;
    const ring = Number(target.getAttribute('data-ring'));
    const step = Number(target.getAttribute('data-step'));
    if (target.getAttribute('data-ring') == null || target.getAttribute('data-step') == null) return;
    if (Number.isNaN(ring) || Number.isNaN(step)) return;
    onFirstInteraction?.();
    dispatch({ type: 'TOGGLE_PAD', ring, step });
    haptic(HAPTIC_PAD_TAP);
  };

  const handleRandomize = () => {
    onFirstInteraction?.();
    dispatch({ type: 'RANDOMIZE' });
    haptic(HAPTIC_RANDOM);
  };

  const handleRepeatDown = (e: React.PointerEvent<SVGGElement>) => {
    onFirstInteraction?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    dispatch({ type: 'SET_REPEAT', active: true });
  };

  const handleRepeatUp = () => {
    dispatch({ type: 'SET_REPEAT', active: false });
  };

  return (
    <div className="board-shell" data-testid="board-shell">
      <svg
        data-testid="sequencer-svg"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width="100%"
        height="100%"
        style={{ display: 'block', touchAction: 'none' }}
        role="grid"
        aria-label="Drum pattern editor"
        onPointerDown={handleSvgPointerDown}
      >
        <g ref={faceplateRef} dangerouslySetInnerHTML={{ __html: FACEPLATE_INNER }} />

        <SoloControls
          faders={faders}
          dispatch={dispatch}
          faceplateRef={faceplateRef}
          onFirstInteraction={onFirstInteraction}
          onSoloTrigger={onSoloTrigger}
        />

        <g onPointerDown={handleRandomize} style={{ cursor: 'pointer' }} data-testid="random-button">
          <circle cx={RANDOM_POS.x} cy={RANDOM_POS.y} r="22" fill="transparent" />
        </g>

        <g
          data-testid="repeat-button"
          onPointerDown={handleRepeatDown}
          onPointerUp={handleRepeatUp}
          onPointerCancel={handleRepeatUp}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={REPEAT_POS.x} cy={REPEAT_POS.y} r="22" fill="transparent" />
        </g>

        <TempoDial bpm={bpm} dispatch={dispatch} onFirstInteraction={onFirstInteraction} />

        <CenterControl
          transport={transport}
          dispatch={dispatch}
          onFirstInteraction={onFirstInteraction}
          cx={SVG_HALF}
          cy={SVG_HALF}
          radius={24}
        />
      </svg>
    </div>
  );
}
