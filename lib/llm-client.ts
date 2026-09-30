import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

export type LlmProvider = 'groq' | 'openai' | 'anthropic';

const PROVIDER_BASES: Record<Exclude<LlmProvider, 'anthropic'>, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
};

// Used when an agent has no model set. The picker lists what each provider actually offers
// (see /api/models), so this only needs to be a model Groq currently serves.
export const DEFAULT_MODEL = 'openai/gpt-oss-120b';

// Groq models that have been shut down. Agents saved with one of these keep working
// by falling back to DEFAULT_MODEL until they are edited to pick a current model.
const RETIRED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
]);

export function resolveModel(model: string | null | undefined): string {
  if (!model) return DEFAULT_MODEL;
  if (RETIRED_MODELS.has(model)) {
    console.warn(`[llm] model "${model}" is retired, using ${DEFAULT_MODEL}`);
    return DEFAULT_MODEL;
  }
  return model;
}

export function detectProvider(model: string): LlmProvider {
  if (model.startsWith('claude-')) return 'anthropic';
  if (
    model.startsWith('gpt-') ||
    model.startsWith('o1') ||
    model.startsWith('o3') ||
    model.startsWith('o4')
  )
    return 'openai';
  return 'groq';
}

async function getTenantKey(tenantId: string, provider: LlmProvider): Promise<string | null> {
  const record = await prisma.llmApiKey.findFirst({
    where: { tenantId, provider, isActive: true },
    select: { key: true },
    orderBy: { createdAt: 'desc' },
  });
  return record?.key ?? null;
}

function envFallback(provider: LlmProvider): string | undefined {
  if (provider === 'groq') return process.env.GROQ_API_KEY;
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY;
}

export type OpenAILike = OpenAI;

export type LlmClientResult =
  | { provider: 'anthropic'; client: Anthropic; apiKey: string }
  | { provider: 'groq' | 'openai'; client: OpenAI; apiKey: string };

/** The tenant's own key for a provider, else the platform key from the environment. */
export async function resolveApiKey(tenantId: string | null, provider: LlmProvider): Promise<string> {
  return (tenantId ? await getTenantKey(tenantId, provider) : null) ?? envFallback(provider) ?? '';
}

export async function getLlmClient(tenantId: string | null, model: string): Promise<LlmClientResult> {
  const provider = detectProvider(model);
  const apiKey = await resolveApiKey(tenantId, provider);

  if (provider === 'anthropic') {
    return { provider, client: new Anthropic({ apiKey }), apiKey };
  }

  return {
    provider,
    client: new OpenAI({ apiKey, baseURL: PROVIDER_BASES[provider] }),
    apiKey,
  };
}
