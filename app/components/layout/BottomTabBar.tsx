'use client';

import { MessageSquare, BarChart3, Bot, Settings, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Live Chat',     icon: MessageSquare },
  { name: 'Agents',        icon: Bot },
  { name: 'Analytics',     icon: BarChart3 },
  { name: 'Conversations', icon: MessageCircle },
  { name: 'Settings',      icon: Settings },
];

interface BottomTabBarProps {
  selectedNav: string;
  onNavChange: (nav: string) => void;
}

export function BottomTabBar({ selectedNav, onNavChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden border-t border-[var(--color-border-subtle)] bg-[var(--surface-0)] safe-area-inset-bottom">
      {tabs.map((tab) => {
        const active = selectedNav === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => onNavChange(tab.name)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
              active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]',
            )}
          >
            <tab.icon size={18} />
            <span>{tab.name.split(' ')[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}
