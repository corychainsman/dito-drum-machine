import React, { useEffect, useRef, useState } from 'react';
import { Pattern, Action, Transport, Faders, LayoutParams } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM, DEFAULT_LAYOUT, RING_COLORS } from '../constants';
import { CenterControl } from './CenterControl';
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
}

interface Point {
  x: number;
  y: number;
}

interface FaderNode extends Point {
  axisX: number;
  axisY: number;
}

interface SoundSlot {
  button: Point;
  slider: FaderNode;
  sliderElement: number;
}

const SVG_SIZE = 425;
const SVG_HALF = SVG_SIZE / 2;

// Derived from dito-v1.svg step-circle ring distances
const STEP_BASE_RADII = [184, 139, 94, 49];
const STEP_OFF_COLOR = '#D2DBE4';
const STEP_START_IN_SVG = 247.5;

const FADER_RANGE = 30;
const SOUND_SLOTS: SoundSlot[] = [
  {
    button: { x: 96.6, y: 95 },
    slider: { x: 142.6, y: 146.8, axisX: 0.707, axisY: 0.707 },
    sliderElement: 1,
  },
  {
    button: { x: 331.9, y: 94.9 },
    slider: { x: 284.6, y: 142.6, axisX: -0.707, axisY: 0.707 },
    sliderElement: 0,
  },
  {
    button: { x: 96.6, y: 330 },
    slider: { x: 141.6, y: 283.6, axisX: 0.707, axisY: -0.707 },
    sliderElement: 2,
  },
  {
    button: { x: 331.9, y: 329.9 },
    slider: { x: 284.6, y: 287.6, axisX: -0.707, axisY: -0.707 },
    sliderElement: 3,
  },
];
const DEFAULT_SLOT_SOUNDS: [number, number, number, number] = [0, 1, 2, 3];
const FACEPLATE_INNER = ditoFaceplateRaw
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

const RANDOM_POS = { x: 213, y: 66 };
const TEMPO_UP_POS = { x: 359, y: 212 };
const TEMPO_DOWN_POS = { x: 66, y: 212 };
const REPEAT_POS = { x: 213, y: 359 };

function toRad(deg: number) {
  return deg * (Math.PI / 180);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSvgPoint<T extends SVGElement>(e: React.PointerEvent<T>): Point {
  const svg = (e.currentTarget.ownerSVGElement ?? e.currentTarget) as SVGSVGElement;
  const ctm = svg.getScreenCTM();

  if (!ctm) {
    return { x: SVG_HALF, y: SVG_HALF };
  }

  const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return { x: point.x, y: point.y };
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
}: RadialSequencerProps) {
  const isPlaying = transport === 'playing';
  const [slotVoices, setSlotVoices] = useState<[number, number, number, number]>(DEFAULT_SLOT_SOUNDS);
  const faceplateRef = useRef<SVGGElement>(null);
  const thumbBaseTransforms = useRef<string[]>([]);

  const stepStartDeg = STEP_START_IN_SVG + (layout.stepsStart - DEFAULT_LAYOUT.stepsStart);
  const stepGapDeg = layout.stepsGap;
  const outerScale = layout.stepsRadius / DEFAULT_LAYOUT.stepsRadius;
  const stepRadii = STEP_BASE_RADII.map((radius) => radius * outerScale);

  const handleStepPress = (ring: number, step: number) => {
    onFirstInteraction?.();
    dispatch({ type: 'TOGGLE_PAD', ring, step });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement | null;
    if (!target) return;

    const ringAttr = target.getAttribute('data-ring');
    const stepAttr = target.getAttribute('data-step');
    if (ringAttr == null || stepAttr == null) return;

    const ring = Number(ringAttr);
    const step = Number(stepAttr);
    if (Number.isNaN(ring) || Number.isNaN(step)) return;

    handleStepPress(ring, step);
  };

  const handleTempoChange = (delta: number) => {
    onFirstInteraction?.();
    dispatch({ type: 'SET_BPM', bpm: clamp(bpm + delta, MIN_BPM, MAX_BPM) });
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

  const handleCycleSound = (slotIndex: number) => {
    onFirstInteraction?.();
    setSlotVoices((previous) => {
      const next = [...previous] as [number, number, number, number];
      next[slotIndex] = (next[slotIndex] + 1) % NUM_RINGS;
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const updateFaderFromPointer = (e: React.PointerEvent<SVGGElement>, slotIndex: number) => {
    const node = SOUND_SLOTS[slotIndex].slider;
    const ring = slotVoices[slotIndex];
    const point = getSvgPoint(e);
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    const projected = dx * node.axisX + dy * node.axisY;
    const normalized = clamp((projected + FADER_RANGE / 2) / FADER_RANGE, 0, 1);
    dispatch({ type: 'SET_FADER', ring, value: normalized });
  };

  const handleFaderDown = (e: React.PointerEvent<SVGGElement>, slotIndex: number) => {
    onFirstInteraction?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFaderFromPointer(e, slotIndex);
  };

  const handleFaderMove = (e: React.PointerEvent<SVGGElement>, slotIndex: number) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFaderFromPointer(e, slotIndex);
  };

  const handleFaderUp = (e: React.PointerEvent<SVGGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    const faceplate = faceplateRef.current;
    if (!faceplate) return;

    SOUND_SLOTS.forEach((slot, slotIndex) => {
      const ring = slotVoices[slotIndex];
      const color = RING_COLORS[ring];
      const sliderValue = faders[ring];
      const offset = (sliderValue - 0.5) * FADER_RANGE;

      const button = faceplate.querySelector<SVGRectElement>(`#cycle-button-${slotIndex}`);
      if (button) {
        button.setAttribute('fill', '#050505');
        button.setAttribute('stroke', color);
        button.setAttribute('stroke-width', '2.25');
      }

      const thumb = faceplate.querySelector<SVGRectElement>(`#slider-thumb-${slot.sliderElement}`);
      if (thumb) {
        if (!thumbBaseTransforms.current[slot.sliderElement]) {
          thumbBaseTransforms.current[slot.sliderElement] = thumb.getAttribute('transform') ?? '';
        }

        thumb.setAttribute(
          'transform',
          `translate(${slot.slider.axisX * offset} ${slot.slider.axisY * offset}) ${thumbBaseTransforms.current[slot.sliderElement]}`
        );
        thumb.setAttribute('fill', color);
      }
    });
  }, [faders, slotVoices]);

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

        <g data-testid="fader-tray">
          {SOUND_SLOTS.map((slot, slotIndex) => {
            return (
              <g
                key={slotIndex}
                data-testid={`fader-${slotIndex}`}
                onPointerDown={(e) => handleFaderDown(e, slotIndex)}
                onPointerMove={(e) => handleFaderMove(e, slotIndex)}
                onPointerUp={handleFaderUp}
                onPointerCancel={handleFaderUp}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={slot.slider.x} cy={slot.slider.y} r="22" fill="transparent" />
              </g>
            );
          })}
        </g>

        {SOUND_SLOTS.map((slot, slotIndex) => {
          return (
            <g
              key={`sound-cycle-${slotIndex}`}
              data-testid={`sound-cycle-${slotIndex}`}
              onPointerDown={() => handleCycleSound(slotIndex)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={slot.button.x} cy={slot.button.y} r="24" fill="transparent" />
            </g>
          );
        })}

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

        <g data-testid="tempo-control">
          <g onPointerDown={() => handleTempoChange(10)} style={{ cursor: 'pointer' }}>
            <circle cx={TEMPO_UP_POS.x} cy={TEMPO_UP_POS.y} r="22" fill="transparent" />
          </g>
          <g onPointerDown={() => handleTempoChange(-10)} style={{ cursor: 'pointer' }}>
            <circle cx={TEMPO_DOWN_POS.x} cy={TEMPO_DOWN_POS.y} r="22" fill="transparent" />
          </g>
          <text
            x={TEMPO_UP_POS.x}
            y={TEMPO_UP_POS.y + 33}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#101010"
          >
            {bpm}
          </text>
        </g>

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
