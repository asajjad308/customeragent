import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function getTenantId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.tenantId ?? null;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireTenantAgent(agentId: string, tenantId: string) {
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, tenantId },
  });
  if (!agent) {
    return { error: NextResponse.json({ error: 'Agent not found' }, { status: 404 }), agent: null };
  }
  return { error: null, agent };
}

export async function requireTenantConversation(conversationId: string, tenantId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, tenantId },
  });
  if (!conversation) {
    return { error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }), conversation: null };
  }
  return { error: null, conversation };
}

export async function getTenantPlan(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  return tenant?.plan ?? 'free';
}
