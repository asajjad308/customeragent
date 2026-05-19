import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

export type LlmProvider = 'groq' | 'openai' | 'anthropic';

const PROVIDER_BASES: Record<Exclude<LlmProvider, 'anthropic'>, string> = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
};

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

export async function getLlmClient(tenantId: string | null, model: string): Promise<LlmClientResult> {
  const provider = detectProvider(model);
  const apiKey =
    (tenantId ? await getTenantKey(tenantId, provider) : null) ??
    envFallback(provider) ??
    '';

  if (provider === 'anthropic') {
    return { provider, client: new Anthropic({ apiKey }), apiKey };
  }

  return {
    provider,
    client: new OpenAI({ apiKey, baseURL: PROVIDER_BASES[provider] }),
    apiKey,
  };
}
