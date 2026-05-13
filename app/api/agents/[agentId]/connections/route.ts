import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenantAgent } from '@/lib/tenant';
import { z } from 'zod';

type RouteContext = { params: Promise<{ agentId: string }> };

const connectionSchema = z.object({
  toAgentId: z.string().min(1),
  trigger: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  priority: z.number().int().min(0).max(100).optional().default(0),
});

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  const connections = await prisma.agentConnection.findMany({
    where: { fromAgentId: agentId },
    include: {
      toAgent: {
        select: { id: true, name: true, typeId: true, avatarColor: true, widgetColor: true },
      },
    },
    orderBy: { priority: 'asc' },
  });

  return NextResponse.json(connections);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  const existingCount = await prisma.agentConnection.count({ where: { fromAgentId: agentId } });
  if (existingCount >= 5) {
    return NextResponse.json({ error: 'Maximum of 5 outbound connections reached' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = connectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { toAgentId, trigger, label, priority } = parsed.data;

  if (toAgentId === agentId) {
    return NextResponse.json({ error: 'An agent cannot connect to itself' }, { status: 400 });
  }

  const { error: targetError } = await requireTenantAgent(toAgentId, session!.user.tenantId);
  if (targetError) return NextResponse.json({ error: 'Target agent not found' }, { status: 404 });

  try {
    const connection = await prisma.agentConnection.create({
      data: { fromAgentId: agentId, toAgentId, trigger, label, priority },
      include: {
        toAgent: {
          select: { id: true, name: true, typeId: true, avatarColor: true, widgetColor: true },
        },
      },
    });
    return NextResponse.json(connection, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Connection already exists between these agents' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  const body = await req.json();
  const connectionId = typeof body?.connectionId === 'string' ? body.connectionId : null;
  if (!connectionId) {
    return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
  }

  const connection = await prisma.agentConnection.findFirst({
    where: { id: connectionId, fromAgentId: agentId },
  });
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  await prisma.agentConnection.delete({ where: { id: connectionId } });
  return NextResponse.json({ ok: true });
}
