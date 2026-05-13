'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, Code2, MessageSquare, Link2, Cpu, Activity } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Badge } from '@/components/ds/Badge';
import { Tabs } from '@/components/ds/Tabs';
import { AgentConnections } from './AgentConnections';
import { AgentEmbedCode } from './AgentEmbedCode';
import { slideInRight } from '@/lib/animations';
import { agentTypeColors, agentStatusColors, DETAIL_WIDTH } from '@/lib/design-system';
import type { Agent, AgentStatus } from '@/store/agentsStore';

const STATUS_VARIANT: Record<AgentStatus, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success', PAUSED: 'warning', DRAFT: 'default', ARCHIVED: 'danger',
};

const TABS = [
  { id: 'overview',     label: 'Overview',    icon: <Activity size={12} /> },
  { id: 'connections',  label: 'Connections', icon: <Link2 size={12} /> },
  { id: 'embed',        label: 'Embed',       icon: <Code2 size={12} /> },
];

interface AgentDetailPanelProps {
  agent: Agent;
  allAgents: Agent[];
  onClose: () => void;
  onEdit: () => void;
  onChatPreview: () => void;
}

export function AgentDetailPanel({ agent, allAgents, onClose, onEdit, onChatPreview }: AgentDetailPanelProps) {
  const typePalette = agentTypeColors[agent.typeId] ?? agentTypeColors.CUSTOM;
  const statusPalette = agentStatusColors[agent.status];

  return (
    <motion.aside
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ width: DETAIL_WIDTH }}
      className="flex flex-col shrink-0 h-full bg-[var(--surface-0)] border-l border-[var(--color-border-subtle)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
            style={{ backgroundColor: agent.avatarColor || typePalette.base }}
          >
            {agent.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate">{agent.name}</div>
            <div className="flex items-center gap-1.5">
              <Badge variant={STATUS_VARIANT[agent.status]} dot size="sm">{statusPalette.label}</Badge>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">{typePalette.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="xs" onClick={onEdit} iconLeft={<Edit2 size={12} />}>Edit</Button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: typePalette.base }} />

      {/* Tabs content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Tabs tabs={TABS} className="p-4">
          {(activeTab) => (
            <div className="space-y-4">
              {activeTab === 'overview' && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Messages', value: agent.messageCount ?? 0 },
                      { label: 'Sessions', value: agent.sessions ?? 0 },
                      { label: 'Satisfaction', value: agent.satisfaction != null ? `${Math.round(agent.satisfaction * 100)}%` : '—' },
                      { label: 'Last Active', value: agent.lastActiveAt ? new Date(agent.lastActiveAt).toLocaleDateString() : '—' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[var(--color-bg-subtle)] rounded-xl p-3">
                        <div className="text-[16px] font-bold text-[var(--color-text-primary)] font-numeric">{stat.value}</div>
                        <div className="text-[10px] text-[var(--color-text-tertiary)]">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Model info */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
                    <Cpu size={13} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-medium text-[var(--color-text-primary)]">{agent.model ?? 'Default model'}</div>
                      <div className="text-[10px] text-[var(--color-text-tertiary)]">temp {agent.temperature ?? 0.4} · {agent.maxTokens ?? 512} max tokens</div>
                    </div>
                  </div>

                  {/* Greeting */}
                  {agent.greeting && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5">Greeting</p>
                      <div className="bg-[var(--color-bg-subtle)] rounded-xl p-3 text-[12px] text-[var(--color-text-secondary)] italic border border-[var(--color-border-subtle)]">
                        "{agent.greeting}"
                      </div>
                    </div>
                  )}

                  {/* Quick replies */}
                  {agent.quickReplies && agent.quickReplies.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5">Quick Replies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.quickReplies.map((qr) => (
                          <span key={qr} className="px-2 py-1 text-[11px] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border-subtle)]">
                            {qr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System prompt preview */}
                  {agent.systemPrompt && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5">System Prompt</p>
                      <div className="prose-prompt bg-[var(--color-bg-subtle)] rounded-xl p-3 text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] max-h-32 overflow-y-auto">
                        {agent.systemPrompt}
                      </div>
                    </div>
                  )}

                  {/* Chat preview button */}
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<MessageSquare size={13} />}
                    onClick={onChatPreview}
                    fullWidth
                  >
                    Open Chat Preview
                  </Button>
                </>
              )}

              {activeTab === 'connections' && (
                <AgentConnections agent={agent} allAgents={allAgents} />
              )}

              {activeTab === 'embed' && (
                <AgentEmbedCode agent={agent} />
              )}
            </div>
          )}
        </Tabs>
      </div>
    </motion.aside>
  );
}
