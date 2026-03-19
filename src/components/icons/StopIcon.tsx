interface StopIconProps {
  cx?: number;
  cy?: number;
  size?: number;
}

export function StopIcon({ cx = 200, cy = 200, size = 20 }: StopIconProps) {
  const x = cx - size / 2;
  const y = cy - size / 2;
  const radius = Math.max(2, size * 0.1);

  return (
    <rect
      data-testid="stop-icon"
      x={x}
      y={y}
      width={size}
      height={size}
      rx={radius}
      fill="white"
    />
  );
}
