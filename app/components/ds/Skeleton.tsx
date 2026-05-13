'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };

export function Skeleton({ className, width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-shimmer', roundedMap[rounded], className)}
      style={{ width, height }}
    />
  );
}
