'use client';

import { useState } from 'react';
import { Plus, ChevronDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#3B82F6'];

export function BotSelector() {
  const { bots, activeBotId, setActiveBot, createAgent, getActiveBot } = useAppStore();
  const activeBot = getActiveBot();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful customer support assistant.');
  const [businessContext, setBusinessContext] = useState('');
  const [greeting, setGreeting] = useState('Hi! How can I help you today?');
  const [tone, setTone] = useState('friendly');

  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Bot name is required'); return; }
    setCreating(true);
    const bot = await createAgent({ name: name.trim(), color, systemPrompt, businessContext, greeting, tone });
    setCreating(false);
    if (!bot) { toast.error('Failed to create bot'); return; }
    setShowCreate(false);
    setName(''); setColor(COLOR_OPTIONS[0]); setSystemPrompt(''); setBusinessContext(''); setGreeting('Hi! How can I help you today?'); setTone('friendly');
    toast.success(`Bot "${name}" created`);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted/80 transition-colors text-left"
            aria-label="Select bot"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: activeBot.color }}>
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm flex-1 truncate">{activeBot.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start" role="listbox" aria-label="Bot list">
          {bots.map((bot) => (
            <button
              key={bot.id}
              role="option"
              aria-selected={bot.id === activeBotId}
              onClick={() => { setActiveBot(bot.id); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${bot.id === activeBotId ? 'bg-muted' : ''}`}
            >
              <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: bot.color }} />
              <span className="flex-1 truncate">{bot.name}</span>
              {bot.id === activeBotId && <Badge variant="secondary" className="text-xs py-0">Active</Badge>}
            </button>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); setShowCreate(true); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Add new bot"
            >
              <Plus className="w-4 h-4" />
              Add New Bot
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Bot Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support Bot" aria-label="Bot name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Avatar Color</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={`Select color ${c}`} />
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Greeting</Label>
              <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} aria-label="Bot greeting" />
            </div>
            <div className="grid gap-1.5">
              <Label>System Prompt</Label>
              <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} aria-label="System prompt" />
            </div>
            <div className="grid gap-1.5">
              <Label>Business Context</Label>
              <Textarea value={businessContext} onChange={(e) => setBusinessContext(e.target.value)} rows={2} placeholder="Company info, products, policies..." aria-label="Business context" />
            </div>
            <div className="grid gap-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={creating} aria-label="Create bot">
              {creating ? 'Creating…' : 'Create Bot'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
