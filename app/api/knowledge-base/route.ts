import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';
import { z } from 'zod';

const createSchema = z.object({
  agentId: z.string().optional(),
  type: z.enum(['faq', 'document', 'policy', 'custom']),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  keywords: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');

  const entries = await prisma.knowledgeBase.findMany({
    where: {
      tenantId: session!.user.tenantId,
      ...(agentId ? { agentId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { tenantId, plan } = session!.user;
  const limits = getPlanLimits(plan);

  const count = await prisma.knowledgeBase.count({ where: { tenantId } });
  if (count >= limits.maxKnowledgeBaseEntries) {
    return NextResponse.json({ error: 'Knowledge base limit reached. Upgrade your plan.' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const entry = await prisma.knowledgeBase.create({
    data: { tenantId, ...parsed.data },
  });

  return NextResponse.json(entry, { status: 201 });
}
