'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { commandPaletteVariants, backdropVariants } from '@/lib/animations';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  keywords?: string[];
  group?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  placeholder?: string;
}

export function CommandPalette({ open, onClose, commands, placeholder = 'Search...' }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.keywords?.some((k) => k.includes(q));
      })
    : commands;

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((p) => Math.min(p + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((p) => Math.max(p - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) { filtered[active].onSelect(); onClose(); }
  }, [open, filtered, active, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Group commands
  const groups = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    const g = cmd.group ?? 'Actions';
    (acc[g] ??= []).push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={commandPaletteVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-lg bg-[var(--surface-0)] rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden z-10"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <Search size={15} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {Object.keys(groups).length === 0 ? (
                <div className="py-8 text-center text-[12px] text-[var(--color-text-tertiary)]">No results</div>
              ) : (
                Object.entries(groups).map(([group, cmds]) => {
                  const globalOffset = Object.entries(groups)
                    .slice(0, Object.keys(groups).indexOf(group))
                    .reduce((sum, [, cs]) => sum + cs.length, 0);
                  return (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">{group}</div>
                      {cmds.map((cmd, i) => {
                        const idx = globalOffset + i;
                        return (
                          <button
                            key={cmd.id}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                              active === idx
                                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]',
                            )}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => { cmd.onSelect(); onClose(); }}
                          >
                            <span className="w-6 h-6 flex items-center justify-center text-[var(--color-text-tertiary)] flex-shrink-0">{cmd.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium">{cmd.label}</div>
                              {cmd.description && <div className="text-[11px] text-[var(--color-text-tertiary)] truncate">{cmd.description}</div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-[var(--color-border-subtle)] flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
              <span><kbd className="bg-[var(--color-bg-muted)] px-1 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="bg-[var(--color-bg-muted)] px-1 rounded">↵</kbd> select</span>
              <span><kbd className="bg-[var(--color-bg-muted)] px-1 rounded">Esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
