interface RabbitIconProps {
  size?: number;
}

export function RabbitIcon({ size = 28 }: RabbitIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <ellipse cx="12" cy="16" rx="6" ry="5" fill="#FF6B6B" stroke="white" strokeWidth="1" />
      <ellipse cx="9" cy="6" rx="2.5" ry="6" fill="#FF6B6B" stroke="white" strokeWidth="1" />
      <ellipse cx="15" cy="6" rx="2.5" ry="6" fill="#FF6B6B" stroke="white" strokeWidth="1" />
      <ellipse cx="9" cy="6" rx="1.2" ry="4" fill="#FFB3B3" />
      <ellipse cx="15" cy="6" rx="1.2" ry="4" fill="#FFB3B3" />
      <circle cx="10" cy="15" r="1" fill="white" />
      <circle cx="14" cy="15" r="1" fill="white" />
      <ellipse cx="12" cy="17.5" rx="1.5" ry="1" fill="#FFB3B3" />
    </svg>
  );
}
