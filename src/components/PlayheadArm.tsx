interface PlayheadArmProps {
  angleDeg?: number;
}

export function PlayheadArm({ angleDeg = 0 }: PlayheadArmProps) {
  return (
    <line
      x1="200"
      y1="200"
      x2="200"
      y2="5"
      stroke="white"
      strokeOpacity="0.7"
      strokeWidth="3"
      strokeLinecap="round"
      filter="url(#playhead-glow)"
      style={{
        transform: `rotate(${angleDeg}deg)`,
        transformOrigin: '200px 200px',
      }}
    />
  );
}
