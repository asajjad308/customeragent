'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description: string;
  href?: string;
  check: () => Promise<boolean>;
}

const STEPS: Step[] = [
  {
    id: 'agent',
    label: 'Create your first agent',
    description: 'Set up an AI agent with a system prompt and greeting.',
    check: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) return false;
      const agents = await res.json();
      return agents.length > 0;
    },
  },
  {
    id: 'knowledge',
    label: 'Add knowledge base content',
    description: 'Import a webpage or add FAQ entries so your bot answers accurately.',
    check: async () => {
      const res = await fetch('/api/knowledge-base');
      if (!res.ok) return false;
      const entries = await res.json();
      return entries.length > 0;
    },
  },
  {
    id: 'llmkey',
    label: 'Add your LLM API key',
    description: 'Connect your Groq, OpenAI, or Anthropic key in Settings → AI Keys.',
    href: '/settings?tab=ai-providers',
    check: async () => {
      const res = await fetch('/api/tenant/llm-keys');
      if (!res.ok) return false;
      const keys = await res.json();
      return keys.length > 0;
    },
  },
  {
    id: 'embed',
    label: 'Embed the widget on your site',
    description: 'Copy the embed snippet from the agent\'s Embed tab.',
    check: async () => {
      // Mark complete if the agent has ever been active
      const res = await fetch('/api/agents');
      if (!res.ok) return false;
      const agents = await res.json();
      return agents.some((a: { messageCount?: number }) => (a.messageCount ?? 0) > 0);
    },
  },
  {
    id: 'billing',
    label: 'Upgrade your plan',
    description: 'Unlock more agents, messages, and integrations.',
    href: '/settings?tab=billing',
    check: async () => {
      const res = await fetch('/api/usage');
      if (!res.ok) return false;
      const data = await res.json();
      return data.plan && data.plan !== 'free';
    },
  },
];

const STORAGE_KEY = 'onboarding_dismissed';

export function OnboardingChecklist() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden, show after check

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) return;
    setDismissed(false);

    // Check each step
    Promise.allSettled(STEPS.map((s) => s.check())).then((results) => {
      const map: Record<string, boolean> = {};
      STEPS.forEach((s, i) => {
        map[s.id] = results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<boolean>).value;
      });
      setCompleted(map);

      // Auto-dismiss if everything is done
      if (Object.values(map).every(Boolean)) {
        localStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
      }
    });
  }, []);

  if (dismissed) return null;

  const doneCount = Object.values(completed).filter(Boolean).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-indigo-500 text-white cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Getting started</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{doneCount}/{STEPS.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <button
            onClick={(e) => { e.stopPropagation(); localStorage.setItem(STORAGE_KEY, '1'); setDismissed(true); }}
            aria-label="Dismiss checklist"
          >
            <X className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {!collapsed && (
        <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
          {STEPS.map((step) => {
            const done = completed[step.id] ?? false;
            const content = (
              <div className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${done ? 'opacity-60' : 'hover:bg-muted/60 cursor-pointer'}`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                <div>
                  <div className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>{step.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{step.description}</div>
                </div>
              </div>
            );
            return step.href && !done ? (
              <a key={step.id} href={step.href}>{content}</a>
            ) : (
              <div key={step.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
