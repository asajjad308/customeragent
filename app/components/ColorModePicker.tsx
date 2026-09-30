'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorMode = 'light' | 'dark' | 'system';

const MODES: { key: ColorMode; label: string; icon: typeof Sun }[] = [
  { key: 'light',  label: 'Light',  icon: Sun },
  { key: 'dark',   label: 'Dark',   icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
];

// Same storage key and rules as the inline script in app/layout.tsx
function applyColorMode(mode: ColorMode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  try {
    if (mode === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', mode);
  } catch {}
}

export function ColorModePicker() {
  const [mode, setMode] = useState<ColorMode>('system');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') setMode(stored);
    } catch {}
  }, []);

  return (
    <div role="radiogroup" aria-label="Colour mode" className="grid grid-cols-3 gap-2">
      {MODES.map(({ key, label, icon: Icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => { setMode(key); applyColorMode(key); }}
            className={cn(
              'p-3 rounded-xl border text-left transition-all text-xs',
              active
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent)]'
                : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
            )}
          >
            <div
              className={cn(
                'w-full h-10 rounded-lg mb-2 border border-[var(--color-border-subtle)] flex items-center justify-center',
                key === 'light' && 'bg-[#FAFBFF] text-[#4F46E5]',
                key === 'dark' && 'bg-[#0B1020] text-[#A5B4FC]',
                key === 'system' && 'bg-[linear-gradient(90deg,#FAFBFF_50%,#0B1020_50%)] text-[#7C3AED]',
              )}
            >
              <Icon size={16} />
            </div>
            <div className="font-medium text-[var(--color-text-primary)]">{label}</div>
          </button>
        );
      })}
    </div>
  );
}
