'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--color-border-subtle)]', className)}>
      <div>
        <h1 className="text-[16px] font-semibold text-[var(--color-text-primary)] leading-tight">{title}</h1>
        {description && <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
