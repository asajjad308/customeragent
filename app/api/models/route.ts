import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant';
import { listModels } from '@/lib/models';
import { DEFAULT_MODEL } from '@/lib/llm-client';

// Live list of chat models from each provider the tenant has a key for.
export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { models, errors } = await listModels(session!.user.tenantId);
  return NextResponse.json({ models, defaultModel: DEFAULT_MODEL, errors });
}
