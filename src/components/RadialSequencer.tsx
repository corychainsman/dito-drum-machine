import React, { useEffect, useRef, useState } from 'react';
import { Pattern, Action, Transport, Faders, LayoutParams } from '../types';
import { NUM_RINGS, NUM_STEPS, MIN_BPM, MAX_BPM, DEFAULT_LAYOUT, RING_COLORS, SOLO_SOUND_COUNT } from '../constants';
import { mapLeadSemitoneOffset } from '../audio/voices';
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
  onSoloTrigger?: (slotIndex: number, soundIndex: number, fader: number) => void | Promise<void>;
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

interface TempoDragState {
  pointerId: number;
  startAxisProjection: number;
  startAngleDeg: number;
}

const SVG_SIZE = 425;
const SVG_HALF = SVG_SIZE / 2;

// Derived from dito-v1.svg step-circle ring distances
const STEP_BASE_RADII = [184, 139, 94, 49];
const STEP_OFF_COLOR = '#D2DBE4';
const STEP_START_IN_SVG = 247.5;

const FADER_RANGE = 30;
const SLOT_ARROW_OFFSET = 32;
const SLOT_ARROW_RADIUS = 10;
const LEAD_SLOT_INDEX = 3;
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
const DEFAULT_SLOT_SOUND_INDICES: [number, number, number, number] = [0, 0, 0, 0];
const FACEPLATE_INNER = ditoFaceplateRaw
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

const RANDOM_POS = { x: 213, y: 66 };
const TEMPO_KNOB_CENTER = { x: 302, y: 212 };
const TEMPO_KNOB_MIN_DEG = -180;
const TEMPO_KNOB_MAX_DEG = 180;
const TEMPO_KNOB_CENTER_BPM = 97.5;
const TEMPO_DRAG_DEGREES_PER_UNIT = 1;
const REPEAT_POS = { x: 213, y: 359 };

function toRad(deg: number) {
  return deg * (Math.PI / 180);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSlotArrowPoints(slot: SoundSlot) {
  const tangentX = -slot.slider.axisY;
  const tangentY = slot.slider.axisX;

  return {
    backward: {
      x: slot.button.x + tangentX * SLOT_ARROW_OFFSET,
      y: slot.button.y + tangentY * SLOT_ARROW_OFFSET,
    },
    forward: {
      x: slot.button.x - tangentX * SLOT_ARROW_OFFSET,
      y: slot.button.y - tangentY * SLOT_ARROW_OFFSET,
    },
  };
}

function bpmToTempoAngle(bpm: number) {
  const clampedBpm = clamp(bpm, MIN_BPM, MAX_BPM);
  if (clampedBpm <= TEMPO_KNOB_CENTER_BPM) {
    const ratio = (clampedBpm - MIN_BPM) / (TEMPO_KNOB_CENTER_BPM - MIN_BPM);
    return TEMPO_KNOB_MIN_DEG + ratio * (0 - TEMPO_KNOB_MIN_DEG);
  }
  const ratio = (clampedBpm - TEMPO_KNOB_CENTER_BPM) / (MAX_BPM - TEMPO_KNOB_CENTER_BPM);
  return ratio * TEMPO_KNOB_MAX_DEG;
}

function tempoAngleToBpm(angleDeg: number) {
  const clampedAngle = clamp(angleDeg, TEMPO_KNOB_MIN_DEG, TEMPO_KNOB_MAX_DEG);
  if (clampedAngle <= 0) {
    const ratio = (clampedAngle - TEMPO_KNOB_MIN_DEG) / (0 - TEMPO_KNOB_MIN_DEG);
    return MIN_BPM + ratio * (TEMPO_KNOB_CENTER_BPM - MIN_BPM);
  }
  const ratio = clampedAngle / TEMPO_KNOB_MAX_DEG;
  return TEMPO_KNOB_CENTER_BPM + ratio * (MAX_BPM - TEMPO_KNOB_CENTER_BPM);
}

function formatTempo(bpm: number) {
  return String(Math.round(bpm));
}

function projectToTempoAxis(point: Point) {
  const dx = point.x - TEMPO_KNOB_CENTER.x;
  const dy = point.y - TEMPO_KNOB_CENTER.y;
  return (dx - dy) / Math.SQRT2;
}

function getSvgPoint<T extends SVGElement>(e: React.PointerEvent<T>): Point | null {
  const svg = (e.currentTarget.ownerSVGElement ?? e.currentTarget) as SVGSVGElement;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  try {
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    if (!isFinite(point.x) || !isFinite(point.y)) return null;
    return { x: point.x, y: point.y };
  } catch {
    return null;
  }
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
  const [slotSoundIndices, setSlotSoundIndices] = useState<[number, number, number, number]>(DEFAULT_SLOT_SOUND_INDICES);
  const faceplateRef = useRef<SVGGElement>(null);
  const thumbBaseTransforms = useRef<string[]>([]);
  const tempoDragRef = useRef<TempoDragState | null>(null);
  const leadPreviewSemitoneRef = useRef<number | null>(null);

  const stepStartDeg = STEP_START_IN_SVG + (layout.stepsStart - DEFAULT_LAYOUT.stepsStart);
  const stepGapDeg = layout.stepsGap;
  const outerScale = layout.stepsRadius / DEFAULT_LAYOUT.stepsRadius;
  const stepRadii = STEP_BASE_RADII.map((radius) => radius * outerScale);

  const handleStepPress = (ring: number, step: number) => {
    onFirstInteraction?.();
    dispatch({ type: 'TOGGLE_PAD', ring, step, soundIndex: slotSoundIndices[ring] });
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

  const handleTempoKnobDown = (e: React.PointerEvent<SVGGElement>) => {
    onFirstInteraction?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = getSvgPoint(e);
    if (!point) return;
    tempoDragRef.current = {
      pointerId: e.pointerId,
      startAxisProjection: projectToTempoAxis(point),
      startAngleDeg: bpmToTempoAngle(bpm),
    };
  };

  const handleTempoKnobMove = (e: React.PointerEvent<SVGGElement>) => {
    const drag = tempoDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const point = getSvgPoint(e);
    if (!point) return;
    const axisDelta = projectToTempoAxis(point) - drag.startAxisProjection;
    const nextAngle = clamp(
      drag.startAngleDeg + axisDelta * TEMPO_DRAG_DEGREES_PER_UNIT,
      TEMPO_KNOB_MIN_DEG,
      TEMPO_KNOB_MAX_DEG
    );
    const nextBpm = Math.round(tempoAngleToBpm(nextAngle));
    if (nextBpm === bpm) return;
    dispatch({ type: 'SET_BPM', bpm: nextBpm });
  };

  const handleTempoKnobUp = (e: React.PointerEvent<SVGGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (tempoDragRef.current?.pointerId === e.pointerId) {
      tempoDragRef.current = null;
    }
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

  const handleSoloButtonPress = (slotIndex: number) => {
    onFirstInteraction?.();
    const soundIndex = slotSoundIndices[slotIndex];
    void onSoloTrigger?.(slotIndex, soundIndex, faders[slotIndex]);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleCycleSlotSound = (slotIndex: number, direction: -1 | 1) => {
    onFirstInteraction?.();
    setSlotSoundIndices((previous) => {
      const next = [...previous] as [number, number, number, number];
      next[slotIndex] = (next[slotIndex] + direction + SOLO_SOUND_COUNT) % SOLO_SOUND_COUNT;
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const previewLeadPitchIfNeeded = (slotIndex: number, fader: number) => {
    if (slotIndex !== LEAD_SLOT_INDEX) return;

    const semitone = mapLeadSemitoneOffset(fader);
    if (leadPreviewSemitoneRef.current === semitone) return;
    leadPreviewSemitoneRef.current = semitone;

    const soundIndex = slotSoundIndices[slotIndex];
    void onSoloTrigger?.(slotIndex, soundIndex, fader);
  };

  const updateFaderFromPointer = (e: React.PointerEvent<SVGGElement>, slotIndex: number): number | null => {
    const node = SOUND_SLOTS[slotIndex].slider;
    const ring = slotIndex;
    const point = getSvgPoint(e);
    if (!point) return null;
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    const projected = dx * node.axisX + dy * node.axisY;
    const normalized = clamp((projected + FADER_RANGE / 2) / FADER_RANGE, 0, 1);
    dispatch({ type: 'SET_FADER', ring, value: normalized });
    return normalized;
  };

  const handleFaderDown = (e: React.PointerEvent<SVGGElement>, slotIndex: number) => {
    onFirstInteraction?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    const normalized = updateFaderFromPointer(e, slotIndex);
    if (normalized !== null) previewLeadPitchIfNeeded(slotIndex, normalized);
  };

  const handleFaderMove = (e: React.PointerEvent<SVGGElement>, slotIndex: number) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const normalized = updateFaderFromPointer(e, slotIndex);
    if (normalized !== null) previewLeadPitchIfNeeded(slotIndex, normalized);
  };

  const handleFaderUp = (e: React.PointerEvent<SVGGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    leadPreviewSemitoneRef.current = null;
  };

  useEffect(() => {
    const faceplate = faceplateRef.current;
    if (!faceplate) return;

    SOUND_SLOTS.forEach((slot, slotIndex) => {
      const ring = slotIndex;
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
  }, [faders]);

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

  const tempoAngleDeg = bpmToTempoAngle(bpm);

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
              key={`solo-button-${slotIndex}`}
              data-testid={`solo-button-${slotIndex}`}
              onPointerDown={() => handleSoloButtonPress(slotIndex)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={slot.button.x} cy={slot.button.y} r="24" fill="transparent" />
            </g>
          );
        })}

        {SOUND_SLOTS.map((slot, slotIndex) => {
          const arrows = getSlotArrowPoints(slot);

          return (
            <React.Fragment key={`solo-arrows-${slotIndex}`}>
              <g
                data-testid={`solo-arrow-back-${slotIndex}`}
                onPointerDown={() => handleCycleSlotSound(slotIndex, -1)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={arrows.backward.x} cy={arrows.backward.y} r={SLOT_ARROW_RADIUS} fill="transparent" />
              </g>
              <g
                data-testid={`solo-arrow-forward-${slotIndex}`}
                onPointerDown={() => handleCycleSlotSound(slotIndex, 1)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={arrows.forward.x} cy={arrows.forward.y} r={SLOT_ARROW_RADIUS} fill="transparent" />
              </g>
            </React.Fragment>
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
          <g
            data-testid="tempo-knob"
            onPointerDown={handleTempoKnobDown}
            onPointerMove={handleTempoKnobMove}
            onPointerUp={handleTempoKnobUp}
            onPointerCancel={handleTempoKnobUp}
            style={{ cursor: 'grab' }}
          >
            <circle cx={TEMPO_KNOB_CENTER.x} cy={TEMPO_KNOB_CENTER.y} r="8" fill="#050505" />
            <line
              x1={TEMPO_KNOB_CENTER.x - 7}
              y1={TEMPO_KNOB_CENTER.y}
              x2={TEMPO_KNOB_CENTER.x}
              y2={TEMPO_KNOB_CENTER.y}
              stroke="#D9D9D9"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${tempoAngleDeg} ${TEMPO_KNOB_CENTER.x} ${TEMPO_KNOB_CENTER.y})`}
              style={{ pointerEvents: 'none' }}
            />
          </g>
          <text
            data-testid="tempo-readout"
            x={TEMPO_KNOB_CENTER.x - 27}
            y={TEMPO_KNOB_CENTER.y - 2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="8"
            fontWeight="700"
            fill="#101010"
          >
            <tspan dy="0" dx="16" textAnchor="end">{formatTempo(bpm)}</tspan>
            <tspan dx="-18" dy="1em" textAnchor="end">bpm</tspan>
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
