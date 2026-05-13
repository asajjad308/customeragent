'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, iconLeft, iconRight, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {iconLeft && (
            <span className="absolute left-2.5 text-[var(--color-text-tertiary)] pointer-events-none flex items-center">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-8 text-[13px] rounded-lg border bg-[var(--color-bg-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-colors',
              'border-[var(--color-border-default)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]',
              error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]',
              iconLeft ? 'pl-8' : 'pl-3',
              iconRight ? 'pr-8' : 'pr-3',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-2.5 text-[var(--color-text-tertiary)] flex items-center">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-[11px] text-[#DC2626]">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
