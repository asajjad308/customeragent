'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BotConfig {
  botId: string;
  name: string;
  greeting: string;
  systemPrompt: string;
  businessContext: string;
  tone: string;
  color: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface WidgetPageProps {
  searchParams: Promise<{ botId?: string }>;
}

export default function WidgetPage({ searchParams }: WidgetPageProps) {
  const { botId } = use(searchParams);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/bot-config/${botId ?? 'default'}`);
        const cfg: BotConfig = await res.json();
        setConfig(cfg);
        setMessages([{ role: 'assistant', content: cfg.greeting, timestamp: Date.now() }]);
      } catch {
        setConfig({
          botId: botId ?? 'default',
          name: 'Assistant',
          greeting: 'Hi! How can I help you?',
          systemPrompt: 'You are a helpful assistant.',
          businessContext: '',
          tone: 'friendly',
          color: '#6366F1',
        });
      }
    };
    load();
  }, [botId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentResponse, isTyping]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping || !config) return;

    const userMsg: Message = { role: 'user', content, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setCurrentResponse('');

    try {
      const fullPrompt = `${config.systemPrompt}\n\nBusiness Context: ${config.businessContext}\nTone: ${config.tone}\n\nSCOPE ENFORCEMENT: You must ONLY answer questions relevant to your role and the business context above. If the user asks about anything outside your scope, politely decline and redirect them back to topics you can help with.`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          systemPrompt: fullPrompt,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No body');

      let accumulated = '';
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            if (parsed?.content) { accumulated += parsed.content; setCurrentResponse(accumulated); }
          } catch {}
        }
      }

      setMessages([...newMessages, { role: 'assistant', content: accumulated, timestamp: Date.now() }]);
      setCurrentResponse('');
      // Notify parent of new unread if widget is embedded
      window.parent.postMessage('sai:unread', '*');
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClose = () => window.parent.postMessage('sai:close', '*');

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white shrink-0"
        style={{ backgroundColor: config.color }}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback style={{ backgroundColor: config.color }} className="text-white font-semibold">
              {config.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">{config.name}</div>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block" />
              Online
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="opacity-80 hover:opacity-100 p-1 rounded"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback style={{ backgroundColor: config.color }} className="text-white text-xs">
                  {config.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: config.color } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {currentResponse && (
          <div className="flex gap-2 justify-start">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback style={{ backgroundColor: config.color }} className="text-white text-xs">
                {config.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-[80%] bg-muted text-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
              {currentResponse}
            </div>
          </div>
        )}

        {isTyping && !currentResponse && (
          <div className="flex gap-2 justify-start">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback style={{ backgroundColor: config.color }} className="text-white text-xs">
                {config.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-24 resize-none text-sm"
            disabled={isTyping}
            aria-label="Message input"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            style={{ backgroundColor: config.color }}
            className="text-white shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Powered by <span className="font-medium">SupportAI</span>
        </p>
      </div>
    </div>
  );
}
