import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { z } from 'zod';

const createSchema = z.object({
  agentId: z.string(),
  visitorId: z.string().optional(),
  channel: z.string().optional(),
  metadata: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  const conversations = await prisma.conversation.findMany({
    where: {
      tenantId: session!.user.tenantId,
      ...(agentId ? { agentId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { agentId, visitorId, channel, metadata } = parsed.data;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, tenantId: session!.user.tenantId },
  });
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      tenantId: session!.user.tenantId,
      agentId,
      sessionId: crypto.randomUUID(),
      visitorId,
      channel: channel ?? 'dashboard',
      metadata,
    },
  });

  return NextResponse.json(conversation, { status: 201 });
}
