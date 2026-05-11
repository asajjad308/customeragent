import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  keywords: z.string().optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ entryId: string }> };

async function getEntry(entryId: string, tenantId: string) {
  const entry = await prisma.knowledgeBase.findFirst({
    where: { id: entryId, tenantId },
  });
  if (!entry) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }), entry: null };
  }
  return { error: null, entry };
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { entryId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: entryError } = await getEntry(entryId, session!.user.tenantId);
  if (entryError) return entryError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.knowledgeBase.update({
    where: { id: entryId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { entryId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const { error: entryError } = await getEntry(entryId, session!.user.tenantId);
  if (entryError) return entryError;

  await prisma.knowledgeBase.delete({ where: { id: entryId } });

  return NextResponse.json({ ok: true });
}
