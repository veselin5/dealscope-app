'use client';

import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  showDot?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 30,
  strokeColor,
  fillColor,
  showDot = true,
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return { x, y };
    });

    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return { linePath, areaPath, lastPoint: points[points.length - 1] };
  }, [data, width, height]);

  if (!path) return null;

  // Determine color based on trend
  const isPositive = data.length >= 2 && data[data.length - 1] <= data[0];
  const defaultStroke = isPositive ? '#10B981' : '#EF4444';
  const defaultFill = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor || defaultStroke} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor || defaultStroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={path.areaPath}
        fill={fillColor || `url(#sparkline-gradient-${isPositive ? 'up' : 'down'})`}
      />

      {/* Line */}
      <path
        d={path.linePath}
        fill="none"
        stroke={strokeColor || defaultStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      {showDot && path.lastPoint && (
        <circle
          cx={path.lastPoint.x}
          cy={path.lastPoint.y}
          r="2.5"
          fill={strokeColor || defaultStroke}
        />
      )}
    </svg>
  );
}
