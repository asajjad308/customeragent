import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenantConversation } from '@/lib/tenant';

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: convError, conversation } = await requireTenantConversation(conversationId, session!.user.tenantId);
  if (convError) return convError;

  const full = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      feedback: true,
    },
  });

  return NextResponse.json(full);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: convError } = await requireTenantConversation(conversationId, session!.user.tenantId);
  if (convError) return convError;

  const { status } = await req.json();

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status,
      ...(status === 'ended' ? { endedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: convError } = await requireTenantConversation(conversationId, session!.user.tenantId);
  if (convError) return convError;

  await prisma.conversation.delete({ where: { id: conversationId } });

  return NextResponse.json({ ok: true });
}
