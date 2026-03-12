'use client';

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getSourceLabel } from '@/lib/utils';

interface PieChartProps {
  data: { name: string; value: number }[];
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
];

export function SourcePieChart({
  data,
  height = 250,
  showLegend = true,
  showLabels = false,
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    displayName: getSourceLabel(d.name),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-indigo-100 rounded-xl shadow-lg p-3">
          <p className="text-sm font-medium text-gray-800">{payload[0]?.payload?.displayName}</p>
          <p className="text-lg font-bold text-indigo-500">{payload[0]?.value} listings</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-500">{entry.payload.displayName}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="displayName"
          label={showLabels ? ({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%` : undefined}
          labelLine={false}
        >
          {formattedData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
