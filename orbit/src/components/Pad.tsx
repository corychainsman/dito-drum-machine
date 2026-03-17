import { ArcDescriptor } from '../types';
import { COLOR_PAD_OFF, RING_COLORS } from '../constants';

interface PadProps {
  arc: ArcDescriptor;
  armed: boolean;
  triggering: boolean;
}

export function Pad({ arc, armed, triggering }: PadProps) {
  const fill = armed ? RING_COLORS[arc.ring] : COLOR_PAD_OFF;
  const opacity = triggering ? 1.0 : armed ? 0.8 : 1.0;
  const filter = triggering ? 'url(#glow)' : 'none';

  return (
    <path
      data-testid={`pad-${arc.ring}-${arc.step}`}
      className={`pad${triggering ? ' triggering' : ''}`}
      d={arc.path}
      fill={fill}
      opacity={opacity}
      filter={filter}
      stroke={armed ? 'none' : RING_COLORS[arc.ring]}
      strokeWidth={armed ? 0 : 0.5}
      strokeOpacity={0.2}
      style={{
        ['--cx' as string]: `${arc.centroidX}px`,
        ['--cy' as string]: `${arc.centroidY}px`,
        cursor: 'pointer',
      }}
      role="switch"
      aria-checked={armed}
      aria-label={`ring ${arc.ring}, step ${arc.step + 1}, ${armed ? 'on' : 'off'}`}
    />
  );
}
