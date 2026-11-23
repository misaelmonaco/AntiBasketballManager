import React from 'react';

export interface RadarAxis {
  label: string;
  val: number;
}

export const PlayerRadarChart: React.FC<{
  axes: RadarAxis[];
  dimmed: boolean;
}> = ({ axes, dimmed }) => {
  const cx = 120;
  const cy = 115;
  const rMax = 76;
  const n = axes.length;

  const pointAt = (idx: number, ratio: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * rMax * ratio,
      y: cy + Math.sin(angle) * rMax * ratio,
    };
  };

  const polygonPoints = axes
    .map((ax, i) => {
      const p = pointAt(i, Math.max(0.15, Math.min(1, ax.val / 100)));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 240 230" className={`w-60 h-56 ${dimmed ? 'opacity-65' : ''}`}>
      {[0.33, 0.66, 1].map((ring) => (
        <polygon
          key={ring}
          points={axes
            .map((_, i) => {
              const p = pointAt(i, ring);
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="#334155"
          strokeWidth="1"
        />
      ))}
      {axes.map((ax, i) => {
        const edge = pointAt(i, 1);
        const lbl = pointAt(i, 1.24);
        return (
          <g key={ax.label}>
            <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="#334155" strokeWidth="1" />
            <text
              x={lbl.x}
              y={lbl.y}
              fill="#cbd5e1"
              fontSize="9.5"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {ax.label}
            </text>
          </g>
        );
      })}
      <polygon
        points={polygonPoints}
        fill="rgba(249, 115, 22, 0.35)"
        stroke="#f97316"
        strokeWidth="2"
      />
    </svg>
  );
};
