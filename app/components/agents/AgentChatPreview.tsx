'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ds/Button';
import { Spinner } from '@/components/ds/Spinner';
import { fadeIn } from '@/lib/animations';
import type { Agent } from '@/store/agentsStore';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface HandoffEvent {
  toAgentName: string;
  reason: string;
}

interface AgentChatPreviewProps {
  agent: Agent;
  onClose: () => void;
}

export function AgentChatPreview({ agent, onClose }: AgentChatPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: agent.greeting || 'Hi! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [handoff, setHandoff] = useState<HandoffEvent | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([{ role: 'assistant', content: agent.greeting || 'Hi! How can I help you today?' }]);
    setInput('');
    setIsStreaming(false);
    setHandoff(null);
  }, [agent.greeting]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');

    const history = messages.slice(1); // exclude initial greeting
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setIsStreaming(true);
    setHandoff(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, message: text, history }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.type === 'handoff') {
              setHandoff({ toAgentName: parsed.toAgentName, reason: parsed.reason });
            } else if (parsed.content) {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            next[next.length - 1] = { ...last, content: 'Sorry, something went wrong. Please try again.' };
          }
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, agent.id]);

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col h-full bg-[var(--surface-0)] border-l border-[var(--color-border-subtle)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[12px] font-bold"
            style={{ backgroundColor: agent.avatarColor || '#2563EB' }}
          >
            {agent.name.charAt(0)}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">{agent.name}</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-status-pulse" />
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Preview mode</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" onClick={resetChat} iconLeft={<RotateCcw size={12} />}>Reset</Button>
          <Button variant="ghost" size="xs" onClick={onClose}><X size={14} /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[var(--color-accent)] text-white rounded-br-sm'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] rounded-bl-sm border border-[var(--color-border-subtle)]',
                )}
              >
                {msg.content || (isStreaming && i === messages.length - 1 ? (
                  <div className="flex items-center gap-1 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : null)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Handoff card */}
        <AnimatePresence>
          {handoff && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-muted)]"
            >
              <ArrowRightLeft size={13} className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-[var(--color-accent)]">
                  Handoff → {handoff.toAgentName}
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)]">{handoff.reason}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {agent.quickReplies && agent.quickReplies.length > 0 && !isStreaming && (
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {agent.quickReplies.slice(0, 4).map((qr) => (
            <button
              key={qr}
              onClick={() => setInput(qr)}
              className="px-2.5 py-1 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-[var(--color-bg-subtle)] rounded-xl border border-[var(--color-border-default)] px-3 py-2 focus-within:border-[var(--color-accent)] transition-colors"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={isStreaming}
            className="flex-1 text-[13px] bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-7 h-7 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-accent-hover)] transition-colors flex-shrink-0"
          >
            {isStreaming ? <Spinner size="xs" /> : <Send size={12} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
