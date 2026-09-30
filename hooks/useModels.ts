'use client';

import { useEffect, useState } from 'react';

export interface ModelOption {
  id: string;
  provider: 'groq' | 'openai' | 'anthropic';
  contextWindow?: number;
}

interface ModelsState {
  models: ModelOption[];
  defaultModel: string;
  errors: string[];
  loading: boolean;
}

export const PROVIDER_LABELS: Record<ModelOption['provider'], string> = {
  groq: 'Groq',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

// Shared across components so opening the agent editor twice doesn't refetch.
let pending: Promise<Omit<ModelsState, 'loading'>> | null = null;

/** Chat models currently offered by the providers this workspace has keys for. */
export function useModels(): ModelsState {
  const [state, setState] = useState<ModelsState>({ models: [], defaultModel: '', errors: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    pending ??= fetch('/api/models')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch((err) => {
        pending = null;
        return { models: [], defaultModel: '', errors: [err instanceof Error ? err.message : 'Failed to load models'] };
      });
    pending.then((data) => { if (!cancelled) setState({ ...data, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  return state;
}
