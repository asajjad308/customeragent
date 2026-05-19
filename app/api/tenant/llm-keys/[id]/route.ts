import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';

async function ownedKey(id: string, tenantId: string) {
  return prisma.llmApiKey.findFirst({ where: { id, tenantId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const tenantId = session!.user.tenantId;
  const key = await ownedKey(id, tenantId);
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.llmApiKey.update({
    where: { id },
    data: { isActive: typeof body.isActive === 'boolean' ? body.isActive : key.isActive },
    select: { id: true, provider: true, label: true, isActive: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const tenantId = session!.user.tenantId;
  const key = await ownedKey(id, tenantId);
  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.llmApiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
