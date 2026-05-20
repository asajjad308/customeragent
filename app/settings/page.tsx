'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, RefreshCw, CreditCard, Shield, Bell, Palette, Cpu, Plus, Trash2, Zap, Building2, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { themes } from '@/lib/themes';
import type { ThemeKey } from '@/store';

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type LlmProvider = 'groq' | 'openai' | 'anthropic';

const PROVIDER_META: Record<LlmProvider, { label: string; placeholder: string; docsHint: string }> = {
  groq:      { label: 'Groq',      placeholder: 'gsk_…',   docsHint: 'console.groq.com → API Keys' },
  openai:    { label: 'OpenAI',    placeholder: 'sk-…',    docsHint: 'platform.openai.com → API Keys' },
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-…',docsHint: 'console.anthropic.com → API Keys' },
};

interface StoredKey {
  id: string;
  provider: LlmProvider;
  label: string;
  keyPreview: string;
  isActive: boolean;
  createdAt: string;
}

function AiProvidersTab() {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<LlmProvider>('groq');
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/llm-keys');
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addKey() {
    if (!label.trim() || !apiKey.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tenant/llm-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, label: label.trim(), key: apiKey.trim() }),
      });
      if (res.ok) {
        toast.success('API key saved');
        setLabel('');
        setApiKey('');
        await load();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to save key');
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleKey(id: string, isActive: boolean) {
    const res = await fetch(`/api/tenant/llm-keys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: !isActive } : k));
  }

  async function deleteKey(id: string) {
    const res = await fetch(`/api/tenant/llm-keys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Key removed');
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  }

  const meta = PROVIDER_META[provider];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Provider Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as LlmProvider)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_META) as LlmProvider[]).map((p) => (
                  <SelectItem key={p} value={p}>{PROVIDER_META[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{meta.docsHint}</p>
          </div>
          <div className="grid gap-1.5">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Production"
              aria-label="Key label"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={meta.placeholder}
                type={showKey ? 'text' : 'password'}
                className="font-mono text-xs"
                aria-label="API key value"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} aria-label="Toggle key visibility">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            disabled={!label.trim() || !apiKey.trim() || saving}
            onClick={addKey}
            aria-label="Save API key"
          >
            <Plus className="w-4 h-4 mr-1" />
            {saving ? 'Saving…' : 'Save Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configured Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No keys configured yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                >
                  <Cpu className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{PROVIDER_META[k.provider]?.label ?? k.provider}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{k.label}</Badge>
                      {!k.isActive && <Badge variant="secondary" className="text-[10px] py-0">Disabled</Badge>}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate">{k.keyPreview}</div>
                  </div>
                  <Switch
                    checked={k.isActive}
                    onCheckedChange={() => toggleKey(k.id, k.isActive)}
                    aria-label={k.isActive ? 'Disable key' : 'Enable key'}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteKey(k.id)}
                    aria-label="Delete key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Keys are used by your agents based on the model selected — Groq keys for Llama/Mixtral models, OpenAI keys for GPT/o-series, Anthropic keys for Claude models. If no tenant key is found the platform fallback is used.
      </p>
    </div>
  );
}

const PLAN_DETAILS = {
  free:       { label: 'Free',       price: '$0',   messages: '1,000',  agents: '1',       color: 'bg-slate-500' },
  pro:        { label: 'Pro',        price: '$49',  messages: '10,000', agents: '5',       color: 'bg-indigo-500' },
  enterprise: { label: 'Enterprise', price: '$149', messages: 'Unlimited', agents: 'Unlimited', color: 'bg-violet-600' },
};

function BillingTab() {
  const { data: session, update } = useSession();
  const { analytics } = useAppStore();
  const plan = (session?.user?.plan ?? 'free') as keyof typeof PLAN_DETAILS;
  const planDetails = PLAN_DETAILS[plan] ?? PLAN_DETAILS.free;
  const maxMessages = plan === 'free' ? 1000 : plan === 'pro' ? 10000 : Infinity;
  const usagePercent = isFinite(maxMessages) ? Math.min((analytics.totalMessages / maxMessages) * 100, 100) : 0;
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      update();
    }
  }, [update]);

  async function upgrade(targetPlan: 'pro' | 'enterprise') {
    setLoading(targetPlan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? 'Could not open checkout');
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? 'Could not open billing portal');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg">{planDetails.label} Plan</div>
              <div className="text-sm text-muted-foreground">{planDetails.price}/month</div>
            </div>
            <Badge className={`${planDetails.color} text-white`}>{planDetails.label}</Badge>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Messages this month</span>
              <span>{analytics.totalMessages.toLocaleString()} / {isFinite(maxMessages) ? maxMessages.toLocaleString() : '∞'}</span>
            </div>
            {isFinite(maxMessages) && (
              <>
                <Progress value={usagePercent} className="h-2" />
                {usagePercent >= 80 && (
                  <p className="text-xs text-orange-500">
                    {Math.round(usagePercent)}% of quota used.{' '}
                    {plan !== 'enterprise' && (
                      <button className="underline font-medium" onClick={() => upgrade(plan === 'free' ? 'pro' : 'enterprise')}>
                        Upgrade now
                      </button>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
          {plan !== 'free' && (
            <Button variant="outline" size="sm" onClick={openPortal} disabled={loading === 'portal'} aria-label="Manage billing">
              <CreditCard className="w-4 h-4 mr-2" />
              {loading === 'portal' ? 'Opening…' : 'Manage Billing & Invoices'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan comparison + upgrade */}
      <div className="grid gap-3">
        {([
          { id: 'pro' as const,        icon: <Zap className="w-4 h-4" />,       features: ['5 agents', '10,000 msgs/mo', '500 KB entries', 'Analytics', 'All integrations'] },
          { id: 'enterprise' as const, icon: <Building2 className="w-4 h-4" />, features: ['Unlimited agents', 'Unlimited msgs', 'Unlimited KB', 'Priority support', 'Custom domains'] },
        ]).map(({ id, icon, features }) => {
          const d = PLAN_DETAILS[id];
          const isCurrent = plan === id;
          return (
            <Card key={id} className={isCurrent ? 'border-indigo-500 border-2' : ''}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    {icon} {d.label}
                  </div>
                  <div className="text-sm font-bold">{d.price}<span className="text-muted-foreground font-normal">/mo</span></div>
                </div>
                <ul className="space-y-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button className="w-full" variant="outline" disabled aria-label="Current plan">Current plan</Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => upgrade(id)}
                    disabled={loading === id || (id === 'pro' && plan === 'enterprise')}
                    aria-label={`Upgrade to ${d.label}`}
                  >
                    {loading === id ? 'Redirecting…' : `Upgrade to ${d.label}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, theme, updateSettings, updateTheme, analytics } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [newWord, setNewWord] = useState('');

  const save = (updates: Parameters<typeof updateSettings>[0]) => {
    updateSettings(updates);
    toast.success('Settings saved');
  };

  const usagePercent = Math.min((analytics.totalMessages / 10000) * 100, 100);
  const usageColor = usagePercent > 85 ? 'bg-red-500' : usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-indigo-500" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai-providers">
            <Cpu className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">AI Keys</span>
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">Notify</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-3.5 h-3.5 md:hidden" />
            <span className="hidden md:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Providers */}
        <TabsContent value="ai-providers" className="space-y-4 mt-4">
          <AiProvidersTab />
        </TabsContent>

        {/* General */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-1.5">
                <Label>Company Name</Label>
                <Input
                  defaultValue={settings.companyName}
                  onBlur={(e) => save({ companyName: e.target.value })}
                  aria-label="Company name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Support Email</Label>
                <Input
                  defaultValue={settings.supportEmail}
                  onBlur={(e) => save({ supportEmail: e.target.value })}
                  type="email"
                  aria-label="Support email"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Language</Label>
                <Select value={settings.language} onValueChange={(v) => save({ language: v })}>
                  <SelectTrigger aria-label="Language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[['en','English'],['es','Spanish'],['fr','French'],['ar','Arabic'],['ur','Urdu'],['de','German']].map(([v,l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => save({ timezone: v })}>
                  <SelectTrigger aria-label="Timezone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['UTC','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Dubai','Asia/Karachi'].map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(v) => save({ dateFormat: v })}>
                  <SelectTrigger aria-label="Date format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'].map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-1.5">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(themes) as ThemeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { updateTheme(key); toast.success(`Theme changed to ${themes[key].name}`); }}
                      className={`p-3 rounded-lg border-2 text-left transition-all text-xs ${
                        theme === key ? 'border-indigo-500 bg-indigo-50' : 'border-border hover:border-indigo-300'
                      }`}
                      aria-label={`Select ${themes[key].name} theme`}
                    >
                      <div className={`w-full h-8 rounded mb-2 ${themes[key].background}`} />
                      <div className="font-medium">{themes[key].name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid gap-1.5">
                <Label>Chat Bubble Style</Label>
                <Select value={settings.bubbleStyle} onValueChange={(v) => save({ bubbleStyle: v as typeof settings.bubbleStyle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="sharp">Sharp</SelectItem>
                    <SelectItem value="pill">Pill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Font Size</Label>
                <Select value={settings.fontSize} onValueChange={(v) => save({ fontSize: v as typeof settings.fontSize })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              {[
                ['showTimestamps', 'Show timestamps'] as const,
                ['showReactions', 'Show message reactions'] as const,
                ['showQuickChips', 'Show quick chips'] as const,
                ['showPoweredBy', '"Powered by SupportAI" branding'] as const,
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={(v) => save({ [key]: v })}
                    aria-label={label}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {[
                ['notifyEmail', 'Email on new conversation'],
                ['notifySlack', 'Slack on human takeover request'],
                ['notifyDailyReport', 'Daily analytics report'],
                ['notifyWeeklySummary', 'Weekly summary email'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={settings[key as keyof typeof settings] as boolean}
                    onCheckedChange={(v) => save({ [key]: v })}
                    aria-label={label}
                  />
                </div>
              ))}
              <Separator />
              <Button variant="outline" size="sm" onClick={() => toast.info('Test notification sent!')} aria-label="Test notification">
                Send Test Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {/* API Key */}
              <div className="grid gap-1.5">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={showApiKey ? settings.apiKey : '•'.repeat(32)}
                    readOnly
                    className="font-mono text-xs"
                    aria-label="API key"
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)} aria-label={showApiKey ? 'Hide API key' : 'Show API key'}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { save({ apiKey: uuid() }); toast.success('API key regenerated'); }} aria-label="Regenerate API key">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(settings.apiKey); toast.success('Copied!'); }} aria-label="Copy API key">
                    <span className="text-xs">Copy</span>
                  </Button>
                </div>
              </div>
              <Separator />
              {/* Rate limit */}
              <div className="grid gap-1.5">
                <Label>Rate Limit (messages / user / hour)</Label>
                <Input
                  type="number"
                  min={1} max={1000}
                  defaultValue={settings.rateLimit}
                  onBlur={(e) => save({ rateLimit: Number(e.target.value) || 20 })}
                  aria-label="Rate limit"
                />
              </div>
              <Separator />
              {/* Blocked words */}
              <div className="grid gap-1.5">
                <Label>Blocked Words</Label>
                <div className="flex gap-2">
                  <Input
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Add blocked word..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newWord.trim()) {
                        save({ blockedWords: [...settings.blockedWords, newWord.trim()] });
                        setNewWord('');
                      }
                    }}
                    aria-label="New blocked word"
                  />
                  <Button size="sm" onClick={() => { if (newWord.trim()) { save({ blockedWords: [...settings.blockedWords, newWord.trim()] }); setNewWord(''); } }} aria-label="Add blocked word">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {settings.blockedWords.map((w) => (
                    <Badge key={w} variant="secondary" className="cursor-pointer" onClick={() => save({ blockedWords: settings.blockedWords.filter((bw) => bw !== w) })}>
                      {w} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              {/* IP Whitelist */}
              <div className="grid gap-1.5">
                <Label>IP Whitelist (one per line, leave empty for all)</Label>
                <textarea
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono resize-none min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={settings.ipWhitelist}
                  onBlur={(e) => save({ ipWhitelist: e.target.value })}
                  placeholder="192.168.1.1&#10;10.0.0.0/8"
                  aria-label="IP whitelist"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
