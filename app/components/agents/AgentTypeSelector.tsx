'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { agentTypeColors } from '@/lib/design-system';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { AgentType } from '@/store/agentsStore';

const TYPES: { value: AgentType; emoji: string; desc: string }[] = [
  { value: 'SUPPORT',    emoji: '🎧', desc: 'Handle customer issues & tickets' },
  { value: 'TECHNICAL',  emoji: '🔧', desc: 'Debug and solve technical problems' },
  { value: 'SALES',      emoji: '💼', desc: 'Convert leads & close deals' },
  { value: 'LEAD_GEN',   emoji: '🎯', desc: 'Qualify and capture prospects' },
  { value: 'ONBOARDING', emoji: '🚀', desc: 'Guide new users to success' },
  { value: 'HR',         emoji: '👥', desc: 'Employee & hiring assistance' },
  { value: 'BOOKING',    emoji: '📅', desc: 'Schedule appointments & calls' },
  { value: 'CUSTOM',     emoji: '✨', desc: 'Build your own custom agent' },
];

interface AgentTypeSelectorProps {
  value: AgentType;
  onChange: (type: AgentType) => void;
}

export function AgentTypeSelector({ value, onChange }: AgentTypeSelectorProps) {
  return (
    <motion.div
      variants={staggerContainer(0.03)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {TYPES.map((type) => {
        const palette = agentTypeColors[type.value];
        const selected = value === type.value;
        return (
          <motion.button
            key={type.value}
            variants={staggerItem}
            onClick={() => onChange(type.value)}
            className={cn(
              'relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all',
              selected
                ? 'border-2'
                : 'border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)]',
            )}
            style={selected ? {
              borderColor: palette.base,
              backgroundColor: palette.subtle,
            } : undefined}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ backgroundColor: selected ? palette.base : 'var(--color-bg-muted)' }}
            >
              {type.emoji}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                {palette.label}
              </div>
              <div className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">
                {type.desc}
              </div>
            </div>
            {selected && (
              <span
                className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: palette.base }}
              >
                <svg width="8" height="6" viewBox="0 0 8 6" fill="white">
                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
