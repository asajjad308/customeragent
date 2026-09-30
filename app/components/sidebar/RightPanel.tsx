'use client';

import { Code, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';
import { EmbedPanel } from '@/components/embed/EmbedPanel';
import { useAppStore } from '@/store';

export function RightPanel() {
  const { getActiveBot, updateBot, updateAgent } = useAppStore();
  const bot = getActiveBot();

  const update = (field: string, value: string) => {
    updateBot(bot.id, { [field]: value } as Parameters<typeof updateBot>[1]);
    updateAgent(bot.id, { [field]: value } as Parameters<typeof updateAgent>[1]);
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      <Tabs defaultValue="configure" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-4 shrink-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="configure" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Bot Name</label>
                <Input
                  defaultValue={bot.name}
                  onBlur={(e) => update('name', e.target.value)}
                  placeholder="Enter bot name"
                  aria-label="Bot name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Greeting</label>
                <Input
                  defaultValue={bot.greeting}
                  onBlur={(e) => update('greeting', e.target.value)}
                  placeholder="Welcome message"
                  aria-label="Bot greeting"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">System Prompt</label>
                <Textarea
                  defaultValue={bot.systemPrompt}
                  onBlur={(e) => update('systemPrompt', e.target.value)}
                  placeholder="Instructions for the AI"
                  rows={4}
                  aria-label="System prompt"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Business Context</label>
                <Textarea
                  defaultValue={bot.businessContext}
                  onBlur={(e) => update('businessContext', e.target.value)}
                  placeholder="Company information"
                  rows={3}
                  aria-label="Business context"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tone</label>
                <Select defaultValue={bot.tone} onValueChange={(v) => update('tone', v)}>
                  <SelectTrigger aria-label="Bot tone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Avatar Color</label>
                <div className="flex gap-2">
                  {['#4F46E5', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DB2777'].map((color) => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${bot.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => update('color', color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <AnalyticsPanel />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="embed" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <EmbedPanel />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
