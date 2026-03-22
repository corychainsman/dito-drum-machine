import React, { useEffect, useRef, useState } from 'react';
import { Action, Faders, Point } from '../types';
import { RING_COLORS, SOLO_SOUND_COUNT } from '../constants';
import { mapLeadSemitoneOffset } from '../audio/voices';
import { clamp, getSvgPoint } from '../utils/svgUtils';

interface FaderNode extends Point {
  axisX: number;
  axisY: number;
}

interface SoundSlot {
  button: Point;
  slider: FaderNode;
  sliderElement: number;
}

interface SoloControlsProps {
  faders: Faders;
  dispatch: React.Dispatch<Action>;
  faceplateRef: React.RefObject<SVGGElement | null>;
  onFirstInteraction?: () => void;
  onSoloTrigger?: (slotIndex: number, soundIndex: number, fader: number) => void | Promise<void>;
}

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

export function SoloControls({ faders, dispatch, faceplateRef, onFirstInteraction, onSoloTrigger }: SoloControlsProps) {
  const [slotSoundIndices, setSlotSoundIndices] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const thumbBaseTransforms = useRef<string[]>([]);
  const leadPreviewSemitoneRef = useRef<number | null>(null);

  // Sync fader thumb positions and button colors into the faceplate SVG DOM
  useEffect(() => {
    const faceplate = faceplateRef.current;
    if (!faceplate) return;

    SOUND_SLOTS.forEach((slot, slotIndex) => {
      const color = RING_COLORS[slotIndex];
      const offset = (faders[slotIndex] - 0.5) * FADER_RANGE;

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
  }, [faders, faceplateRef]);

  const updateFaderFromPointer = (e: React.PointerEvent<SVGGElement>, slotIndex: number): number | null => {
    const node = SOUND_SLOTS[slotIndex].slider;
    const point = getSvgPoint(e);
    if (!point) return null;
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    const projected = dx * node.axisX + dy * node.axisY;
    const normalized = clamp((projected + FADER_RANGE / 2) / FADER_RANGE, 0, 1);
    dispatch({ type: 'SET_FADER', ring: slotIndex, value: normalized });
    return normalized;
  };

  const previewLeadPitchIfNeeded = (slotIndex: number, fader: number) => {
    if (slotIndex !== LEAD_SLOT_INDEX) return;
    const semitone = mapLeadSemitoneOffset(fader);
    if (leadPreviewSemitoneRef.current === semitone) return;
    leadPreviewSemitoneRef.current = semitone;
    void onSoloTrigger?.(slotIndex, slotSoundIndices[slotIndex], fader);
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

  const handleSoloButtonPress = (slotIndex: number) => {
    onFirstInteraction?.();
    void onSoloTrigger?.(slotIndex, slotSoundIndices[slotIndex], faders[slotIndex]);
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const handleCycleSlotSound = (slotIndex: number, direction: -1 | 1) => {
    onFirstInteraction?.();
    setSlotSoundIndices((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[slotIndex] = (next[slotIndex] + direction + SOLO_SOUND_COUNT) % SOLO_SOUND_COUNT;
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(8);
  };

  return (
    <>
      <g data-testid="fader-tray">
        {SOUND_SLOTS.map((slot, slotIndex) => (
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
        ))}
      </g>

      {SOUND_SLOTS.map((slot, slotIndex) => (
        <g
          key={`solo-button-${slotIndex}`}
          data-testid={`solo-button-${slotIndex}`}
          onPointerDown={() => handleSoloButtonPress(slotIndex)}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={slot.button.x} cy={slot.button.y} r="24" fill="transparent" />
        </g>
      ))}

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
    </>
  );
}
