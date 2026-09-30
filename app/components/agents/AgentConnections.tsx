'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Select } from '@/components/ds/Select';
import { Input } from '@/components/ds/Input';
import { EmptyState } from '@/components/ds/EmptyState';
import { useAgentsStore, type Agent, type AgentConnection } from '@/store/agentsStore';
import { fadeIn } from '@/lib/animations';
import { agentTypeColors } from '@/lib/design-system';

interface AgentConnectionsProps {
  agent: Agent;
  allAgents: Agent[];
}

export function AgentConnections({ agent, allAgents }: AgentConnectionsProps) {
  const { connections: connectionsMap, addConnection, removeConnection } = useAgentsStore();
  const [trigger, setTrigger] = useState('');
  const [label, setLabel] = useState('');
  const [toAgentId, setToAgentId] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const agentConns: AgentConnection[] = connectionsMap[agent.id] ?? [];
  const targetOptions = allAgents
    .filter((a) => a.id !== agent.id)
    .map((a) => ({ value: a.id, label: a.name }));

  async function handleAdd() {
    if (!toAgentId || !trigger.trim() || !label.trim()) {
      setError('All fields are required');
      return;
    }
    setError('');
    setAdding(true);
    const result = await addConnection(agent.id, { toAgentId, trigger: trigger.trim(), label: label.trim(), priority: 0 });
    setAdding(false);
    if (result.error) { setError(result.error); return; }
    setTrigger('');
    setLabel('');
    setToAgentId('');
    setShowForm(false);
  }

  async function handleRemove(connectionId: string) {
    await removeConnection(agent.id, connectionId);
  }

  return (
    <div className="space-y-3">
      {/* Flow diagram */}
      {agentConns.length > 0 && (
        <div className="space-y-1.5">
          <AnimatePresence>
            {agentConns.map((conn) => {
              const target = allAgents.find((a) => a.id === conn.toAgentId);
              const targetPalette = target ? agentTypeColors[target.typeId] ?? agentTypeColors.CUSTOM : agentTypeColors.CUSTOM;
              return (
                <motion.div
                  key={conn.id}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] group"
                >
                  {/* Source agent */}
                  <div
                    className="px-2 py-1 rounded-md text-[11px] font-medium text-white"
                    style={{ backgroundColor: agent.avatarColor || '#4F46E5' }}
                  >
                    {agent.name}
                  </div>

                  {/* Trigger + arrow */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <ArrowRight size={12} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                    <div className="bg-[var(--color-bg-muted)] rounded px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)] font-mono truncate">
                      {conn.trigger}
                    </div>
                    <ArrowRight size={12} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                  </div>

                  {/* Target agent */}
                  <div
                    className="px-2 py-1 rounded-md text-[11px] font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: targetPalette.base }}
                  >
                    {target?.name ?? 'Unknown'}
                  </div>

                  {/* Label */}
                  <span className="text-[10px] text-[var(--color-text-tertiary)] truncate hidden sm:block">{conn.label}</span>

                  {/* Delete */}
                  <button
                    onClick={() => handleRemove(conn.id)}
                    className="ml-auto p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {agentConns.length === 0 && !showForm && (
        <EmptyState
          icon={<ArrowRight size={16} />}
          title="No connections yet"
          description="Connect this agent to others for automatic handoffs based on conversation triggers."
        />
      )}

      {/* Add connection form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2.5 p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"
          >
            <p className="text-[11px] font-medium text-[var(--color-text-primary)]">New Connection</p>
            <Select
              label="Target Agent"
              options={targetOptions}
              placeholder="Select agent…"
              value={toAgentId}
              onChange={(e) => setToAgentId(e.target.value)}
            />
            <Input
              label="Trigger keyword"
              placeholder="e.g. billing, refund, escalate"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            />
            <Input
              label="Label"
              placeholder="e.g. Route to billing support"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#DC2626]">
                <AlertCircle size={12} /> {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="primary" size="sm" loading={adding} onClick={handleAdd} fullWidth>
                Add Connection
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setError(''); }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && agentConns.length < 5 && (
        <Button
          variant="outline"
          size="sm"
          iconLeft={<Plus size={13} />}
          onClick={() => setShowForm(true)}
        >
          Add Connection
        </Button>
      )}

      {agentConns.length >= 5 && (
        <p className="text-[11px] text-[var(--color-text-tertiary)]">Maximum 5 connections reached.</p>
      )}
    </div>
  );
}
