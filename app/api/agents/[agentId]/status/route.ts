import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenantAgent } from '@/lib/tenant';
import { z } from 'zod';

type RouteContext = { params: Promise<{ agentId: string }> };

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED']),
});

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(agent);
}
