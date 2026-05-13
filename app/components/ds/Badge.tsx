'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]',
  success:  'bg-[#F0FDF4] text-[#16A34A] dark:bg-[#052e16] dark:text-[#4ade80]',
  warning:  'bg-[#FFFBEB] text-[#D97706] dark:bg-[#1c1100] dark:text-[#fbbf24]',
  danger:   'bg-[#FEF2F2] text-[#DC2626] dark:bg-[#1c0000] dark:text-[#f87171]',
  info:     'bg-[#ECFEFF] text-[#0891B2] dark:bg-[#001a1e] dark:text-[#22d3ee]',
  accent:   'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
  outline:  'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] bg-transparent',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-text-tertiary)]',
  success: 'bg-[#16A34A]',
  warning: 'bg-[#D97706]',
  danger:  'bg-[#DC2626]',
  info:    'bg-[#0891B2]',
  accent:  'bg-[var(--color-accent)]',
  outline: 'bg-[var(--color-text-tertiary)]',
};

export function Badge({ children, variant = 'default', size = 'md', dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}
