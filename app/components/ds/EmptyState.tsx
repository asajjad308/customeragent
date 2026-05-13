'use client';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 px-6 text-center', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-tertiary)]">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{title}</p>
        {description && <p className="text-[12px] text-[var(--color-text-tertiary)] max-w-[260px]">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
