'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  className?: string;
  iconOnly?: boolean;
  children?: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, activeTab: controlledTab, onTabChange, className, iconOnly, children }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.id);
  const active = controlledTab ?? internalTab;

  function handleChange(id: string) {
    setInternalTab(id);
    onTabChange?.(id);
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-0.5 p-1 bg-[var(--color-bg-subtle)] rounded-xl w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            title={iconOnly ? tab.label : undefined}
            className={cn(
              'relative flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-lg transition-colors z-10 flex-1',
              iconOnly ? 'px-2 py-2' : 'px-3 py-1.5',
              active === tab.id
                ? 'text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
            )}
          >
            {active === tab.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 bg-[var(--surface-0)] rounded-lg shadow-sm border border-[var(--color-border-subtle)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {!iconOnly && tab.label}
              {!iconOnly && tab.badge != null && (
                <span className="text-[10px] bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)] rounded-full px-1.5 py-0.5 font-numeric">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      {children && <div className="mt-4">{children(active)}</div>}
    </div>
  );
}
