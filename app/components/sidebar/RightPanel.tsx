'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  BarChart3,
  Code,
  Copy,
  Check,
  Palette,
  MessageSquare,
  Globe,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ConfigProps {
  botName: string;
  setBotName: (name: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  businessContext: string;
  setBusinessContext: (context: string) => void;
  greeting: string;
  setGreeting: (greeting: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  resetChat: (greeting: string) => void;
}

function ConfigureTab({
  botName,
  setBotName,
  systemPrompt,
  setSystemPrompt,
  businessContext,
  setBusinessContext,
  greeting,
  setGreeting,
  tone,
  setTone,
  resetChat,
}: ConfigProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Bot Name</label>
        <Input
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          placeholder="Enter bot name"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Greeting</label>
        <Input
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="Welcome message"
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => resetChat(greeting)}
        >
          Reset Chat
        </Button>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">System Prompt</label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for the AI"
          rows={4}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Business Context</label>
        <Textarea
          value={businessContext}
          onChange={(e) => setBusinessContext(e.target.value)}
          placeholder="Company information"
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Tone</label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Avatar Color</label>
        <div className="flex gap-2">
          {['#6366F1', '#8B5CF6', '#34D399', '#F59E0B'].map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-full border-2 border-white/20"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Messages</span>
            <Badge variant="secondary">47</Badge>
          </div>
          <div className="flex justify-between">
            <span>Avg Response Time</span>
            <Badge variant="secondary">2.3s</Badge>
          </div>
          <div className="flex justify-between">
            <span>Satisfaction</span>
            <Badge variant="secondary">94%</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'How do I reset my password?',
              'What are your business hours?',
              'Can I cancel my subscription?',
              'How do I upgrade my plan?',
            ].map((question, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{question}</span>
                <Badge variant="outline">{Math.floor(Math.random() * 10) + 1}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmbedTab() {
  const [copied, setCopied] = useState(false);
  const embedCode = `<script src="https://supportai-demo.vercel.app/embed.js?id=YOUR_BOT_ID"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5" />
            Embed Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            {embedCode}
          </div>
          <Button onClick={handleCopy} className="w-full">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Globe className="w-4 h-4 mr-2" />
            Open Preview
          </Button>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Webhook URL: https://api.supportai.com/webhook/YOUR_BOT_ID</p>
      </div>
    </div>
  );
}

interface RightPanelProps extends ConfigProps {}

export function RightPanel({
  botName,
  setBotName,
  systemPrompt,
  setSystemPrompt,
  businessContext,
  setBusinessContext,
  greeting,
  setGreeting,
  tone,
  setTone,
  resetChat,
}: RightPanelProps) {
  return (
    <div className="w-80 bg-white/4 border-l border-white/8 backdrop-blur-xl p-6">
      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="mt-6">
          <ConfigureTab
            botName={botName}
            setBotName={setBotName}
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            businessContext={businessContext}
            setBusinessContext={setBusinessContext}
            greeting={greeting}
            setGreeting={setGreeting}
            tone={tone}
            setTone={setTone}
            resetChat={resetChat}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="embed" className="mt-6">
          <EmbedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}