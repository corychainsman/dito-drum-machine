import React, { useRef } from 'react';
import { Pattern, Action, Transport } from '../types';
import { NUM_RINGS, COLOR_FIELD } from '../constants';
import { Ring } from './Ring';
import { CenterControl } from './CenterControl';
import { PlayheadArm } from './PlayheadArm';
import { usePointerHandler } from '../hooks/usePointerHandler';

interface RadialSequencerProps {
  pattern: Pattern;
  currentStep: number;
  transport: Transport;
  dispatch: React.Dispatch<Action>;
  onFirstInteraction?: () => void;
}

export function RadialSequencer({
  pattern,
  currentStep,
  transport,
  dispatch,
  onFirstInteraction,
}: RadialSequencerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isPlaying = transport === 'playing';

  usePointerHandler(svgRef, dispatch, onFirstInteraction ?? (() => {}));

  return (
    <svg
      ref={svgRef}
      data-testid="sequencer-svg"
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      style={{ display: 'block', touchAction: 'none' }}
      touch-action="none"
      role="grid"
      aria-label="Drum pattern editor"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="playhead-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* Background field */}
      <circle cx="200" cy="200" r="195" fill={COLOR_FIELD} />

      {/* 40 pad arcs: 5 rings × 8 steps */}
      {Array.from({ length: NUM_RINGS }, (_, ring) => (
        <Ring
          key={ring}
          ring={ring}
          row={pattern[ring]}
          currentStep={currentStep}
          isPlaying={isPlaying}
        />
      ))}

      {/* Playhead (static in Phase 1 — animation in Phase 2) */}
      <PlayheadArm angleDeg={0} />

      {/* Center play/stop button */}
      <CenterControl transport={transport} dispatch={dispatch} onFirstInteraction={onFirstInteraction} />
    </svg>
  );
}
