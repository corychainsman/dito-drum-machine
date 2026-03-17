import { Action, Faders } from '../types';
import { DiagonalFader } from './DiagonalFader';
import { NUM_RINGS } from '../constants';

interface FaderTrayProps {
  faders: Faders;
  dispatch: React.Dispatch<Action>;
}

export function FaderTray({ faders, dispatch }: FaderTrayProps) {
  return (
    <div
      data-testid="fader-tray"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        width: '100%',
      }}
    >
      {Array.from({ length: NUM_RINGS }, (_, ring) => (
        <DiagonalFader
          key={ring}
          ring={ring}
          value={faders[ring]}
          dispatch={dispatch}
        />
      ))}
    </div>
  );
}
