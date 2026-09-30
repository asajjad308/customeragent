'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  BarChart3,
  MessageCircle,
  Settings,
  HelpCircle,
  Puzzle,
  Bot,
  Zap,
  Moon,
  Sun,
  LogOut,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ds/ProgressBar';
import { Avatar } from '@/components/ds/Avatar';
import { useAppStore } from '@/store';
import { SIDEBAR_WIDTH } from '@/lib/design-system';

const navigation = [
  { name: 'Live Chat',     icon: MessageSquare },
  { name: 'Agents',        icon: Bot },
  { name: 'Analytics',     icon: BarChart3 },
  { name: 'Conversations', icon: MessageCircle },
  { name: 'Knowledge Base',icon: HelpCircle },
  { name: 'Integrations',  icon: Puzzle },
  { name: 'Settings',      icon: Settings },
];

interface SidebarProps {
  selectedNav: string;
  onNavChange: (nav: string) => void;
}

function DarkToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  }
  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}

export function Sidebar({ selectedNav, onNavChange }: SidebarProps) {
  const { analytics, settings } = useAppStore();
  const totalMessages = analytics.totalMessages;
  const limit = 10000;

  return (
    <aside
      style={{ width: SIDEBAR_WIDTH }}
      className="flex flex-col shrink-0 h-full border-r border-[var(--color-border-subtle)] bg-[var(--surface-1)]"
    >
      {/* Logo / workspace */}
      <div className="px-4 py-3.5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="brand-mark w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]">
            <Bot size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[14px] font-semibold tracking-tight text-[var(--color-text-primary)] truncate leading-tight">
              {settings.companyName || 'SupportAI'}
            </div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-2 py-2 overflow-y-auto">
        <ul className="space-y-0.5" role="menu">
          {navigation.map((item) => {
            const active = selectedNav === item.name;
            return (
              <li key={item.name} role="none">
                <button
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNavChange(item.name)}
                  className={cn(
                    'relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                    active
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-pill"
                      className="absolute inset-0 bg-[var(--color-accent-subtle)] rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <item.icon size={15} className={active ? 'text-[var(--color-accent)]' : ''} />
                    {item.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Usage + user footer */}
      <div className="px-3 py-3 border-t border-[var(--color-border-subtle)] space-y-3">
        <div className="px-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
              <Zap size={11} className="text-[var(--accent-violet)]" />
              Usage
            </div>
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-numeric">
              {totalMessages.toLocaleString()}/{limit.toLocaleString()}
            </span>
          </div>
          <ProgressBar
            value={totalMessages}
            max={limit}
            size="sm"
            color={totalMessages / limit > 0.85 ? 'danger' : totalMessages / limit > 0.6 ? 'warning' : 'accent'}
          />
          {totalMessages / limit > 0.8 && (
            <button
              onClick={() => onNavChange('Settings')}
              className="mt-1 text-[11px] font-medium text-[var(--warning)] hover:underline"
            >
              Upgrade plan →
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Avatar name={settings.companyName} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[var(--color-text-primary)] truncate leading-tight">
              {settings.companyName || 'Account'}
            </div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">Pro plan</div>
          </div>
          <DarkToggle />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
