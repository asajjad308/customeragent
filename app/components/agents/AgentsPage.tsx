'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, Copy, Bot, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { useAppStore, type Bot as AgentBot } from '@/store';

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#F97316'];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
];

interface AgentFormData {
  name: string;
  color: string;
  systemPrompt: string;
  businessContext: string;
  greeting: string;
  tone: string;
}

const DEFAULT_FORM: AgentFormData = {
  name: '',
  color: '#6366F1',
  systemPrompt: 'You are a helpful customer support assistant. Assist users with their questions clearly and concisely. Always be empathetic.',
  businessContext: '',
  greeting: "Hi! How can I help you today?",
  tone: 'friendly',
};

function AgentFormDialog({
  open,
  onOpenChange,
  initial,
  title,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: AgentFormData;
  title: string;
  onSubmit: (data: AgentFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<AgentFormData>(initial);
  const set = (k: keyof AgentFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Reset form when dialog opens with new initial data
  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initial);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-1.5">
            <Label>Agent Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Aria, Max, Support Bot" />
          </div>

          <div className="grid gap-1.5">
            <Label>Widget Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Tone</Label>
            <Select value={form.tone} onValueChange={(v) => set('tone', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Greeting Message</Label>
            <Input value={form.greeting} onChange={(e) => set('greeting', e.target.value)} placeholder="Hi! How can I help?" />
          </div>

          <div className="grid gap-1.5">
            <Label>System Prompt *</Label>
            <Textarea
              value={form.systemPrompt}
              onChange={(e) => set('systemPrompt', e.target.value)}
              rows={4}
              placeholder="Instructions for the AI agent..."
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Business Context</Label>
            <Textarea
              value={form.businessContext}
              onChange={(e) => set('businessContext', e.target.value)}
              rows={3}
              placeholder="Products, policies, FAQs your agent should know..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={!form.name.trim() || !form.systemPrompt.trim() || loading}
            className="flex-1"
          >
            {loading ? 'Saving…' : 'Save Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmbedDialog({ bot, open, onOpenChange }: { bot: AgentBot | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  if (!bot) return null;

  const snippet = `<!-- SupportAI Widget for ${bot.name} -->
<script>
  window.SupportAIConfig = {
    botId: "${bot.id}",
    position: "bottom-right",
    primaryColor: "${bot.color}",
    greeting: "${bot.greeting}"
  };
<\/script>
<script src="${origin}/embed.js" async><\/script>`;

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
            Embed "{bot.name}" on your website
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Paste this snippet before the closing <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag of any page.
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
            { label: 'Agent ID', value: bot.id.slice(0, 12) + '…' },
            { label: 'Color', value: bot.color, dot: true },
            { label: 'Position', value: 'bottom-right' },
          ].map((item) => (
            <div key={item.label} className="bg-muted/60 rounded-lg p-2.5">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                {item.dot && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: bot.color }} />}
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          💡 <strong>Test it:</strong> Open <code className="text-xs">{origin}/test-embed.html</code> in your browser to see a live preview with the widget loaded.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function AgentsPage({ onSwitchToChat }: { onSwitchToChat?: () => void }) {
  const { bots, activeBotId, setActiveBot, createAgent, updateAgent, deleteAgent } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editBot, setEditBot] = useState<AgentBot | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [embedBot, setEmbedBot] = useState<AgentBot | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (data: AgentFormData) => {
    setSaving(true);
    const bot = await createAgent(data);
    setSaving(false);
    if (!bot) { toast.error('Failed to create agent'); return; }
    setShowCreate(false);
    toast.success(`Agent "${data.name}" created`);
  };

  const handleEdit = async (data: AgentFormData) => {
    if (!editBot) return;
    setSaving(true);
    await updateAgent(editBot.id, data);
    setSaving(false);
    setEditBot(null);
    toast.success('Agent updated');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const bot = bots.find((b) => b.id === deleteId);
    await deleteAgent(deleteId);
    setDeleteId(null);
    toast.success(`Agent "${bot?.name}" deleted`);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSetActive = (id: string) => {
    setActiveBot(id);
    onSwitchToChat?.();
    toast.success('Switched to agent');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{bots.length} agent{bots.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Empty state */}
      {bots.length === 0 && (
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
        {bots.map((bot) => (
          <div
            key={bot.id}
            className={`rounded-xl border bg-card p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${bot.id === activeBotId ? 'ring-2 ring-indigo-500' : ''}`}
          >
            {/* Top: avatar + name + active badge */}
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ backgroundColor: bot.color }}
              >
                {bot.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{bot.name}</span>
                  {bot.id === activeBotId && (
                    <Badge variant="secondary" className="text-xs py-0 h-4 shrink-0">Active</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 capitalize">{bot.tone ?? 'friendly'} tone</div>
              </div>
            </div>

            {/* System prompt preview */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {bot.systemPrompt}
            </p>

            {/* Agent ID copy */}
            <div className="flex items-center gap-1.5 bg-muted/60 rounded-md px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{bot.id}</span>
              <button
                onClick={() => handleCopyId(bot.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy agent ID"
              >
                {copiedId === bot.id
                  ? <Check className="w-3.5 h-3.5 text-green-500" />
                  : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              {bot.id !== activeBotId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => handleSetActive(bot.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Use
                </Button>
              )}
              {bot.id === activeBotId && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => onSwitchToChat?.()}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open Chat
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEmbedBot(bot)}
                title="Get embed code"
              >
                <Code2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditBot(bot)}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(bot.id)}
                disabled={bots.length === 1}
                title={bots.length === 1 ? 'Cannot delete the last agent' : 'Delete agent'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <AgentFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        initial={DEFAULT_FORM}
        title="Create New Agent"
        onSubmit={handleCreate}
        loading={saving}
      />

      {/* Edit dialog */}
      <AgentFormDialog
        open={!!editBot}
        onOpenChange={(v) => { if (!v) setEditBot(null); }}
        initial={editBot ? {
          name: editBot.name,
          color: editBot.color,
          systemPrompt: editBot.systemPrompt,
          businessContext: editBot.businessContext ?? '',
          greeting: editBot.greeting,
          tone: editBot.tone,
        } : DEFAULT_FORM}
        title={`Edit "${editBot?.name}"`}
        onSubmit={handleEdit}
        loading={saving}
      />

      {/* Embed code dialog */}
      <EmbedDialog bot={embedBot} open={!!embedBot} onOpenChange={(v) => { if (!v) setEmbedBot(null); }} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agent and all its conversations. This action cannot be undone.
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
