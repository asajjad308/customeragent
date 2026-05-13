'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Play, Pause, Archive, Trash2, Edit2, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ds/Badge';
import { agentTypeColors, agentStatusColors } from '@/lib/design-system';
import type { Agent, AgentStatus } from '@/store/agentsStore';

const STATUS_VARIANT: Record<AgentStatus, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success', PAUSED: 'warning', DRAFT: 'default', ARCHIVED: 'danger',
};

interface AgentCardProps {
  agent: Agent;
  selected?: boolean;
  onClick: () => void;
  onEdit: () => void;
  onStatusChange: (status: AgentStatus) => void;
  onDelete: () => void;
}

export function AgentCard({ agent, selected, onClick, onEdit, onStatusChange, onDelete }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typePalette = agentTypeColors[agent.typeId] ?? agentTypeColors.CUSTOM;
  const statusPalette = agentStatusColors[agent.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={cn(
        'relative flex flex-col rounded-xl border overflow-hidden cursor-pointer transition-all group',
        selected
          ? 'border-[var(--color-accent)] shadow-md ring-1 ring-[var(--color-accent)]/20'
          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] hover:shadow-sm',
        'bg-[var(--surface-0)]',
      )}
    >
      {/* Color top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: typePalette.base }} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
              style={{ backgroundColor: agent.avatarColor || typePalette.base }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{agent.name}</div>
              <div className="text-[11px] text-[var(--color-text-tertiary)]">{typePalette.label}</div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)] opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 w-40 bg-[var(--surface-0)] border border-[var(--color-border-subtle)] rounded-xl shadow-lg overflow-hidden">
                  <button onClick={() => { onEdit(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]">
                    <Edit2 size={12} /> Edit
                  </button>
                  {agent.status === 'ACTIVE' ? (
                    <button onClick={() => { onStatusChange('PAUSED'); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]">
                      <Pause size={12} /> Pause
                    </button>
                  ) : (
                    <button onClick={() => { onStatusChange('ACTIVE'); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]">
                      <Play size={12} /> Activate
                    </button>
                  )}
                  <button onClick={() => { onStatusChange('ARCHIVED'); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)]">
                    <Archive size={12} /> Archive
                  </button>
                  <div className="border-t border-[var(--color-border-subtle)]" />
                  <button onClick={() => { onDelete(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#DC2626] hover:bg-[#FEF2F2]">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status + badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={STATUS_VARIANT[agent.status]} dot size="sm">
            {statusPalette.label}
          </Badge>
          {agent.model && (
            <Badge variant="outline" size="sm">
              <Zap size={9} className="mr-0.5" />
              {agent.model.split('-').slice(0, 2).join(' ')}
            </Badge>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[var(--color-bg-subtle)] rounded-lg px-2.5 py-1.5">
            <div className="text-[16px] font-semibold text-[var(--color-text-primary)] font-numeric">{agent.messageCount ?? 0}</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">Messages</div>
          </div>
          <div className="bg-[var(--color-bg-subtle)] rounded-lg px-2.5 py-1.5">
            <div className="text-[16px] font-semibold text-[var(--color-text-primary)] font-numeric">{agent.sessions ?? 0}</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">Sessions</div>
          </div>
        </div>

        {/* Greeting preview */}
        {agent.greeting && (
          <div className="flex items-start gap-2">
            <MessageSquare size={11} className="text-[var(--color-text-tertiary)] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-[var(--color-text-tertiary)] line-clamp-2 italic">"{agent.greeting}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
