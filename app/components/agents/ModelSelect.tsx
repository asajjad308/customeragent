'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useModels, PROVIDER_LABELS, type ModelOption } from '@/hooks/useModels';

interface ModelSelectProps {
  value: string | undefined;
  onChange: (model: string) => void;
}

/** Model picker fed by the providers' live model lists, grouped by provider. */
export function ModelSelect({ value, onChange }: ModelSelectProps) {
  const { models, defaultModel, errors, loading } = useModels();
  const known = !value || models.some((m) => m.id === value);

  // A new agent starts on the platform default once the list has loaded.
  useEffect(() => {
    if (!value && defaultModel) onChange(defaultModel);
  }, [value, defaultModel]);

  const groups = models.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <label htmlFor="agent-model" className="text-[12px] font-medium text-[var(--color-text-primary)] flex items-center gap-1.5 mb-1">
        Model {loading && <Loader2 size={11} className="animate-spin text-[var(--color-text-tertiary)]" />}
      </label>
      <select
        id="agent-model"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading && !value}
        className="w-full h-8 px-2.5 text-[13px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
      >
        {loading && !value && <option value="">Loading models…</option>}
        {value && !known && !loading && <option value={value}>{value} (no longer available)</option>}
        {value && !known && loading && <option value={value}>{value}</option>}
        {Object.entries(groups).map(([provider, list]) => (
          <optgroup key={provider} label={PROVIDER_LABELS[provider as ModelOption['provider']]}>
            {list.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id}{m.contextWindow ? ` · ${Math.round(m.contextWindow / 1000)}k ctx` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
        {!loading && value && !known
          ? 'This model has been retired by its provider. Pick a current one.'
          : 'Fetched live from the providers you have API keys for (Settings → LLM keys).'}
      </p>
      {errors.length > 0 && (
        <p className="text-[10px] text-amber-600 mt-0.5">Could not load: {errors.join(', ')}</p>
      )}
    </div>
  );
}
