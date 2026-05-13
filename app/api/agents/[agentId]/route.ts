import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenantAgent } from '@/lib/tenant';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  typeId: z.enum(['SUPPORT', 'TECHNICAL', 'SALES', 'LEAD_GEN', 'ONBOARDING', 'HR', 'BOOKING', 'CUSTOM']).optional(),
  systemPrompt: z.string().min(1).optional(),
  greeting: z.string().min(1).optional(),
  businessContext: z.string().optional(),
  tone: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  widgetTheme: z.enum(['GLASSMORPHISM_DARK', 'NEO_BRUTALISM', 'SOFT_AURORA']).optional(),
  quickReplies: z.array(z.string()).optional(),
  avatarColor: z.string().optional(),
  widgetColor: z.string().optional(),
  widgetPosition: z.string().optional(),
  isActive: z.boolean().optional(),
  allowedDomains: z.string().optional(),
  maxMsgPerHour: z.number().int().positive().optional(),
  blockedWords: z.string().optional(),
});

type RouteContext = { params: Promise<{ agentId: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      connectionsFrom: {
        include: {
          toAgent: { select: { id: true, name: true, typeId: true, avatarColor: true, widgetColor: true } },
        },
        orderBy: { priority: 'asc' },
      },
      connectionsTo: {
        include: {
          fromAgent: { select: { id: true, name: true, typeId: true, avatarColor: true, widgetColor: true } },
        },
        orderBy: { priority: 'asc' },
      },
    },
  });

  return NextResponse.json(agent);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: parsed.data,
  });

  return NextResponse.json(agent);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: agentError } = await requireTenantAgent(agentId, session!.user.tenantId);
  if (agentError) return agentError;

  await prisma.agent.delete({ where: { id: agentId } });

  return NextResponse.json({ ok: true });
}
