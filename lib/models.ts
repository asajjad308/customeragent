import { resolveApiKey, type LlmProvider } from '@/lib/llm-client';

export interface ModelOption {
  id: string;
  provider: LlmProvider;
  contextWindow?: number;
}

// Model families that are not chat models (speech, TTS, moderation, embeddings, images…).
const NON_CHAT = /whisper|orpheus|tts|transcribe|guard|safeguard|embed|moderation|dall-e|image|audio|realtime|search|davinci|babbage|computer-use/i;

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; models: ModelOption[] }>();

async function fetchGroq(key: string): Promise<ModelOption[]> {
  const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string; active?: boolean; context_window?: number }[] };
  return data
    .filter((m) => m.active !== false && !NON_CHAT.test(m.id))
    .map((m) => ({ id: m.id, provider: 'groq' as const, contextWindow: m.context_window }));
}

async function fetchOpenAI(key: string): Promise<ModelOption[]> {
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string }[] };
  // Only ids that detectProvider() routes to OpenAI, so the picked model reaches the right API.
  return data
    .filter((m) => /^(gpt-|o\d)/.test(m.id) && !NON_CHAT.test(m.id))
    .map((m) => ({ id: m.id, provider: 'openai' as const }));
}

async function fetchAnthropic(key: string): Promise<ModelOption[]> {
  const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string }[] };
  return data.map((m) => ({ id: m.id, provider: 'anthropic' as const }));
}

const FETCHERS: Record<LlmProvider, (key: string) => Promise<ModelOption[]>> = {
  groq: fetchGroq,
  openai: fetchOpenAI,
  anthropic: fetchAnthropic,
};

/**
 * Chat models currently offered by every provider this tenant has a key for (their own key,
 * or the platform key from the environment). Results are cached per key for 10 minutes.
 * A provider that fails is skipped and reported in `errors` rather than failing the whole list.
 */
export async function listModels(tenantId: string | null) {
  const errors: string[] = [];
  const results = await Promise.all(
    (Object.keys(FETCHERS) as LlmProvider[]).map(async (provider) => {
      const key = await resolveApiKey(tenantId, provider);
      if (!key) return [];
      const cacheKey = `${provider}:${key.slice(-8)}`;
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.at < TTL_MS) return hit.models;
      try {
        const models = (await FETCHERS[provider](key)).sort((a, b) => a.id.localeCompare(b.id));
        cache.set(cacheKey, { at: Date.now(), models });
        return models;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `${provider} failed`);
        return [];
      }
    }),
  );
  return { models: results.flat(), errors };
}
