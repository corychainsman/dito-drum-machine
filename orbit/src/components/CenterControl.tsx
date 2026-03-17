import React from 'react';
import { Action, Transport } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';

interface CenterControlProps {
  transport: Transport;
  dispatch: React.Dispatch<Action>;
}

export function CenterControl({ transport, dispatch }: CenterControlProps) {
  const isPlaying = transport === 'playing';

  function handlePointerDown(e: React.PointerEvent<SVGGElement>) {
    // Stop propagation so the parent SVG pointer handler doesn't interfere
    e.stopPropagation();
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
        cx="200"
        cy="200"
        r="35"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />
      {isPlaying ? <StopIcon /> : <PlayIcon />}
    </g>
  );
}
