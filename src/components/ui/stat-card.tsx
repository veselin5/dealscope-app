'use client';

import { cn } from '@/lib/utils';
import { Card } from './card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, className }: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-3.5 h-3.5" />;
    if (change > 0) return <TrendingUp className="w-3.5 h-3.5" />;
    return <TrendingDown className="w-3.5 h-3.5" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500';
    if (change > 0) return 'text-emerald-500';
    return 'text-red-500';
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-gray-400 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            {icon}
          </div>
        )}
      </div>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-500/5" />
    </Card>
  );
}
