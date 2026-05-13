'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  color?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

const trackHeight = { sm: 'h-1', md: 'h-1.5' };
const fillColors = {
  accent:  'bg-[var(--color-accent)]',
  success: 'bg-[#16A34A]',
  warning: 'bg-[#D97706]',
  danger:  'bg-[#DC2626]',
};

export function ProgressBar({ value, max = 100, label, showValue, size = 'md', color = 'accent', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-[11px] text-[var(--color-text-secondary)]">{label}</span>}
          {showValue && <span className="text-[11px] text-[var(--color-text-tertiary)] font-numeric">{value}/{max}</span>}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-[var(--color-bg-muted)] overflow-hidden', trackHeight[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillColors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
