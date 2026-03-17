import { useMemo } from 'react';
import { generateAllArcs } from '../utils/geometry';
import { Pad } from './Pad';
import { PatternRow } from '../types';

interface RingProps {
  ring: number;
  row: PatternRow;
  currentStep: number;
  isPlaying: boolean;
}

const allArcs = generateAllArcs();

export function Ring({ ring, row, currentStep, isPlaying }: RingProps) {
  const ringArcs = useMemo(() => allArcs.filter(a => a.ring === ring), [ring]);

  return (
    <>
      {ringArcs.map(arc => (
        <Pad
          key={`${arc.ring}-${arc.step}`}
          arc={arc}
          armed={row[arc.step]}
          triggering={isPlaying && row[arc.step] && arc.step === currentStep}
        />
      ))}
    </>
  );
}
