import { Action } from '../types';
import { RING_COLORS } from '../constants';

interface DiagonalFaderProps {
  ring: number;
  value: number;
  dispatch: React.Dispatch<Action>;
}

export function DiagonalFader({ ring, value, dispatch }: DiagonalFaderProps) {
  const color = RING_COLORS[ring];
  const thumbX = 10 + value * 100;

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (e.buttons === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clamped = Math.max(10, Math.min(110, x));
    const newValue = (clamped - 10) / 100;
    dispatch({ type: 'SET_FADER', ring, value: newValue });
  }

  return (
    <div style={{ transform: 'rotate(-45deg)', margin: '4px 0' }}>
      <svg
        data-testid={`fader-${ring}`}
        width="120"
        height="40"
        viewBox="0 0 120 40"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ touchAction: 'none', cursor: 'pointer' }}
      >
        <line x1="10" y1="20" x2="110" y2="20"
          stroke={color} strokeWidth="4" strokeLinecap="round" opacity={0.3} />
        <line x1="10" y1="20" x2={thumbX} y2="20"
          stroke={color} strokeWidth="4" strokeLinecap="round" />
        <circle cx={thumbX} cy="20" r="14"
          fill={color} stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
}
