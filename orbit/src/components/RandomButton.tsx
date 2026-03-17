import { Action } from '../types';
import { DiceIcon } from './icons/DiceIcon';
import { HAPTIC_RANDOM } from '../constants';

interface RandomButtonProps {
  dispatch: React.Dispatch<Action>;
}

export function RandomButton({ dispatch }: RandomButtonProps) {
  function handleClick() {
    dispatch({ type: 'RANDOMIZE' });
    if (navigator.vibrate) navigator.vibrate(HAPTIC_RANDOM);
  }

  return (
    <button
      data-testid="random-button"
      onClick={handleClick}
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
      <DiceIcon size={28} />
    </button>
  );
}
