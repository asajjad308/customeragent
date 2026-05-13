'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ArrowRightLeft, RotateCcw, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

interface BookingSlotsEvent {
  date: string;
  slots: TimeSlot[];
}

interface PendingBooking {
  slot: TimeSlot;
  name: string;
  email: string;
}

interface BookingConfirmedEvent {
  id: string | null | undefined;
  htmlLink: string | null | undefined;
  summary: string | null | undefined;
  start: string | null | undefined;
  end: string | null | undefined;
}

interface AgentChatPreviewProps {
  agent: Agent;
  onClose: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatCountdown(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AgentChatPreview({ agent, onClose }: AgentChatPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: agent.greeting || 'Hi! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [handoff, setHandoff] = useState<HandoffEvent | null>(null);

  // Booking state machine
  const [bookingSlots, setBookingSlots] = useState<BookingSlotsEvent | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);       // slot clicked → show info form
  const [infoForm, setInfoForm] = useState({ name: '', email: '' });
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null); // info filled → show confirm
  const [bookingConfirmed, setBookingConfirmed] = useState<BookingConfirmedEvent | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, bookingSlots, pendingSlot, pendingBooking, bookingConfirmed]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resetChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([{ role: 'assistant', content: agent.greeting || 'Hi! How can I help you today?' }]);
    setInput('');
    setIsStreaming(false);
    setHandoff(null);
    setBookingSlots(null);
    setPendingSlot(null);
    setInfoForm({ name: '', email: '' });
    setPendingBooking(null);
    setBookingConfirmed(null);
    setCountdown(null);
  }, [agent.greeting]);

  const sendMessage = useCallback(async (text: string, currentMessages: ChatMessage[]) => {
    const history = currentMessages.slice(1);
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages: ChatMessage[] = [...currentMessages, userMsg, { role: 'assistant', content: '' }];
    setMessages(newMessages);
    setIsStreaming(true);
    setHandoff(null);
    setBookingSlots(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          message: text,
          history,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
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
            if (parsed.type === 'replace_content') {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: parsed.content ?? '' };
                }
                return next;
              });
            } else if (parsed.type === 'handoff') {
              setHandoff({ toAgentName: parsed.toAgentName, reason: parsed.reason });
            } else if (parsed.type === 'booking_slots') {
              setBookingSlots({ date: parsed.date, slots: parsed.slots });
            } else if (parsed.type === 'booking_confirmed') {
              setBookingSlots(null);
              setPendingSlot(null);
              setPendingBooking(null);
              setBookingConfirmed(parsed.event);
              setCountdown(300); // 5-minute email confirmation countdown
            } else if (parsed.type === 'booking_error') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: parsed.message ?? 'Booking error. Please try again.' },
              ]);
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
  }, [agent.id]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text, messages);
  }, [input, isStreaming, messages, sendMessage]);

  // Step 1: slot clicked → show info form
  const handleSlotPick = useCallback((slot: TimeSlot) => {
    setPendingSlot(slot);
    setInfoForm({ name: '', email: '' });
  }, []);

  // Step 2: info form submitted → show confirmation
  const handleInfoSubmit = useCallback(() => {
    if (!pendingSlot) return;
    if (!infoForm.name.trim() || !EMAIL_RE.test(infoForm.email)) return;
    setPendingBooking({ slot: pendingSlot, name: infoForm.name.trim(), email: infoForm.email.trim() });
    setPendingSlot(null);
    setBookingSlots(null);
  }, [pendingSlot, infoForm]);

  // Step 3: confirmed → send to AI with all info in one message
  const handleConfirm = useCallback(() => {
    if (!pendingBooking) return;
    const { slot, name, email } = pendingBooking;
    setPendingBooking(null);
    setIsStreaming(false);
    abortRef.current?.abort();
    const text = `Book my appointment - Slot: ${slot.label} (start: ${slot.start}, end: ${slot.end}), Name: ${name}, Email: ${email}`;
    sendMessage(text, messages);
  }, [pendingBooking, messages, sendMessage]);

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
                <div className="text-[11px] font-semibold text-[var(--color-accent)]">Handoff → {handoff.toAgentName}</div>
                <div className="text-[11px] text-[var(--color-text-secondary)]">{handoff.reason}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1 — Slot picker */}
        <AnimatePresence>
          {bookingSlots && !pendingSlot && !pendingBooking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)]"
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Calendar size={12} className="text-[var(--color-accent)]" />
                <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                  Available on {formatDate(bookingSlots.date)}
                </span>
              </div>
              {bookingSlots.slots.length === 0 ? (
                <p className="text-[11px] text-[var(--color-text-tertiary)]">No available slots on this date.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {bookingSlots.slots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotPick(slot)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors text-left"
                    >
                      <Clock size={10} className="text-[var(--color-accent)] flex-shrink-0" />
                      <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{slot.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 2 — Info form (shown after slot selected) */}
        <AnimatePresence>
          {pendingSlot && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] space-y-2"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={11} className="text-[var(--color-accent)]" />
                <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                  Selected: {pendingSlot.label}
                </span>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Enter your details to confirm this slot</p>
              <input
                autoFocus
                type="text"
                placeholder="Full name"
                value={infoForm.name}
                onChange={(e) => setInfoForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              <input
                type="email"
                placeholder="Email address"
                value={infoForm.email}
                onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInfoSubmit(); }}
                className="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              <div className="flex gap-2 pt-0.5">
                <button
                  onClick={handleInfoSubmit}
                  disabled={!infoForm.name.trim() || !EMAIL_RE.test(infoForm.email)}
                  className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-[12px] font-semibold disabled:opacity-40 hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={() => { setPendingSlot(null); setInfoForm({ name: '', email: '' }); }}
                  className="flex-1 py-1.5 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3 — Confirmation card with all details */}
        <AnimatePresence>
          {pendingBooking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-subtle)] space-y-2"
            >
              <div className="text-[11px] font-semibold text-[var(--color-text-primary)]">Confirm your appointment</div>
              <div className="bg-[var(--surface-0)] rounded-lg p-2.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">Time</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{pendingBooking.slot.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">Name</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{pendingBooking.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">Email</span>
                  <span className="font-medium text-[var(--color-text-primary)] truncate ml-2">{pendingBooking.email}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-[12px] font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => { setPendingBooking(null); }}
                  className="flex-1 py-1.5 rounded-lg border border-[var(--color-border-default)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 4 — Booking confirmed + countdown */}
        <AnimatePresence>
          {bookingConfirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl overflow-hidden border border-[#86EFAC] dark:border-[#16A34A]/40"
            >
              <div className="bg-[#DCFCE7] dark:bg-[#14532D]/30 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#16A34A]" />
                  <span className="text-[11px] font-semibold text-[#16A34A]">Appointment Confirmed</span>
                </div>
                <div className="text-[11px] font-medium text-[var(--color-text-primary)]">{bookingConfirmed.summary}</div>
                <div className="text-[10px] text-[var(--color-text-secondary)]">{formatDateTime(bookingConfirmed.start)}</div>
                {bookingConfirmed.htmlLink && (
                  <a
                    href={bookingConfirmed.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-[10px] font-medium text-[#16A34A] underline underline-offset-2"
                  >
                    Open in Google Calendar →
                  </a>
                )}
              </div>

              {/* Email confirmation countdown */}
              {countdown !== null && countdown > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700/40 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        Check your email and click <strong>"Yes"</strong> to secure your slot
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                        Slot reserved for <span className="font-bold font-numeric">{formatCountdown(countdown)}</span> — others may book it if you don't confirm
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {countdown === 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-700/40 px-3 py-2">
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                    Time expired — please check your email and click "Yes" to still confirm your slot.
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Quick replies — only shown before first user message */}
      {agent.quickReplies && agent.quickReplies.length > 0 && messages.length === 1 && !isStreaming && (
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
