import { useEffect, useRef } from 'react';
import { Action } from '../types';
import { hitTest } from '../utils/geometry';
import { HAPTIC_PAD_TAP } from '../constants';

export function usePointerHandler(
  svgRef: React.RefObject<SVGSVGElement | null>,
  dispatch: React.Dispatch<Action>,
  onFirstInteraction: () => void
) {
  const hasInitRef = useRef(false);
  // Debounce: track last toggle timestamp per pad
  const lastToggleRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handlePointerDown(e: PointerEvent) {
      e.preventDefault();
      svg!.setPointerCapture(e.pointerId);

      if (!hasInitRef.current) {
        hasInitRef.current = true;
        onFirstInteraction();
      }

      // Convert screen coordinates to SVG coordinates
      const pt = svg!.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg!.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());

      const hit = hitTest(svgPt.x, svgPt.y);
      if (hit) {
        // Debounce: ignore if same pad was toggled within 50ms
        const padKey = `${hit.ring}-${hit.step}`;
        const now = Date.now();
        const lastToggle = lastToggleRef.current.get(padKey) ?? 0;
        if (now - lastToggle < 50) return;
        lastToggleRef.current.set(padKey, now);

        dispatch({ type: 'TOGGLE_PAD', ring: hit.ring, step: hit.step });

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(HAPTIC_PAD_TAP);
      }
    }

    svg.addEventListener('pointerdown', handlePointerDown);
    return () => svg.removeEventListener('pointerdown', handlePointerDown);
  }, [svgRef, dispatch, onFirstInteraction]);
}
