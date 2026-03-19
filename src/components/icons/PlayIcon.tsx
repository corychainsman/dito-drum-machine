interface PlayIconProps {
  cx?: number;
  cy?: number;
  size?: number;
}

export function PlayIcon({ cx = 200, cy = 200, size = 24 }: PlayIconProps) {
  const leftX = cx - size * 0.25;
  const tipX = cx + size * 0.5;
  const topY = cy - size * 0.5;
  const bottomY = cy + size * 0.5;

  return (
    <polygon
      data-testid="play-icon"
      points={`${leftX},${topY} ${leftX},${bottomY} ${tipX},${cy}`}
      fill="white"
    />
  );
}
