import { Action } from '../types';
import { RING_COLORS } from '../constants';

interface DiagonalFaderProps {
  ring: number;
  value: number;
  dispatch: React.Dispatch<Action>;
}

export function DiagonalFader({ ring, value, dispatch }: DiagonalFaderProps) {
  const color = RING_COLORS[ring];
  const thumbX = 20 + value * 100;

  function getSvgX(e: React.PointerEvent<SVGSVGElement>): number {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return thumbX;
    const m = new DOMMatrix([ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f]);
    const pt = m.inverse().transformPoint(new DOMPoint(e.clientX, e.clientY));
    return isNaN(pt.x) ? thumbX : pt.x;
  }

  function updateFader(e: React.PointerEvent<SVGSVGElement>) {
    const x = getSvgX(e);
    const clamped = Math.max(20, Math.min(120, x));
    dispatch({ type: 'SET_FADER', ring, value: (clamped - 20) / 100 });
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFader(e);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFader(e);
  }

  return (
    <div style={{ margin: '4px 0', touchAction: 'none' }}>
      <svg
        data-testid={`fader-${ring}`}
        width="140"
        height="56"
        viewBox="0 0 140 56"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ touchAction: 'none', cursor: 'pointer' }}
      >
        <rect x="0" y="0" width="140" height="56" fill="transparent" />
        <line x1="20" y1="28" x2="120" y2="28" stroke={color} strokeWidth="6" strokeLinecap="round" opacity={0.3} />
        <line x1="20" y1="28" x2={thumbX} y2="28" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <circle cx={thumbX} cy="28" r="16" fill={color} stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
}
