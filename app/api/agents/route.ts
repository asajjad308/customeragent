import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  typeId: z.enum(['SUPPORT', 'TECHNICAL', 'SALES', 'LEAD_GEN', 'ONBOARDING', 'HR', 'BOOKING', 'CUSTOM']).optional(),
  systemPrompt: z.string().min(1),
  greeting: z.string().min(1),
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
});

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const agents = await prisma.agent.findMany({
    where: { tenantId: session!.user.tenantId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { tenantId, plan } = session!.user;
  const limits = getPlanLimits(plan);

  const agentCount = await prisma.agent.count({ where: { tenantId } });
  if (agentCount >= limits.maxAgents) {
    return NextResponse.json(
      { error: `Plan limit reached. Upgrade to create more agents.` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.agent.findFirst({
    where: { tenantId, slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
  }

  const agent = await prisma.agent.create({
    data: { tenantId, ...parsed.data },
  });

  return NextResponse.json(agent, { status: 201 });
}
