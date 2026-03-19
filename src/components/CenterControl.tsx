import React from 'react';
import { Action, Transport } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';

interface CenterControlProps {
  transport: Transport;
  dispatch: React.Dispatch<Action>;
  onFirstInteraction?: () => void;
  cx?: number;
  cy?: number;
  radius?: number;
}

export function CenterControl({
  transport,
  dispatch,
  onFirstInteraction,
  cx = 200,
  cy = 200,
  radius = 35,
}: CenterControlProps) {
  const isPlaying = transport === 'playing';

  function handlePointerDown(e: React.PointerEvent<SVGGElement>) {
    // Stop propagation so the parent SVG pointer handler doesn't interfere
    e.stopPropagation();
    // Must call init here (synchronously in gesture) for iOS AudioContext
    onFirstInteraction?.();
    if (isPlaying) {
      dispatch({ type: 'STOP' });
    } else {
      dispatch({ type: 'PLAY' });
    }
  }

  return (
    <g
      data-testid="center-control"
      onPointerDown={handlePointerDown}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />
      {isPlaying ? (
        <StopIcon cx={cx} cy={cy} size={radius * 0.6} />
      ) : (
        <PlayIcon cx={cx} cy={cy} size={radius * 0.7} />
      )}
    </g>
  );
}
