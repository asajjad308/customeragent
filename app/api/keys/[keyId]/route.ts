import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';

type RouteContext = { params: Promise<{ keyId: string }> };

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { keyId } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;

  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, tenantId: session!.user.tenantId },
  });
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.apiKey.delete({ where: { id: keyId } });

  return NextResponse.json({ ok: true });
}
