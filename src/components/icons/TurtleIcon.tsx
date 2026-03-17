interface TurtleIconProps {
  size?: number;
}

export function TurtleIcon({ size = 28 }: TurtleIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <ellipse cx="12" cy="14" rx="8" ry="5" fill="#6BCB77" />
      <ellipse cx="12" cy="14" rx="8" ry="5" fill="none" stroke="white" strokeWidth="1" />
      <circle cx="19" cy="12" r="2.5" fill="#6BCB77" stroke="white" strokeWidth="1" />
      <circle cx="20" cy="11.5" r="0.7" fill="white" />
      <line x1="6" y1="18" x2="5" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="9" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="18" x2="15" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="18" x2="19" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
