'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Input } from '@/components/ds/Input';
import { Select } from '@/components/ds/Select';
import { AgentTypeSelector } from './AgentTypeSelector';
import { backdropVariants, modalVariants, stepVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';
import type { AgentFormData, AgentType } from '@/store/agentsStore';

const COLOR_OPTIONS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#10B981', '#F97316'];

const TONE_OPTIONS = [
  { value: 'friendly',     label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual',       label: 'Casual' },
  { value: 'formal',       label: 'Formal' },
];

const THEME_OPTIONS = [
  { value: 'SOFT_AURORA',        label: 'Soft Aurora' },
  { value: 'GLASSMORPHISM_DARK', label: 'Glassmorphism Dark' },
  { value: 'NEO_BRUTALISM',      label: 'Neo Brutalism' },
];

// ── Per-type defaults ──────────────────────────────────────────────────────────
const TYPE_DEFAULTS: Record<AgentType, {
  systemPrompt: string;
  greeting: string;
  tone: string;
  quickReplies: string[];
  color: string;
}> = {
  SUPPORT: {
    color: '#2563EB',
    tone: 'friendly',
    greeting: 'Hi! How can I help you today?',
    quickReplies: ['Track my order', 'Request a refund', 'Talk to a human'],
    systemPrompt: `You are a friendly customer support assistant for {{company_name}}.

Your responsibilities:
- Help customers resolve issues with products or services
- Answer questions clearly and empathetically
- Acknowledge frustration and apologize when appropriate
- Provide step-by-step solutions
- Escalate to a human agent when you cannot resolve an issue

Always confirm the customer's issue is resolved before ending the conversation.`,
  },

  TECHNICAL: {
    color: '#0891B2',
    tone: 'professional',
    greeting: 'Hello! I\'m your technical support specialist. What issue can I help you debug today?',
    quickReplies: ['Getting an error', 'Integration not working', 'API documentation'],
    systemPrompt: `You are a technical support specialist for {{company_name}}.

Your responsibilities:
- Help users troubleshoot technical issues and bugs
- Ask targeted clarifying questions to diagnose problems accurately
- Provide clear step-by-step debugging instructions
- Reference relevant documentation when helpful
- Suggest workarounds while permanent fixes are deployed
- Escalate to the engineering team for critical bugs

Always ask for: operating system, browser/version, error messages, and steps to reproduce.`,
  },

  SALES: {
    color: '#059669',
    tone: 'friendly',
    greeting: 'Hi there! I\'m here to help you find the perfect solution. What are you looking to achieve?',
    quickReplies: ['See pricing', 'Book a demo', 'Compare plans', 'Talk to sales'],
    systemPrompt: `You are an enthusiastic sales assistant for {{company_name}}.

Your responsibilities:
- Understand the customer's goals, pain points, and budget
- Match their needs to the right product or plan
- Highlight key benefits and ROI with specific examples
- Handle objections confidently and professionally
- Create urgency without being pushy
- Qualify leads and schedule demos or calls when appropriate

Always aim to collect: name, email, company size, and intended use case.`,
  },

  LEAD_GEN: {
    color: '#D97706',
    tone: 'friendly',
    greeting: 'Hi! I\'d love to learn more about what you\'re looking for. Can I ask you a few quick questions?',
    quickReplies: ['Get a free quote', 'Learn more', 'Talk to an expert'],
    systemPrompt: `You are a lead qualification assistant for {{company_name}}.

Your responsibilities:
- Engage visitors and understand their needs
- Qualify leads by asking about budget, timeline, team size, and goals
- Capture contact information: name, email, company, and phone number
- Identify decision-makers and buying authority
- Route hot leads to the sales team immediately
- Nurture cold leads with helpful content

Required information to collect before handoff: name, email, company name, primary use case, and timeline.`,
  },

  ONBOARDING: {
    color: '#7C3AED',
    tone: 'friendly',
    greeting: 'Welcome to {{company_name}}! 🎉 I\'m here to help you get set up quickly. Where would you like to start?',
    quickReplies: ['Getting started guide', 'Set up my account', 'Connect integrations', 'Watch a tutorial'],
    systemPrompt: `You are a friendly onboarding guide for {{company_name}}.

Your responsibilities:
- Welcome new users warmly and make them feel confident
- Walk users through key features and setup steps
- Proactively address common stumbling blocks
- Celebrate milestones and progress
- Help users reach their first success moment as quickly as possible
- Connect users to relevant documentation and tutorials

Focus on: account setup, first key action, and integrations that are most relevant to the user's goal.`,
  },

  HR: {
    color: '#DC2626',
    tone: 'professional',
    greeting: 'Hello! I\'m the HR assistant for {{company_name}}. How can I help you today?',
    quickReplies: ['Leave policy', 'Benefits information', 'Payroll question', 'Submit a request'],
    systemPrompt: `You are a professional HR assistant for {{company_name}}.

Your responsibilities:
- Answer employee questions about company policies, benefits, and procedures
- Explain leave policies, payroll processes, and HR workflows
- Help employees submit requests and find the right HR contact
- Maintain confidentiality at all times
- Direct sensitive matters to a human HR representative

Topics you can help with: leave requests, benefits enrollment, payroll questions, onboarding paperwork, and company policies.

Always remind employees that sensitive personal matters should be discussed directly with an HR representative.`,
  },

  BOOKING: {
    color: '#0D9488',
    tone: 'friendly',
    greeting: 'Hi! I can help you schedule an appointment. What type of meeting are you looking for?',
    quickReplies: ['Book a meeting', 'Check availability', 'Reschedule', 'Cancel booking'],
    systemPrompt: `You are a scheduling assistant for {{company_name}}.

Your responsibilities:
- Help customers book appointments, demos, or consultations
- Collect required information: name, email, preferred date/time, and meeting type
- Share the booking link for self-scheduling: {{booking_link}}
- Confirm booking details before finalizing
- Handle reschedules and cancellations gracefully
- Send confirmation details and what to expect

Booking flow:
1. Ask what type of appointment they need
2. Collect their contact information
3. Share the booking link: {{booking_link}}
4. Confirm they've completed the booking
5. Provide a summary of next steps`,
  },

  CUSTOM: {
    color: '#6B7280',
    tone: 'professional',
    greeting: 'Hello! How can I assist you today?',
    quickReplies: [],
    systemPrompt: `You are a helpful AI assistant for {{company_name}}.

Your role: [describe your agent's specific purpose here]

Guidelines:
- Stay focused on your designated scope
- Be clear, concise, and helpful
- Ask clarifying questions when needed
- Escalate to a human when outside your capabilities`,
  },
};

const DEFAULT_FORM: AgentFormData = {
  name: '',
  typeId: 'SUPPORT',
  color: TYPE_DEFAULTS.SUPPORT.color,
  systemPrompt: TYPE_DEFAULTS.SUPPORT.systemPrompt,
  businessContext: '',
  greeting: TYPE_DEFAULTS.SUPPORT.greeting,
  tone: TYPE_DEFAULTS.SUPPORT.tone,
  temperature: 0.4,
  maxTokens: 512,
  widgetTheme: 'SOFT_AURORA',
  quickReplies: TYPE_DEFAULTS.SUPPORT.quickReplies,
};

const STEPS = ['Identity', 'Personality', 'Configuration'];

interface AgentModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<AgentFormData>;
  onSubmit: (data: AgentFormData) => Promise<void>;
  title?: string;
  loading?: boolean;
}

export function AgentModal({ open, onClose, initial, onSubmit, title = 'Create Agent', loading }: AgentModalProps) {
  const isEdit = title.startsWith('Edit');
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<AgentFormData>({ ...DEFAULT_FORM, ...initial });
  const [quickRepliesRaw, setQuickRepliesRaw] = useState((initial?.quickReplies ?? DEFAULT_FORM.quickReplies).join(', '));
  // Booking-specific calendar URL (injected into system prompt)
  const [calendarUrl, setCalendarUrl] = useState('');

  useEffect(() => {
    if (open) {
      setStep(0);
      setDir(1);
      const merged = { ...DEFAULT_FORM, ...initial };
      setForm(merged);
      setQuickRepliesRaw((initial?.quickReplies ?? DEFAULT_FORM.quickReplies).join(', '));
      setCalendarUrl('');
    }
  }, [open]);

  function set<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // When type changes (only in create mode), fill defaults for that type
  function handleTypeChange(type: AgentType) {
    if (isEdit) { set('typeId', type); return; }
    const defaults = TYPE_DEFAULTS[type];
    setForm((f) => ({
      ...f,
      typeId: type,
      color: defaults.color,
      systemPrompt: defaults.systemPrompt,
      greeting: defaults.greeting,
      tone: defaults.tone,
      quickReplies: defaults.quickReplies,
    }));
    setQuickRepliesRaw(defaults.quickReplies.join(', '));
  }

  function nav(delta: number) {
    setDir(delta);
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + delta)));
  }

  async function handleSubmit() {
    const quickReplies = quickRepliesRaw.split(',').map((s) => s.trim()).filter(Boolean);
    // Inject calendar URL into system prompt for booking agents
    let finalPrompt = form.systemPrompt;
    if (form.typeId === 'BOOKING' && calendarUrl.trim()) {
      finalPrompt = finalPrompt.replace(/\{\{booking_link\}\}/g, calendarUrl.trim());
    }
    await onSubmit({ ...form, systemPrompt: finalPrompt, quickReplies });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  const stepValid = [
    form.name.trim().length > 0,
    form.systemPrompt.trim().length > 0,
    true,
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKey}>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-xl bg-[var(--surface-0)] rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] z-10 flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--color-border-subtle)]">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all',
                      i < step ? 'bg-[var(--color-accent)] text-white' :
                      i === step ? 'bg-[var(--color-accent)] text-white' :
                      'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)]',
                    )}
                  >
                    {i < step ? <Check size={11} /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-[12px] font-medium hidden sm:block',
                    i <= step ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]',
                  )}>
                    {s}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={cn('h-px flex-1 w-8', i < step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]')} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="relative flex-1 overflow-hidden" style={{ minHeight: 340 }}>
              <AnimatePresence custom={dir} initial={false} mode="wait">
                <motion.div
                  key={step}
                  custom={dir}
                  variants={stepVariants as never}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0 overflow-y-auto"
                >
                  <div className="px-6 py-5 space-y-4">

                    {/* ── Step 1: Identity ── */}
                    {step === 0 && (
                      <>
                        <Input
                          label="Agent Name *"
                          placeholder="e.g. Aria, Max, BookingBot"
                          value={form.name}
                          onChange={(e) => set('name', e.target.value)}
                          autoFocus
                        />
                        <div>
                          <p className="text-[12px] font-medium text-[var(--color-text-primary)] mb-2">
                            Agent Type
                            {!isEdit && (
                              <span className="ml-1.5 text-[10px] font-normal text-[var(--color-text-tertiary)]">
                                — auto-fills the system prompt
                              </span>
                            )}
                          </p>
                          <AgentTypeSelector value={form.typeId} onChange={handleTypeChange} />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-[var(--color-text-primary)] mb-2">Widget Color</p>
                          <div className="flex gap-2 flex-wrap">
                            {COLOR_OPTIONS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => set('color', c)}
                                className={cn(
                                  'w-8 h-8 rounded-full border-2 transition-all',
                                  form.color === c ? 'border-[var(--color-text-primary)] scale-110' : 'border-[var(--color-border-subtle)]',
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Step 2: Personality ── */}
                    {step === 1 && (
                      <>
                        {/* Booking: calendar URL input */}
                        {form.typeId === 'BOOKING' && (
                          <div className="rounded-xl border border-[#0D9488]/30 bg-[#F0FDFA] p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#0D9488]" />
                              <span className="text-[12px] font-semibold text-[#0D9488]">Calendar / Booking Link</span>
                            </div>
                            <p className="text-[11px] text-[#0F766E]">
                              Paste your Calendly, Cal.com, or Google Calendar scheduling link. The agent will share it automatically.
                            </p>
                            <div className="relative">
                              <input
                                type="url"
                                value={calendarUrl}
                                onChange={(e) => setCalendarUrl(e.target.value)}
                                placeholder="https://calendly.com/yourname/30min"
                                className="w-full h-8 pl-3 pr-8 text-[13px] rounded-lg border border-[#0D9488]/40 bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
                              />
                              {calendarUrl && (
                                <a
                                  href={calendarUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#0D9488]"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-[#0F766E]">
                              Injected as <code className="bg-[#CCFBF1] px-1 rounded">{'{{booking_link}}'}</code> in your system prompt.
                            </p>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-medium text-[var(--color-text-primary)]">
                              System Prompt *
                            </label>
                            {!isEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  const defaults = TYPE_DEFAULTS[form.typeId];
                                  set('systemPrompt', defaults.systemPrompt);
                                }}
                                className="text-[10px] text-[var(--color-accent)] hover:underline"
                              >
                                Reset to default
                              </button>
                            )}
                          </div>
                          <textarea
                            value={form.systemPrompt}
                            onChange={(e) => set('systemPrompt', e.target.value)}
                            rows={7}
                            className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-text-tertiary)] prose-prompt"
                            placeholder="Describe how the agent should behave..."
                          />
                          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                            Use <code className="bg-[var(--color-bg-muted)] px-1 rounded">{'{{company_name}}'}</code>
                            {form.typeId === 'BOOKING' && (
                              <> and <code className="bg-[var(--color-bg-muted)] px-1 rounded">{'{{booking_link}}'}</code></>
                            )} as placeholders.
                          </p>
                        </div>

                        <Input
                          label="Greeting message"
                          placeholder="Hi! How can I help you today?"
                          value={form.greeting}
                          onChange={(e) => set('greeting', e.target.value)}
                        />
                        <Select
                          label="Tone"
                          options={TONE_OPTIONS}
                          value={form.tone}
                          onChange={(e) => set('tone', e.target.value)}
                        />
                        <div>
                          <label className="text-[12px] font-medium text-[var(--color-text-primary)] block mb-1">
                            Business Context
                          </label>
                          <textarea
                            value={form.businessContext}
                            onChange={(e) => set('businessContext', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-text-tertiary)]"
                            placeholder="Describe your business, products, or any extra context the agent should know..."
                          />
                        </div>
                      </>
                    )}

                    {/* ── Step 3: Configuration ── */}
                    {step === 2 && (
                      <>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--color-text-primary)] block mb-1">
                            Temperature: {form.temperature}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={form.temperature}
                            onChange={(e) => set('temperature', parseFloat(e.target.value))}
                            className="w-full accent-[var(--color-accent)]"
                          />
                          <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
                            <span>Precise (0)</span>
                            <span>Creative (1)</span>
                          </div>
                        </div>
                        <Select
                          label="Widget Theme"
                          options={THEME_OPTIONS}
                          value={form.widgetTheme}
                          onChange={(e) => set('widgetTheme', e.target.value as AgentFormData['widgetTheme'])}
                        />
                        <div>
                          <label className="text-[12px] font-medium text-[var(--color-text-primary)] block mb-1">
                            Quick Replies
                          </label>
                          <input
                            type="text"
                            value={quickRepliesRaw}
                            onChange={(e) => setQuickRepliesRaw(e.target.value)}
                            placeholder="Book a meeting, Check availability, Talk to a human"
                            className="w-full h-8 px-3 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                          />
                          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                            Comma-separated. Up to 4 chips shown to the user.
                          </p>
                          {/* Preview chips */}
                          {quickRepliesRaw.trim() && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {quickRepliesRaw.split(',').map((qr) => qr.trim()).filter(Boolean).slice(0, 4).map((qr) => (
                                <span key={qr} className="px-2.5 py-1 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)]">
                                  {qr}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-subtle)]">
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<ChevronLeft size={14} />}
                onClick={() => nav(-1)}
                disabled={step === 0}
              >
                Back
              </Button>
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-4 bg-[var(--color-accent)]' : 'w-1.5 bg-[var(--color-bg-muted)]')}
                  />
                ))}
              </div>
              {step < STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ChevronRight size={14} />}
                  onClick={() => nav(1)}
                  disabled={!stepValid[step]}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  loading={loading}
                  disabled={!stepValid[step]}
                  onClick={handleSubmit}
                >
                  {isEdit ? 'Save Changes' : 'Create Agent'}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
