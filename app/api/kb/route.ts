import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  type: z.enum(['qa', 'file']),
  title: z.string().min(1),
  content: z.string().min(1),
  agentId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const tenantId = session!.user.tenantId;

  const agentId = req.nextUrl.searchParams.get('agentId');

  const entries = await prisma.knowledgeBase.findMany({
    where: { tenantId, ...(agentId ? { agentId } : {}) },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const tenantId = session!.user.tenantId;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  const entry = await prisma.knowledgeBase.create({
    data: {
      tenantId,
      agentId: parsed.data.agentId ?? null,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
