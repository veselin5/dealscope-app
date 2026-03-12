'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-indigo-100 animate-fadeIn">
      <Skeleton className="w-40 h-32 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-8 w-24 ml-auto" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-5 bg-white rounded-2xl border border-indigo-100">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}
