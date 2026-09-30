'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Bot,
  LayoutGrid,
  List,
  Command,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ds/Button';
import { Input } from '@/components/ds/Input';
import { Badge } from '@/components/ds/Badge';
import { Skeleton } from '@/components/ds/Skeleton';
import { EmptyState } from '@/components/ds/EmptyState';
import { CommandPalette, type Command as Cmd } from '@/components/ds/CommandPalette';
import { PageHeader } from '@/components/layout/PageHeader';
import { AgentCard } from './AgentCard';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AgentChatPreview } from './AgentChatPreview';
import { AgentModal } from './AgentModal';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
  useAgentsStore,
  type Agent,
  type AgentStatus,
  type AgentFormData,
} from '@/store/agentsStore';
import { useAppStore } from '@/store';
import { CHAT_PREVIEW_WIDTH } from '@/lib/design-system';

type StatusFilter = 'ALL' | AgentStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL',      label: 'All' },
  { value: 'ACTIVE',   label: 'Active' },
  { value: 'PAUSED',   label: 'Paused' },
  { value: 'DRAFT',    label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

interface AgentsPageProps {
  onSwitchToChat?: () => void;
}

export function AgentsPage({ onSwitchToChat }: AgentsPageProps) {
  const { settings } = useAppStore();
  const {
    agents,
    loading: isLoading,
    selectedAgentId,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    changeStatus,
    selectAgent,
    fetchConnections,
  } = useAgentsStore();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [chatPreviewAgent, setChatPreviewAgent] = useState<Agent | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) fetchConnections(selectedAgentId);
  }, [selectedAgentId]);

  // Ctrl/Cmd+K for command palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = agents.filter((a) => {
    const matchesQuery = !query || a.name.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  async function handleCreate(data: AgentFormData) {
    setModalLoading(true);
    try {
      await createAgent(data);
      setModalOpen(false);
      toast.success('Agent created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setModalLoading(false);
    }
  }

  async function handleUpdate(data: AgentFormData) {
    if (!editAgent) return;
    setModalLoading(true);
    try {
      await updateAgent(editAgent.id, data);
      setEditAgent(null);
      toast.success('Agent updated');
    } catch {
      toast.error('Failed to update agent');
    } finally {
      setModalLoading(false);
    }
  }

  async function handleStatusChange(agent: Agent, status: AgentStatus) {
    await changeStatus(agent.id, status);
    toast.success(`Agent ${status.toLowerCase()}`);
  }

  async function handleDelete(agent: Agent) {
    await deleteAgent(agent.id);
    if (selectedAgentId === agent.id) selectAgent(null);
    setDeleteConfirm(null);
    toast.success('Agent deleted');
  }

  const commands: Cmd[] = [
    {
      id: 'new',
      label: 'Create new agent',
      description: 'Open the agent creation wizard',
      icon: <Plus size={14} />,
      group: 'Actions',
      onSelect: () => setModalOpen(true),
    },
    ...agents.map((a) => ({
      id: a.id,
      label: a.name,
      description: `${a.typeId} · ${a.status}`,
      icon: <Bot size={14} />,
      group: 'Agents',
      onSelect: () => selectAgent(a.id),
    })),
  ];

  const statCards = [
    { label: 'Total', value: agents.length },
    { label: 'Active', value: agents.filter((a) => a.status === 'ACTIVE').length },
    { label: 'Messages', value: agents.reduce((s, a) => s + (a.messageCount ?? 0), 0).toLocaleString() },
    { label: 'Sessions', value: agents.reduce((s, a) => s + (a.sessions ?? 0), 0).toLocaleString() },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <PageHeader
          title="AI Agents"
          description={`${agents.length} agent${agents.length !== 1 ? 's' : ''} in ${settings.companyName || 'your workspace'}`}
          actions={
            <>
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] text-[11px] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <Command size={11} />
                <span>⌘K</span>
              </button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus size={13} />}
                onClick={() => setModalOpen(true)}
              >
                New Agent
              </Button>
            </>
          }
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Sized by container, not viewport, since the sidebar and detail panel take width too */}
          <div className="@container p-4 pb-24 sm:p-6 md:pb-6 space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 @xl:grid-cols-4 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="bg-[var(--surface-0)] border border-[var(--color-border-subtle)] rounded-xl p-4">
                  <div className="text-[22px] font-bold text-[var(--color-text-primary)] font-numeric">{stat.value}</div>
                  <div className="text-[11px] text-[var(--color-text-tertiary)]">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[180px] max-w-xs">
                <Input
                  placeholder="Search agents…"
                  iconLeft={<Search size={13} />}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-subtle)] rounded-xl">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                      statusFilter === tab.value
                        ? 'bg-[var(--surface-0)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-subtle)]'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 p-0.5 bg-[var(--color-bg-subtle)] rounded-lg ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--surface-0)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)]'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--surface-0)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)]'}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Agent grid/list */}
            {isLoading ? (
              <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
                    <Skeleton height={4} />
                    <div className="p-4 space-y-3">
                      <div className="flex gap-2">
                        <Skeleton width={36} height={36} rounded="lg" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton height={13} width="60%" />
                          <Skeleton height={11} width="40%" />
                        </div>
                      </div>
                      <Skeleton height={11} width="80%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Bot size={20} />}
                title={agents.length === 0 ? 'No agents yet' : 'No agents match your search'}
                description={agents.length === 0 ? 'Create your first AI agent to start automating customer support.' : 'Try adjusting your search or filters.'}
                action={agents.length === 0 ? (
                  <Button variant="primary" size="sm" iconLeft={<Plus size={13} />} onClick={() => setModalOpen(true)}>
                    Create First Agent
                  </Button>
                ) : undefined}
              />
            ) : (
              <motion.div
                variants={staggerContainer(0.04)}
                initial="hidden"
                animate="visible"
                className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3' : 'grid-cols-1'}`}
              >
                <AnimatePresence>
                  {filtered.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      selected={selectedAgentId === agent.id}
                      onClick={() => selectAgent(selectedAgentId === agent.id ? null : agent.id)}
                      onEdit={() => { setEditAgent(agent); }}
                      onStatusChange={(status) => handleStatusChange(agent, status)}
                      onDelete={() => setDeleteConfirm(agent)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for the detail / preview drawer below xl */}
      {(selectedAgent || chatPreviewAgent) && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/30 xl:hidden"
          onClick={() => { setChatPreviewAgent(null); selectAgent(null); }}
        />
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selectedAgent && !chatPreviewAgent && (
          <AgentDetailPanel
            key={selectedAgent.id}
            agent={selectedAgent}
            allAgents={agents}
            onClose={() => selectAgent(null)}
            onEdit={() => setEditAgent(selectedAgent)}
            onChatPreview={() => setChatPreviewAgent(selectedAgent)}
          />
        )}
      </AnimatePresence>

      {/* Chat preview panel */}
      <AnimatePresence>
        {chatPreviewAgent && (
          <div
            style={{ '--preview-w': `${CHAT_PREVIEW_WIDTH}px` } as React.CSSProperties}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[var(--preview-w)] shadow-2xl xl:static xl:z-auto xl:shadow-none flex-shrink-0 h-full"
          >
            <AgentChatPreview
              key={chatPreviewAgent.id}
              agent={chatPreviewAgent}
              onClose={() => setChatPreviewAgent(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={modalLoading}
        title="Create Agent"
      />

      {/* Edit modal */}
      <AgentModal
        open={editAgent !== null}
        onClose={() => setEditAgent(null)}
        initial={editAgent ? {
          name: editAgent.name,
          typeId: editAgent.typeId,
          color: editAgent.avatarColor,
          systemPrompt: editAgent.systemPrompt,
          businessContext: editAgent.businessContext ?? '',
          greeting: editAgent.greeting,
          tone: editAgent.tone,
          model: editAgent.model,
          temperature: editAgent.temperature,
          maxTokens: editAgent.maxTokens,
          widgetTheme: editAgent.widgetTheme,
          quickReplies: editAgent.quickReplies,
        } : undefined}
        onSubmit={handleUpdate}
        loading={modalLoading}
        title="Edit Agent"
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative bg-[var(--surface-0)] rounded-2xl border border-[var(--color-border-subtle)] shadow-xl p-6 max-w-sm w-full z-10"
            >
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-3">
                <Trash2 size={18} className="text-[#DC2626]" />
              </div>
              <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">Delete "{deleteConfirm.name}"?</h3>
              <p className="text-[12px] text-[var(--color-text-tertiary)] mb-4">This action cannot be undone. All conversations and connections will be removed.</p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" fullWidth onClick={() => handleDelete(deleteConfirm!)}>Delete</Button>
                <Button variant="outline" size="sm" fullWidth onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Command palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={commands}
        placeholder="Search agents or actions…"
      />
    </div>
  );
}
