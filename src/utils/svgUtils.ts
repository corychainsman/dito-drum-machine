import React from 'react';
import { Point } from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getSvgPoint<T extends SVGElement>(e: React.PointerEvent<T>): Point | null {
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
