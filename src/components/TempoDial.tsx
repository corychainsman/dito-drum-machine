import { useRef } from 'react';
import React from 'react';
import { Action } from '../types';
import { MIN_BPM, MAX_BPM } from '../constants';
import { clamp, getSvgPoint } from '../utils/svgUtils';

interface TempoDragState {
  pointerId: number;
  startAxisProjection: number;
  startAngleDeg: number;
}

interface TempoDialProps {
  bpm: number;
  dispatch: React.Dispatch<Action>;
  onFirstInteraction?: () => void;
}

const TEMPO_KNOB_CENTER = { x: 302, y: 212 };
const TEMPO_KNOB_MIN_DEG = -180;
const TEMPO_KNOB_MAX_DEG = 180;
const TEMPO_KNOB_CENTER_BPM = 97.5;
const TEMPO_DRAG_DEGREES_PER_UNIT = 1;

function bpmToTempoAngle(bpm: number): number {
  const clampedBpm = clamp(bpm, MIN_BPM, MAX_BPM);
  if (clampedBpm <= TEMPO_KNOB_CENTER_BPM) {
    const ratio = (clampedBpm - MIN_BPM) / (TEMPO_KNOB_CENTER_BPM - MIN_BPM);
    return TEMPO_KNOB_MIN_DEG + ratio * (0 - TEMPO_KNOB_MIN_DEG);
  }
  const ratio = (clampedBpm - TEMPO_KNOB_CENTER_BPM) / (MAX_BPM - TEMPO_KNOB_CENTER_BPM);
  return ratio * TEMPO_KNOB_MAX_DEG;
}

function tempoAngleToBpm(angleDeg: number): number {
  const clampedAngle = clamp(angleDeg, TEMPO_KNOB_MIN_DEG, TEMPO_KNOB_MAX_DEG);
  if (clampedAngle <= 0) {
    const ratio = (clampedAngle - TEMPO_KNOB_MIN_DEG) / (0 - TEMPO_KNOB_MIN_DEG);
    return MIN_BPM + ratio * (TEMPO_KNOB_CENTER_BPM - MIN_BPM);
  }
  const ratio = clampedAngle / TEMPO_KNOB_MAX_DEG;
  return TEMPO_KNOB_CENTER_BPM + ratio * (MAX_BPM - TEMPO_KNOB_CENTER_BPM);
}

function projectToTempoAxis(point: { x: number; y: number }): number {
  const dx = point.x - TEMPO_KNOB_CENTER.x;
  const dy = point.y - TEMPO_KNOB_CENTER.y;
  return (dx - dy) / Math.SQRT2;
}

export function TempoDial({ bpm, dispatch, onFirstInteraction }: TempoDialProps) {
  const dragRef = useRef<TempoDragState | null>(null);
  const angleDeg = bpmToTempoAngle(bpm);

  const handleDown = (e: React.PointerEvent<SVGGElement>) => {
    onFirstInteraction?.();
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = getSvgPoint(e);
    if (!point) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startAxisProjection: projectToTempoAxis(point),
      startAngleDeg: bpmToTempoAngle(bpm),
    };
  };

  const handleMove = (e: React.PointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
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
    if (nextBpm !== bpm) dispatch({ type: 'SET_BPM', bpm: nextBpm });
  };

  const handleUp = (e: React.PointerEvent<SVGGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <g data-testid="tempo-control">
      <g
        data-testid="tempo-knob"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
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
          transform={`rotate(${angleDeg} ${TEMPO_KNOB_CENTER.x} ${TEMPO_KNOB_CENTER.y})`}
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
        <tspan dy="0" dx="16" textAnchor="end">{String(Math.round(bpm))}</tspan>
        <tspan dx="-18" dy="1em" textAnchor="end">bpm</tspan>
      </text>
    </g>
  );
}
