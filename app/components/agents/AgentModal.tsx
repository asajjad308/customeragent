'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Input } from '@/components/ds/Input';
import { Select } from '@/components/ds/Select';
import { AgentTypeSelector } from './AgentTypeSelector';
import { backdropVariants, modalVariants, stepVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';
import type { AgentFormData, AgentType } from '@/store/agentsStore';

const COLOR_OPTIONS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#10B981', '#F97316'];

const TONE_OPTIONS = [
  { value: 'friendly',      label: 'Friendly' },
  { value: 'professional',  label: 'Professional' },
  { value: 'casual',        label: 'Casual' },
  { value: 'formal',        label: 'Formal' },
];

const THEME_OPTIONS = [
  { value: 'SOFT_AURORA',         label: 'Soft Aurora' },
  { value: 'GLASSMORPHISM_DARK',  label: 'Glassmorphism Dark' },
  { value: 'NEO_BRUTALISM',       label: 'Neo Brutalism' },
];

const DEFAULT_FORM: AgentFormData = {
  name: '',
  typeId: 'SUPPORT',
  color: '#2563EB',
  systemPrompt: 'You are a helpful customer support assistant for {{company_name}}. Assist users clearly and empathetically.',
  businessContext: '',
  greeting: 'Hi! How can I help you today?',
  tone: 'friendly',
  temperature: 0.4,
  maxTokens: 512,
  widgetTheme: 'SOFT_AURORA',
  quickReplies: [],
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
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<AgentFormData>({ ...DEFAULT_FORM, ...initial });
  const [quickRepliesRaw, setQuickRepliesRaw] = useState((initial?.quickReplies ?? []).join(', '));

  useEffect(() => {
    if (open) {
      setStep(0);
      setDir(1);
      const merged = { ...DEFAULT_FORM, ...initial };
      setForm(merged);
      setQuickRepliesRaw((initial?.quickReplies ?? []).join(', '));
    }
  }, [open]);

  function set<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function nav(delta: number) {
    setDir(delta);
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + delta)));
  }

  async function handleSubmit() {
    const quickReplies = quickRepliesRaw.split(',').map((s) => s.trim()).filter(Boolean);
    await onSubmit({ ...form, quickReplies });
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
            <div className="relative flex-1 overflow-hidden" style={{ minHeight: 320 }}>
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
                    {step === 0 && (
                      <>
                        <Input
                          label="Agent Name *"
                          placeholder="e.g. Aria, Max, Support Bot"
                          value={form.name}
                          onChange={(e) => set('name', e.target.value)}
                          autoFocus
                        />
                        <div>
                          <p className="text-[12px] font-medium text-[var(--color-text-primary)] mb-2">Agent Type</p>
                          <AgentTypeSelector value={form.typeId} onChange={(t) => set('typeId', t)} />
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

                    {step === 1 && (
                      <>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--color-text-primary)] block mb-1">
                            System Prompt *
                          </label>
                          <textarea
                            value={form.systemPrompt}
                            onChange={(e) => set('systemPrompt', e.target.value)}
                            rows={5}
                            className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-text-tertiary)] prose-prompt"
                            placeholder="Describe how the agent should behave..."
                          />
                          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">Use {'{{company_name}}'} as a placeholder.</p>
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
                          <label className="text-[12px] font-medium text-[var(--color-text-primary)] block mb-1">Business Context</label>
                          <textarea
                            value={form.businessContext}
                            onChange={(e) => set('businessContext', e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[13px] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-text-tertiary)]"
                            placeholder="Describe your business, products, and support scope..."
                          />
                        </div>
                      </>
                    )}

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
                        <Input
                          label="Quick Replies (comma-separated)"
                          placeholder="How do I reset my password?, Talk to a human"
                          value={quickRepliesRaw}
                          onChange={(e) => setQuickRepliesRaw(e.target.value)}
                          hint="Up to 4 quick reply chips shown to the user"
                        />
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
                  {title.startsWith('Edit') ? 'Save Changes' : 'Create Agent'}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
