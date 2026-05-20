'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, Code2, MessageSquare, Link2, Cpu, Activity, Calendar, CheckCircle2, AlertCircle, Share2, Globe, Trash2, BookOpen, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Badge } from '@/components/ds/Badge';
import { Tabs } from '@/components/ds/Tabs';
import { AgentConnections } from './AgentConnections';
import { AgentEmbedCode } from './AgentEmbedCode';
import { PlatformConnectionPanel } from './PlatformConnectionPanel';
import { slideInRight } from '@/lib/animations';
import { agentTypeColors, agentStatusColors, DETAIL_WIDTH } from '@/lib/design-system';
import type { Agent, AgentStatus } from '@/store/agentsStore';

function GoogleCalendarSection() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [connectedAt, setConnectedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations/google-calendar/status')
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.connected ? 'connected' : 'disconnected');
        setConnectedAt(d.connectedAt ?? null);
      })
      .catch(() => setStatus('disconnected'));
  }, []);

  async function disconnect() {
    await fetch('/api/integrations/google-calendar/status', { method: 'DELETE' });
    setStatus('disconnected');
    setConnectedAt(null);
  }

  if (status === 'loading') {
    return (
      <div className="h-16 rounded-xl bg-[var(--color-bg-subtle)] animate-pulse" />
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#DCFCE7] dark:bg-[#14532D]/20 border border-[#86EFAC] dark:border-[#16A34A]/40">
        <CheckCircle2 size={15} className="text-[#16A34A] mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[#16A34A]">Google Calendar connected</div>
          {connectedAt && (
            <div className="text-[10px] text-[#4B7C59] mt-0.5">
              Since {new Date(connectedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <button
          onClick={disconnect}
          className="text-[10px] text-[#16A34A] hover:text-red-600 underline underline-offset-2 flex-shrink-0"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] space-y-2.5">
      <div className="flex items-center gap-2">
        <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
        <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
          Google Calendar not connected
        </span>
      </div>
      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
        Connect Google Calendar so this agent can check real availability and book appointments automatically.
      </p>
      <a href="/api/integrations/google-calendar/auth">
        <Button variant="primary" size="xs" iconLeft={<Calendar size={11} />} fullWidth>
          Connect Google Calendar
        </Button>
      </a>
    </div>
  );
}

interface KbEntry {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

function KnowledgeBaseSection({ agentId }: { agentId: string }) {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge-base?agentId=${agentId}`);
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [agentId]);

  async function scrapeUrl() {
    if (!url.trim()) return;
    setScraping(true);
    setScrapeMsg('');
    try {
      const res = await fetch('/api/knowledge-base/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), agentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setScrapeMsg(`Imported ${data.created} section${data.created !== 1 ? 's' : ''} from "${data.title}"`);
        setUrl('');
        await load();
      } else {
        setScrapeMsg(data.error ?? 'Failed to import page');
      }
    } finally {
      setScraping(false);
    }
  }

  async function deleteEntry(id: string) {
    const res = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const TYPE_COLORS: Record<string, string> = {
    website: 'text-blue-500',
    faq: 'text-purple-500',
    document: 'text-amber-500',
    policy: 'text-green-500',
    custom: 'text-gray-500',
  };

  return (
    <div className="space-y-4">
      {/* URL import */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] space-y-2.5">
        <p className="text-[11px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
          <Globe size={11} />
          Import from Website
        </p>
        <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
          Paste any public page URL — the bot will learn its content automatically.
        </p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !scraping && scrapeUrl()}
            placeholder="https://yoursite.com/about"
            className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <Button
            variant="primary"
            size="xs"
            disabled={!url.trim() || scraping}
            onClick={scrapeUrl}
            iconLeft={scraping ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
          >
            {scraping ? 'Loading…' : 'Import'}
          </Button>
        </div>
        {scrapeMsg && (
          <p className={`text-[10px] ${scrapeMsg.startsWith('Imported') ? 'text-green-600' : 'text-red-500'}`}>
            {scrapeMsg}
          </p>
        )}
      </div>

      {/* Entry list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 rounded-xl bg-[var(--color-bg-subtle)] animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-6 text-center">
          <BookOpen size={20} className="mx-auto text-[var(--color-text-tertiary)] mb-2" />
          <p className="text-[11px] text-[var(--color-text-tertiary)]">No knowledge entries yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]"
            >
              <Globe size={11} className={TYPE_COLORS[e.type] ?? 'text-gray-400'} />
              <span className="flex-1 text-[11px] text-[var(--color-text-primary)] truncate">{e.title}</span>
              <span className="text-[9px] text-[var(--color-text-tertiary)] uppercase tracking-wide">{e.type}</span>
              <button
                onClick={() => deleteEntry(e.id)}
                className="p-1 text-[var(--color-text-tertiary)] hover:text-red-500 rounded transition-colors"
                aria-label="Delete entry"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_VARIANT: Record<AgentStatus, 'success' | 'warning' | 'default' | 'danger'> = {
  ACTIVE: 'success', PAUSED: 'warning', DRAFT: 'default', ARCHIVED: 'danger',
};

const TABS = [
  { id: 'overview',    label: 'Overview',   icon: <Activity  size={12} /> },
  { id: 'knowledge',   label: 'Knowledge',  icon: <BookOpen  size={12} /> },
  { id: 'platform',   label: 'Platform',   icon: <Share2    size={12} /> },
  { id: 'connections', label: 'Connections',icon: <Link2     size={12} /> },
  { id: 'embed',       label: 'Embed',      icon: <Code2     size={12} /> },
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

                  {/* Google Calendar section for BOOKING agents */}
                  {agent.typeId === 'BOOKING' && (
                    <div>
                      <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1.5">
                        <Calendar size={11} />
                        Calendar Integration
                      </p>
                      <GoogleCalendarSection />
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

              {activeTab === 'knowledge' && (
                <KnowledgeBaseSection agentId={agent.id} />
              )}

              {activeTab === 'platform' && (
                <PlatformConnectionPanel
                  agentId={agent.id}
                  currentPlatform={agent.platform ?? 'WEBSITE'}
                />
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
