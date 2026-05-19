import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { z } from 'zod';

const PROVIDERS = ['groq', 'openai', 'anthropic'] as const;

const createSchema = z.object({
  provider: z.enum(PROVIDERS),
  label: z.string().min(1).max(80),
  key: z.string().min(10),
});

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const keys = await prisma.llmApiKey.findMany({
    where: { tenantId: session!.user.tenantId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      provider: true,
      label: true,
      isActive: true,
      createdAt: true,
      key: true,
    },
  });

  // Mask the key — show only first 6 and last 4 chars
  const masked = keys.map(({ key, ...rest }) => ({
    ...rest,
    keyPreview: key.length > 10 ? `${key.slice(0, 6)}${'•'.repeat(8)}${key.slice(-4)}` : '•'.repeat(key.length),
  }));

  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { provider, label, key } = parsed.data;
  const tenantId = session!.user.tenantId;

  const existing = await prisma.llmApiKey.findUnique({
    where: { tenantId_provider_label: { tenantId, provider, label } },
  });
  if (existing) {
    return NextResponse.json({ error: 'A key with this provider and label already exists.' }, { status: 409 });
  }

  const record = await prisma.llmApiKey.create({
    data: { tenantId, provider, label, key },
    select: { id: true, provider: true, label: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(record, { status: 201 });
}
