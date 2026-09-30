'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Zap, MessageSquare, Mail, ShoppingBag, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  children: React.ReactNode;
  alwaysOpen?: boolean;
}

function IntegrationCard({ title, description, icon, connected, children, alwaysOpen }: IntegrationCardProps) {
  const [open, setOpen] = useState(alwaysOpen ?? false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? 'default' : 'secondary'} className={connected ? 'bg-green-500 text-white' : ''}>
              {connected ? 'Connected' : 'Not connected'}
            </Badge>
            {!alwaysOpen && (
              <Button variant="ghost" size="icon-sm" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'}>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {(open || alwaysOpen) && (
        <>
          <Separator />
          <CardContent className="pt-4 space-y-3">{children}</CardContent>
        </>
      )}
    </Card>
  );
}

export default function IntegrationsPage() {
  const { integrations, updateIntegration } = useAppStore();
  const { groq, slack, whatsapp, email, zapier, shopify } = integrations;

  const [slackUrl, setSlackUrl] = useState(slack.webhookUrl);
  const [waPhone, setWaPhone] = useState(whatsapp.phoneId);
  const [waToken, setWaToken] = useState(whatsapp.token);
  const [emailHost, setEmailHost] = useState(email.host);
  const [emailPort, setEmailPort] = useState(email.port);
  const [emailUser, setEmailUser] = useState(email.user);
  const [emailPass, setEmailPass] = useState(email.pass);
  const [emailTo, setEmailTo] = useState(email.to);
  const [zapierUrl, setZapierUrl] = useState(zapier.webhookUrl);
  const [shopifyUrl, setShopifyUrl] = useState(shopify.storeUrl);
  const [shopifyKey, setShopifyKey] = useState(shopify.apiKey);

  const saveSlack = async () => {
    if (!slackUrl.trim()) { toast.error('Webhook URL is required'); return; }
    try {
      await fetch(slackUrl, { method: 'POST', body: JSON.stringify({ text: '✅ SupportAI connected successfully!' }), mode: 'no-cors' });
      updateIntegration('slack', { webhookUrl: slackUrl, connected: true });
      toast.success('Slack connected!');
    } catch {
      updateIntegration('slack', { webhookUrl: slackUrl, connected: true });
      toast.success('Slack webhook saved');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link2 className="w-6 h-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold">Integrations</h1>
      </div>

      {/* Groq AI — always open/connected */}
      <IntegrationCard
        title="Groq AI"
        description="LLM provider powering your chatbot"
        icon={<Zap className="w-5 h-5 text-yellow-500" />}
        connected={true}
        alwaysOpen
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1">Model</Label>
            <Select
              value={groq.model}
              onValueChange={(v) => { updateIntegration('groq', { model: v }); toast.success('Model updated'); }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
                <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B Instant</SelectItem>
                <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1">Temperature: {groq.temperature.toFixed(1)}</Label>
            <Slider
              value={[groq.temperature]}
              onValueChange={([v]) => updateIntegration('groq', { temperature: v })}
              min={0} max={1} step={0.1}
              className="mt-1"
              aria-label="Temperature"
            />
          </div>
        </div>
      </IntegrationCard>

      {/* Slack */}
      <IntegrationCard
        title="Slack"
        description="Get notified when a human takeover is requested"
        icon={<MessageSquare className="w-5 h-5 text-purple-500" />}
        connected={slack.connected}
      >
        <div className="space-y-2">
          <Label className="text-xs">Webhook URL</Label>
          <Input value={slackUrl} onChange={(e) => setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/..." aria-label="Slack webhook URL" />
          <Button size="sm" onClick={saveSlack}>Save & Test</Button>
        </div>
      </IntegrationCard>

      {/* WhatsApp */}
      <IntegrationCard
        title="WhatsApp Business"
        description="Connect WhatsApp Business API"
        icon={<MessageSquare className="w-5 h-5 text-green-500" />}
        connected={whatsapp.connected}
      >
        <div className="space-y-2">
          <Label className="text-xs">Phone Number ID</Label>
          <Input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="Phone Number ID" aria-label="WhatsApp Phone Number ID" />
          <Label className="text-xs">Access Token</Label>
          <Input value={waToken} onChange={(e) => setWaToken(e.target.value)} placeholder="Access token" type="password" aria-label="WhatsApp Access Token" />
          <Button size="sm" onClick={() => { updateIntegration('whatsapp', { phoneId: waPhone, token: waToken, connected: !!(waPhone && waToken) }); toast.success('WhatsApp settings saved'); }}>
            Save
          </Button>
        </div>
      </IntegrationCard>

      {/* Email */}
      <IntegrationCard
        title="Email"
        description="Send chat transcripts to email"
        icon={<Mail className="w-5 h-5 text-[#0891B2] dark:text-[#22D3EE]" />}
        connected={email.connected}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">SMTP Host</Label>
              <Input value={emailHost} onChange={(e) => setEmailHost(e.target.value)} placeholder="smtp.gmail.com" aria-label="SMTP host" />
            </div>
            <div>
              <Label className="text-xs">Port</Label>
              <Input value={emailPort} onChange={(e) => setEmailPort(e.target.value)} placeholder="587" aria-label="SMTP port" />
            </div>
          </div>
          <Label className="text-xs">Username</Label>
          <Input value={emailUser} onChange={(e) => setEmailUser(e.target.value)} placeholder="user@example.com" aria-label="SMTP username" />
          <Label className="text-xs">Password</Label>
          <Input value={emailPass} onChange={(e) => setEmailPass(e.target.value)} type="password" placeholder="Password" aria-label="SMTP password" />
          <Label className="text-xs">Send To</Label>
          <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="admin@example.com" aria-label="Send to email" />
          <Button size="sm" onClick={() => { updateIntegration('email', { host: emailHost, port: emailPort, user: emailUser, pass: emailPass, to: emailTo, connected: !!(emailHost && emailUser) }); toast.success('Email settings saved'); }}>
            Save
          </Button>
        </div>
      </IntegrationCard>

      {/* Zapier */}
      <IntegrationCard
        title="Zapier"
        description="Trigger Zaps on chat events"
        icon={<Zap className="w-5 h-5 text-orange-500" />}
        connected={zapier.connected}
      >
        <div className="space-y-2">
          <Label className="text-xs">Zapier Webhook URL</Label>
          <Input value={zapierUrl} onChange={(e) => setZapierUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." aria-label="Zapier webhook URL" />
          <Button size="sm" onClick={() => { updateIntegration('zapier', { webhookUrl: zapierUrl, connected: !!zapierUrl }); toast.success('Zapier webhook saved'); }}>
            Save
          </Button>
        </div>
      </IntegrationCard>

      {/* Shopify */}
      <IntegrationCard
        title="Shopify"
        description="Give your bot access to order data"
        icon={<ShoppingBag className="w-5 h-5 text-green-600" />}
        connected={shopify.connected}
      >
        <div className="space-y-2">
          <Label className="text-xs">Store URL</Label>
          <Input value={shopifyUrl} onChange={(e) => setShopifyUrl(e.target.value)} placeholder="mystore.myshopify.com" aria-label="Shopify store URL" />
          <Label className="text-xs">API Key</Label>
          <Input value={shopifyKey} onChange={(e) => setShopifyKey(e.target.value)} type="password" placeholder="shpat_xxxx" aria-label="Shopify API key" />
          <Button size="sm" onClick={() => { updateIntegration('shopify', { storeUrl: shopifyUrl, apiKey: shopifyKey, connected: !!(shopifyUrl && shopifyKey) }); toast.success('Shopify settings saved'); }}>
            Save
          </Button>
        </div>
      </IntegrationCard>
    </div>
  );
}
