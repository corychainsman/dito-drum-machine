import { COLOR_BG } from '../../constants';

interface DiceIconProps {
  size?: number;
}

export function DiceIcon({ size = 28 }: DiceIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="white" opacity="0.9" />
      <circle cx="8" cy="8" r="1.5" fill={COLOR_BG} />
      <circle cx="16" cy="8" r="1.5" fill={COLOR_BG} />
      <circle cx="8" cy="16" r="1.5" fill={COLOR_BG} />
      <circle cx="16" cy="16" r="1.5" fill={COLOR_BG} />
      <circle cx="12" cy="12" r="1.5" fill={COLOR_BG} />
    </svg>
  );
}
