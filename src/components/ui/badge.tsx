'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'new';
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-600',
      primary: 'bg-indigo-50 text-indigo-600',
      success: 'bg-emerald-50 text-emerald-600',
      warning: 'bg-amber-50 text-amber-600',
      error: 'bg-red-50 text-red-600',
      new: 'bg-indigo-500 text-white',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-xs px-2.5 py-1',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

interface ScoreBadgeProps extends HTMLAttributes<HTMLDivElement> {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge = forwardRef<HTMLDivElement, ScoreBadgeProps>(
  ({ className, score, size = 'md', ...props }, ref) => {
    const getScoreClass = () => {
      if (score >= 70) return 'gradient-score-high';
      if (score >= 40) return 'gradient-score-mid';
      return 'gradient-score-low';
    };

    const sizes = {
      sm: 'text-sm px-2 py-1',
      md: 'text-lg px-3 py-1.5 font-bold',
      lg: 'text-2xl px-4 py-2 font-bold',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-white shadow-md',
          getScoreClass(),
          sizes[size],
          className
        )}
        {...props}
      >
        {score}
      </div>
    );
  }
);

ScoreBadge.displayName = 'ScoreBadge';
