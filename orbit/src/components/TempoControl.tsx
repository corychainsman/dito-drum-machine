import { Action } from '../types';
import { TurtleIcon } from './icons/TurtleIcon';
import { RabbitIcon } from './icons/RabbitIcon';
import { MIN_BPM, MAX_BPM, BPM_STEP } from '../constants';

interface TempoControlProps {
  bpm: number;
  dispatch: React.Dispatch<Action>;
}

export function TempoControl({ bpm, dispatch }: TempoControlProps) {
  function handleTurtle() {
    dispatch({ type: 'SET_BPM', bpm: Math.max(MIN_BPM, bpm - BPM_STEP) });
  }

  function handleRabbit() {
    dispatch({ type: 'SET_BPM', bpm: Math.min(MAX_BPM, bpm + BPM_STEP) });
  }

  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        data-testid="tempo-turtle"
        onClick={handleTurtle}
        style={btnStyle}
        aria-label={`Decrease tempo (${bpm} BPM)`}
      >
        <TurtleIcon size={20} />
      </button>

      <div style={{ textAlign: 'center' }}>
        <div
          data-testid="tempo-dot"
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.8,
            margin: '0 auto',
            animationName: 'pulse',
            animationDuration: `${60 / bpm}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
        />
      </div>

      <button
        data-testid="tempo-rabbit"
        onClick={handleRabbit}
        style={btnStyle}
        aria-label={`Increase tempo (${bpm} BPM)`}
      >
        <RabbitIcon size={20} />
      </button>
    </div>
  );
}
