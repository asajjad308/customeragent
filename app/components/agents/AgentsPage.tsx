'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  Copy,
  Bot,
  Code2,
  BookOpen,
  X,
  Send,
  ChevronRight,
  Zap,
  Link2,
  Play,
  Pause,
  Archive,
  MoreVertical,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import {
  useAgentsStore,
  type Agent,
  type AgentType,
  type AgentStatus,
  type WidgetTheme,
  type AgentConnection,
  type AgentFormData,
} from '@/store/agentsStore';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#F97316'];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
];

const TYPE_OPTIONS: { value: AgentType; label: string }[] = [
  { value: 'SUPPORT', label: 'Support' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'SALES', label: 'Sales' },
  { value: 'LEAD_GEN', label: 'Lead Gen' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'HR', label: 'HR' },
  { value: 'BOOKING', label: 'Booking' },
  { value: 'CUSTOM', label: 'Custom' },
];

const THEME_OPTIONS: { value: WidgetTheme; label: string }[] = [
  { value: 'SOFT_AURORA', label: 'Soft Aurora' },
  { value: 'GLASSMORPHISM_DARK', label: 'Glassmorphism Dark' },
  { value: 'NEO_BRUTALISM', label: 'Neo Brutalism' },
];

const TYPE_BADGE_STYLES: Record<AgentType, string> = {
  SUPPORT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  TECHNICAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  SALES: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  LEAD_GEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ONBOARDING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  HR: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  BOOKING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CUSTOM: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const STATUS_BADGE_STYLES: Record<AgentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ARCHIVED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── TypeBadge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AgentType }) {
  const label = TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_BADGE_STYLES[type]}`}>
      {label}
    </span>
  );
}

// ─── DEFAULT FORM ─────────────────────────────────────────────────────────────

const DEFAULT_FORM: AgentFormData = {
  name: '',
  typeId: 'SUPPORT',
  color: '#6366F1',
  systemPrompt:
    'You are a helpful customer support assistant for {{company_name}}. Assist users clearly and empathetically.',
  businessContext: '',
  greeting: 'Hi! How can I help you today?',
  tone: 'friendly',
  temperature: 0.4,
  maxTokens: 512,
  widgetTheme: 'SOFT_AURORA',
  quickReplies: [],
};

// ─── Agent Form Dialog ────────────────────────────────────────────────────────

function AgentFormDialog({
  open,
  onOpenChange,
  initial,
  title,
  onSubmit,
  loading,
  agentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: AgentFormData;
  title: string;
  onSubmit: (data: AgentFormData) => void;
  loading: boolean;
  agentId?: string;
}) {
  const { kbEntries, loadKB, addKBEntry, deleteKBEntry } = useAppStore();
  const [form, setForm] = useState<AgentFormData>(initial);
  const [quickRepliesRaw, setQuickRepliesRaw] = useState(initial.quickReplies.join(', '));
  const setF = (k: keyof AgentFormData, v: AgentFormData[typeof k]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const [kbQ, setKbQ] = useState('');
  const [kbA, setKbA] = useState('');
  const [kbSaving, setKbSaving] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(initial);
      setQuickRepliesRaw(initial.quickReplies.join(', '));
      setKbQ('');
      setKbA('');
    }
    onOpenChange(v);
  };

  useEffect(() => {
    if (open && agentId) loadKB(agentId);
  }, [open, agentId]);

  const agentKBEntries = kbEntries.filter((e) => e.agentId === agentId);

  const handleAddKB = async () => {
    if (!kbQ.trim() || !kbA.trim()) {
      toast.error('Both question and answer are required');
      return;
    }
    setKbSaving(true);
    const result = await addKBEntry({ question: kbQ.trim(), answer: kbA.trim(), agentId });
    setKbSaving(false);
    if (!result) { toast.error('Failed to save entry'); return; }
    setKbQ('');
    setKbA('');
    toast.success('Entry added');
  };

  const handleSubmit = () => {
    const quickReplies = quickRepliesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({ ...form, quickReplies });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Agent Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setF('name', e.target.value)}
                placeholder="e.g. Aria, Max, Support Bot"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={form.typeId} onValueChange={(v) => setF('typeId', v as AgentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Widget Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setF('color', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tone</Label>
              <Select value={form.tone} onValueChange={(v) => setF('tone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Widget Theme</Label>
              <Select value={form.widgetTheme} onValueChange={(v) => setF('widgetTheme', v as WidgetTheme)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Greeting Message</Label>
            <Input
              value={form.greeting}
              onChange={(e) => setF('greeting', e.target.value)}
              placeholder="Hi! How can I help?"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Quick Replies <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
            <Input
              value={quickRepliesRaw}
              onChange={(e) => setQuickRepliesRaw(e.target.value)}
              placeholder="Billing issue, Reset password, Talk to human"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>System Prompt *</Label>
            <Textarea
              value={form.systemPrompt}
              onChange={(e) => setF('systemPrompt', e.target.value)}
              rows={4}
              placeholder="Instructions for the AI agent… use {{company_name}} as a placeholder."
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Business Context</Label>
            <Textarea
              value={form.businessContext}
              onChange={(e) => setF('businessContext', e.target.value)}
              rows={3}
              placeholder="Products, policies, FAQs your agent should know…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Temperature <span className="text-muted-foreground text-xs">({form.temperature})</span></Label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(e) => setF('temperature', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                min={64}
                max={4096}
                step={64}
                value={form.maxTokens}
                onChange={(e) => setF('maxTokens', parseInt(e.target.value) || 512)}
              />
            </div>
          </div>

          {agentId && (
            <>
              <Separator />
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <Label className="text-sm font-semibold">Knowledge Base</Label>
                  {agentKBEntries.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-4 py-0">{agentKBEntries.length}</Badge>
                  )}
                </div>
                {agentKBEntries.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {agentKBEntries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{entry.question}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{entry.answer}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => { await deleteKBEntry(entry.id); toast.success('Entry removed'); }}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">Add Q&amp;A entry</p>
                  <Input value={kbQ} onChange={(e) => setKbQ(e.target.value)} placeholder="Question" className="text-sm h-8" />
                  <Textarea value={kbA} onChange={(e) => setKbA(e.target.value)} placeholder="Answer" rows={2} className="text-sm resize-none" />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddKB} disabled={kbSaving || !kbQ.trim() || !kbA.trim()} className="w-full gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    {kbSaving ? 'Saving…' : 'Add Entry'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.systemPrompt.trim() || loading} className="flex-1">
            {loading ? 'Saving…' : 'Save Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Embed Dialog ─────────────────────────────────────────────────────────────

function EmbedDialog({ agent, open, onOpenChange }: { agent: Agent | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  if (!agent) return null;

  const snippet = `<!-- SupportAI Widget for ${agent.name} -->
<script>
  window.SupportAI = { agentId: "${agent.id}" };
<\/script>
<script src="https://cdn.supportai.io/widget.js" async><\/script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Embed "{agent.name}"
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Paste before the closing <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag.
        </p>
        <div className="relative">
          <pre className="bg-zinc-950 text-green-400 text-xs font-mono rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
{snippet}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Agent ID', value: agent.id.slice(0, 12) + '…' },
            { label: 'Color', value: agent.widgetColor, dot: true },
            { label: 'Theme', value: THEME_OPTIONS.find((t) => t.value === agent.widgetTheme)?.label ?? agent.widgetTheme },
          ].map((item) => (
            <div key={item.label} className="bg-muted/60 rounded-lg p-2.5">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                {item.dot && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: agent.widgetColor }} />}
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          💡 <strong>Test it:</strong> Open <code className="text-xs">{origin}/test-embed.html</code> to preview the widget live.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// ─── Agent Detail Panel ───────────────────────────────────────────────────────

function AgentDetailPanel({
  agent,
  connections,
  allAgents,
  onEdit,
  onEmbed,
  onTest,
  onClose,
  onStatusChange,
}: {
  agent: Agent;
  connections: AgentConnection[];
  allAgents: Agent[];
  onEdit: () => void;
  onEmbed: () => void;
  onTest: () => void;
  onClose: () => void;
  onStatusChange: (s: AgentStatus) => void;
}) {
  const { addConnection, removeConnection } = useAgentsStore();
  const [showAddConn, setShowAddConn] = useState(false);
  const [connForm, setConnForm] = useState({ toAgentId: '', trigger: '', label: '' });
  const [connError, setConnError] = useState<string | null>(null);
  const [connSaving, setConnSaving] = useState(false);

  // Reset add-conn form when agent changes
  useEffect(() => {
    setShowAddConn(false);
    setConnForm({ toAgentId: '', trigger: '', label: '' });
    setConnError(null);
  }, [agent.id]);

  const availableAgents = allAgents.filter(
    (a) => a.id !== agent.id && !connections.some((c) => c.toAgentId === a.id)
  );

  const handleAddConn = async () => {
    if (!connForm.toAgentId || !connForm.trigger.trim() || !connForm.label.trim()) {
      setConnError('All fields are required');
      return;
    }
    setConnSaving(true);
    setConnError(null);
    const result = await addConnection(agent.id, {
      toAgentId: connForm.toAgentId,
      trigger: connForm.trigger.trim(),
      label: connForm.label.trim(),
      priority: connections.length,
    });
    setConnSaving(false);
    if (result.error) {
      setConnError(result.error);
      return;
    }
    setConnForm({ toAgentId: '', trigger: '', label: '' });
    setShowAddConn(false);
    toast.success('Connection added');
  };

  return (
    <div className="w-80 shrink-0 border-l flex flex-col bg-card overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: agent.widgetColor }}
          >
            {agent.name.charAt(0)}
          </div>
          <span className="font-semibold text-sm truncate">{agent.name}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Type + Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={agent.typeId} />
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE_STYLES[agent.status]}`}>
            {agent.status}
          </span>
          <span className="text-xs text-muted-foreground capitalize ml-auto">{agent.tone} tone</span>
        </div>

        {/* System prompt preview */}
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">System prompt</p>
          <p className="text-xs text-foreground/70 line-clamp-3 leading-relaxed">{agent.systemPrompt}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sessions', value: agent.sessions },
            { label: 'Messages', value: agent.messageCount },
            { label: 'Satisfaction', value: agent.satisfaction != null ? `${(agent.satisfaction * 100).toFixed(0)}%` : '—' },
          ].map((m) => (
            <div key={m.label} className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-sm font-semibold">{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Quick replies */}
        {agent.quickReplies.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Quick replies</p>
            <div className="flex flex-wrap gap-1">
              {agent.quickReplies.map((r) => (
                <span key={r} className="text-xs bg-muted rounded-full px-2 py-0.5">{r}</span>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Connections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">Connected agents</span>
              {connections.length > 0 && (
                <Badge variant="secondary" className="text-[10px] py-0 h-4">{connections.length}/5</Badge>
              )}
            </div>
            {connections.length < 5 && availableAgents.length > 0 && (
              <button
                onClick={() => setShowAddConn((v) => !v)}
                className="w-5 h-5 rounded flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                title="Add connection"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add connection inline form */}
          {showAddConn && (
            <div className="border rounded-lg p-3 space-y-2 mb-3 bg-muted/20">
              <Select
                value={connForm.toAgentId}
                onValueChange={(v) => setConnForm((f) => ({ ...f, toAgentId: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select target agent" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.widgetColor }} />
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-8 text-xs"
                placeholder="Trigger keyword (e.g. escalation)"
                value={connForm.trigger}
                onChange={(e) => setConnForm((f) => ({ ...f, trigger: e.target.value }))}
              />
              <Input
                className="h-8 text-xs"
                placeholder="Display label (e.g. Escalate to Tech Support)"
                value={connForm.label}
                onChange={(e) => setConnForm((f) => ({ ...f, label: e.target.value }))}
              />
              {connError && <p className="text-destructive text-xs">{connError}</p>}
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => { setShowAddConn(false); setConnError(null); }}>
                  Cancel
                </Button>
                <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAddConn} disabled={connSaving}>
                  {connSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Connection list */}
          {connections.length === 0 && !showAddConn && (
            <p className="text-xs text-muted-foreground">No connections yet.</p>
          )}
          <div className="space-y-1.5">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: conn.toAgent?.widgetColor ?? '#6366F1' }}
                >
                  {conn.toAgent?.name.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{conn.toAgent?.name ?? 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{conn.label}</p>
                </div>
                {conn.toAgent && <TypeBadge type={conn.toAgent.typeId} />}
                <button
                  onClick={() => removeConnection(agent.id, conn.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove connection"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Connection flow diagram */}
          {connections.length > 0 && (
            <div className="mt-3 p-2.5 border rounded-lg bg-muted/20">
              <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wide">Handoff flow</p>
              <div className="flex items-start gap-2">
                <div
                  className="flex items-center gap-1 bg-card border rounded-md px-2 py-1 shrink-0"
                  style={{ borderColor: agent.widgetColor + '60' }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: agent.widgetColor }} />
                  <span className="text-[10px] font-medium">{agent.name}</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  {connections.map((conn) => (
                    <div key={conn.id} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div
                        className="flex items-center gap-1 bg-card border rounded-md px-2 py-1"
                        style={{ borderColor: (conn.toAgent?.widgetColor ?? '#6366F1') + '60' }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conn.toAgent?.widgetColor ?? '#6366F1' }} />
                        <span className="text-[10px] font-medium">{conn.toAgent?.name ?? '?'}</span>
                        {conn.toAgent && <TypeBadge type={conn.toAgent.typeId} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Status controls */}
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">Status</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED'] as AgentStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`text-xs px-2 py-1.5 rounded-md border transition-colors ${
                  agent.status === s
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                {s === 'ACTIVE' && <Play className="w-3 h-3 inline mr-1" />}
                {s === 'PAUSED' && <Pause className="w-3 h-3 inline mr-1" />}
                {s === 'ARCHIVED' && <Archive className="w-3 h-3 inline mr-1" />}
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="p-3 border-t flex flex-col gap-2">
        <Button onClick={onTest} className="w-full gap-2" size="sm">
          <Zap className="w-3.5 h-3.5" />
          Test agent
        </Button>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onEmbed}>
            <Code2 className="w-3.5 h-3.5" />
            Embed
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Preview Panel ───────────────────────────────────────────────────────

interface PreviewMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface HandoffInfo {
  toAgentId: string;
  toAgentName: string;
  reason: string;
}

function ChatPreviewPanel({
  initialAgent,
  allAgents,
  onClose,
}: {
  initialAgent: Agent;
  allAgents: Agent[];
  onClose: () => void;
}) {
  const [activeAgent, setActiveAgent] = useState<Agent>(initialAgent);
  const [messages, setMessages] = useState<PreviewMessage[]>([
    { id: uuid(), role: 'assistant', content: initialAgent.greeting },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [handoff, setHandoff] = useState<HandoffInfo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;
      const userMsg: PreviewMessage = { id: uuid(), role: 'user', content };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setStreaming(true);
      setStreamBuffer('');
      setHandoff(null);
      scrollToBottom();

      // Build history from existing messages (excluding current user msg)
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: activeAgent.id,
            message: content,
            history,
          }),
        });

        if (!res.body) throw new Error('No response body');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let remainder = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          remainder += decoder.decode(value, { stream: true });
          const lines = remainder.split('\n\n');
          remainder = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                type?: string;
                toAgentId?: string;
                toAgentName?: string;
                reason?: string;
              };

              if (parsed.type === 'handoff') {
                // Finalize the streamed assistant message
                if (buf.trim()) {
                  setMessages((prev) => [...prev, { id: uuid(), role: 'assistant', content: buf }]);
                  buf = '';
                  setStreamBuffer('');
                }
                setHandoff({
                  toAgentId: parsed.toAgentId ?? '',
                  toAgentName: parsed.toAgentName ?? 'Another Agent',
                  reason: parsed.reason ?? '',
                });
                setStreaming(false);
                scrollToBottom();
                return;
              } else if (parsed.content) {
                buf += parsed.content;
                setStreamBuffer(buf);
                scrollToBottom();
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }

        if (buf.trim()) {
          setMessages((prev) => [...prev, { id: uuid(), role: 'assistant', content: buf }]);
        }
      } catch (err) {
        console.error('Chat preview error:', err);
        setMessages((prev) => [...prev, { id: uuid(), role: 'assistant', content: 'Sorry, something went wrong.' }]);
      } finally {
        setStreaming(false);
        setStreamBuffer('');
        scrollToBottom();
      }
    },
    [activeAgent.id, messages, streaming]
  );

  const handleHandoffContinue = () => {
    if (!handoff) return;
    const newAgent = allAgents.find((a) => a.id === handoff.toAgentId);
    if (!newAgent) return;
    setActiveAgent(newAgent);
    setHandoff(null);
    setMessages((prev) => [
      ...prev,
      {
        id: uuid(),
        role: 'assistant',
        content: newAgent.greeting,
      },
    ]);
    scrollToBottom();
  };

  const showQuickReplies = messages.length <= 1 && activeAgent.quickReplies.length > 0;

  return (
    <div className="w-[360px] shrink-0 border-l flex flex-col bg-card">
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: activeAgent.widgetColor }}
          >
            {activeAgent.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{activeAgent.name}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[10px] text-muted-foreground">Online · Preview</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-1.5 mt-0.5"
                style={{ backgroundColor: activeAgent.widgetColor }}
              >
                {activeAgent.name.charAt(0)}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: activeAgent.widgetColor } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {streaming && (
          <div className="flex justify-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-1.5 mt-0.5"
              style={{ backgroundColor: activeAgent.widgetColor }}
            >
              {activeAgent.name.charAt(0)}
            </div>
            <div className="max-w-[80%] bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed">
              {streamBuffer || (
                <span className="flex gap-1 items-center py-0.5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        )}

        {/* Handoff card */}
        {handoff && (
          <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Transferring to {handoff.toAgentName}
              </span>
            </div>
            {handoff.reason && <p className="text-xs text-muted-foreground mb-2">{handoff.reason}</p>}
            <Button size="sm" className="w-full h-7 text-xs" onClick={handleHandoffContinue}>
              Continue with {handoff.toAgentName}
            </Button>
          </div>
        )}
      </div>

      {/* Quick reply chips */}
      {showQuickReplies && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {activeAgent.quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => sendMessage(reply)}
              className="text-xs border rounded-full px-2.5 py-1 hover:bg-muted transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-2.5 flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Type a message…"
          className="text-sm h-9"
          disabled={streaming}
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          style={{ backgroundColor: activeAgent.widgetColor }}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center py-1.5 text-[10px] text-muted-foreground border-t">
        Powered by SupportAI
      </div>
    </div>
  );
}

// ─── Main AgentsPage ──────────────────────────────────────────────────────────

export function AgentsPage({ onSwitchToChat }: { onSwitchToChat?: () => void }) {
  const {
    agents,
    connections,
    selectedAgentId,
    loading,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    changeStatus,
    selectAgent,
    fetchConnections,
  } = useAgentsStore();

  const { setActiveBot } = useAppStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [embedAgent, setEmbedAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const agentConnections = selectedAgentId ? (connections[selectedAgentId] ?? []) : [];

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) fetchConnections(selectedAgentId);
  }, [selectedAgentId]);

  const handleSelectAgent = (id: string) => {
    selectAgent(id === selectedAgentId ? null : id);
    setPreviewOpen(false);
  };

  const handleCreate = async (data: AgentFormData) => {
    setSaving(true);
    const agent = await createAgent(data);
    setSaving(false);
    if (!agent) { toast.error('Failed to create agent'); return; }
    setShowCreate(false);
    toast.success(`Agent "${data.name}" created`);
  };

  const handleEdit = async (data: AgentFormData) => {
    if (!editAgent) return;
    setSaving(true);
    await updateAgent(editAgent.id, data);
    setSaving(false);
    setEditAgent(null);
    toast.success('Agent updated');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const agent = agents.find((a) => a.id === deleteId);
    await deleteAgent(deleteId);
    if (selectedAgentId === deleteId) selectAgent(null);
    setDeleteId(null);
    toast.success(`Agent "${agent?.name}" deleted`);
  };

  const handleSetActive = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    setActiveBot(id);
    onSwitchToChat?.();
    toast.success('Switched to agent');
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Agent list ── */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Agents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Agent
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No agents yet</h2>
            <p className="text-muted-foreground text-sm mb-4">Create your first AI support agent to get started.</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Agent
            </Button>
          </div>
        )}

        {/* Agent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            const connCount = (connections[agent.id] ?? []).length;
            return (
              <div
                key={agent.id}
                onClick={() => handleSelectAgent(agent.id)}
                className={`rounded-xl border bg-card p-5 flex flex-col gap-3 transition-all cursor-pointer hover:shadow-md ${
                  isSelected ? 'ring-2 ring-indigo-500 shadow-md' : ''
                }`}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: agent.widgetColor }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold truncate">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <TypeBadge type={agent.typeId} />
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE_STYLES[agent.status]}`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetActive(agent.id); }}>
                        Use in chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditAgent(agent); }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEmbedAgent(agent); }}>
                        Get embed code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(agent.id); }}
                        disabled={agents.length === 1}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Prompt preview */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{agent.systemPrompt}</p>

                {/* Metadata row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{agent.messageCount} msgs</span>
                  {connCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {connCount} conn{connCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="ml-auto capitalize">{agent.tone}</span>
                </div>

                {/* Agent ID */}
                <div className="flex items-center gap-1.5 bg-muted/60 rounded-md px-2.5 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{agent.id}</span>
                  <button
                    onClick={() => handleCopyId(agent.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy agent ID"
                  >
                    {copiedId === agent.id
                      ? <Check className="w-3.5 h-3.5 text-green-500" />
                      : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Agent detail panel ── */}
      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          connections={agentConnections}
          allAgents={agents}
          onEdit={() => setEditAgent(selectedAgent)}
          onEmbed={() => setEmbedAgent(selectedAgent)}
          onTest={() => setPreviewOpen(true)}
          onClose={() => { selectAgent(null); setPreviewOpen(false); }}
          onStatusChange={(s) => changeStatus(selectedAgent.id, s)}
        />
      )}

      {/* ── Chat preview panel ── */}
      {previewOpen && selectedAgent && (
        <ChatPreviewPanel
          initialAgent={selectedAgent}
          allAgents={agents}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* ── Dialogs ── */}
      <AgentFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        initial={DEFAULT_FORM}
        title="Create New Agent"
        onSubmit={handleCreate}
        loading={saving}
      />

      <AgentFormDialog
        open={!!editAgent}
        onOpenChange={(v) => { if (!v) setEditAgent(null); }}
        initial={
          editAgent
            ? {
                name: editAgent.name,
                typeId: editAgent.typeId,
                color: editAgent.widgetColor,
                systemPrompt: editAgent.systemPrompt,
                businessContext: editAgent.businessContext ?? '',
                greeting: editAgent.greeting,
                tone: editAgent.tone,
                temperature: editAgent.temperature,
                maxTokens: editAgent.maxTokens,
                widgetTheme: editAgent.widgetTheme,
                quickReplies: editAgent.quickReplies,
              }
            : DEFAULT_FORM
        }
        title={`Edit "${editAgent?.name}"`}
        onSubmit={handleEdit}
        loading={saving}
        agentId={editAgent?.id}
      />

      <EmbedDialog
        agent={embedAgent}
        open={!!embedAgent}
        onOpenChange={(v) => { if (!v) setEmbedAgent(null); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the agent and all its conversations. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
