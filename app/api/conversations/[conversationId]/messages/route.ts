import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenantConversation } from '@/lib/tenant';

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { conversationId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: convError } = await requireTenantConversation(conversationId, session!.user.tenantId);
  if (convError) return convError;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}
