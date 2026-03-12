'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({ label, onRemove, active, onClick, className }: FilterChipProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'filter-chip',
        active && 'active',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-white"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
