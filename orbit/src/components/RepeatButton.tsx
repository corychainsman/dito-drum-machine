import { Action } from '../types';
import { LoopIcon } from './icons/LoopIcon';

interface RepeatButtonProps {
  dispatch: React.Dispatch<Action>;
}

export function RepeatButton({ dispatch }: RepeatButtonProps) {
  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dispatch({ type: 'SET_REPEAT', active: true });
  }

  function handlePointerUp() {
    dispatch({ type: 'SET_REPEAT', active: false });
  }

  return (
    <button
      data-testid="repeat-button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <LoopIcon size={28} />
    </button>
  );
}
