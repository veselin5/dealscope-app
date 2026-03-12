'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatPrice, formatDate } from '@/lib/utils';

interface PriceChartProps {
  data: { date: string; price: number }[];
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  areaChart?: boolean;
}

export function PriceChart({
  data,
  height = 200,
  showGrid = true,
  showAxis = true,
  areaChart = true,
}: PriceChartProps) {
  const formattedData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        formattedDate: formatDate(d.date),
      })),
    [data]
  );

  const minPrice = Math.min(...data.map((d) => d.price)) * 0.95;
  const maxPrice = Math.max(...data.map((d) => d.price)) * 1.05;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-indigo-100 rounded-xl shadow-lg p-3">
          <p className="text-sm text-gray-500 mb-1">{payload[0]?.payload?.formattedDate}</p>
          <p className="text-lg font-bold text-gray-800">{formatPrice(payload[0]?.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (areaChart) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />}
          {showAxis && (
            <>
              <XAxis
                dataKey="formattedDate"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E0E7FF' }}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatPrice(value).replace('€', '')}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />}
        {showAxis && (
          <>
            <XAxis
              dataKey="formattedDate"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E0E7FF' }}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatPrice(value).replace('€', '')}
            />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#6366F1"
          strokeWidth={2}
          dot={{ r: 4, fill: '#6366F1' }}
          activeDot={{ r: 6, fill: '#6366F1' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
