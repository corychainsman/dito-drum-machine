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

  function getSvgX(e: React.PointerEvent<SVGSVGElement>): number {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return thumbX;
    // DOMMatrix.inverse() is safe (returns NaN values on singular matrix);
    // SVGMatrix.inverse() throws DOMException which would crash the React tree.
    const m = new DOMMatrix([ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f]);
    const pt = m.inverse().transformPoint(new DOMPoint(e.clientX, e.clientY));
    return isNaN(pt.x) ? thumbX : pt.x;
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const x = getSvgX(e);
    const clamped = Math.max(10, Math.min(110, x));
    dispatch({ type: 'SET_FADER', ring, value: (clamped - 10) / 100 });
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const x = getSvgX(e);
    const clamped = Math.max(10, Math.min(110, x));
    dispatch({ type: 'SET_FADER', ring, value: (clamped - 10) / 100 });
  }

  return (
    <div style={{ transform: 'rotate(-45deg)', margin: '4px 0', touchAction: 'none' }}>
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
