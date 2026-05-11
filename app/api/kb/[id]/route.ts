import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  agentId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const tenantId = session!.user.tenantId;
  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

  await prisma.knowledgeBase.updateMany({ where: { id, tenantId }, data: parsed.data });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const tenantId = session!.user.tenantId;
  const { id } = await params;

  await prisma.knowledgeBase.deleteMany({ where: { id, tenantId } });

  return NextResponse.json({ ok: true });
}
