'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff, RefreshCw, CreditCard, Shield, Bell, Palette } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAppStore } from '@/store';
import { themes } from '@/lib/themes';
import type { ThemeKey } from '@/store';

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SettingsPage() {
  const { settings, theme, updateSettings, updateTheme, analytics } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [showBilling, setShowBilling] = useState(false);

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
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
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Pro Plan</div>
                  <div className="text-sm text-muted-foreground">$49 / month</div>
                </div>
                <Badge className="bg-indigo-500 text-white">Active</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Messages used</span>
                  <span>{analytics.totalMessages.toLocaleString()} / 10,000</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                {usagePercent > 80 && (
                  <p className="text-xs text-orange-500">You're using {Math.round(usagePercent)}% of your quota.{' '}
                    <button className="underline" onClick={() => setShowBilling(true)}>Upgrade plan</button>
                  </p>
                )}
              </div>
              <Separator />
              {/* Plan comparison */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left pb-2">Feature</th>
                      <th className="text-center pb-2">Free</th>
                      <th className="text-center pb-2 text-indigo-500">Pro</th>
                      <th className="text-center pb-2">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      ['Messages/mo', '500', '10,000', 'Unlimited'],
                      ['Bots', '1', '5', 'Unlimited'],
                      ['KB entries', '10', '500', 'Unlimited'],
                      ['Analytics', '—', '✓', '✓'],
                      ['Integrations', '—', '✓', '✓'],
                      ['Priority support', '—', '—', '✓'],
                    ].map(([f, free, pro, ent]) => (
                      <tr key={f} className="border-t border-border">
                        <td className="py-1.5 text-muted-foreground">{f}</td>
                        <td className="text-center py-1.5">{free}</td>
                        <td className="text-center py-1.5 text-indigo-500 font-medium">{pro}</td>
                        <td className="text-center py-1.5">{ent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="w-full" onClick={() => setShowBilling(true)} aria-label="Upgrade plan">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mock Stripe dialog */}
      <Dialog open={showBilling} onOpenChange={setShowBilling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Enterprise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Card Number</Label>
              <Input placeholder="4242 4242 4242 4242" maxLength={19} aria-label="Card number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Expiry</Label>
                <Input placeholder="MM/YY" maxLength={5} aria-label="Card expiry" />
              </div>
              <div className="grid gap-1.5">
                <Label>CVC</Label>
                <Input placeholder="123" maxLength={4} type="password" aria-label="Card CVC" />
              </div>
            </div>
            <Button className="w-full" onClick={() => { setShowBilling(false); toast.success('Payment UI demo — no real charge made!'); }} aria-label="Confirm payment">
              Pay $149/month
            </Button>
            <p className="text-xs text-muted-foreground text-center">Demo only — no real payment is processed</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
