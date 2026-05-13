import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const integration = await prisma.integration.findUnique({
    where: {
      tenantId_type: { tenantId: session!.user.tenantId, type: 'google_calendar' },
    },
    select: { isActive: true, createdAt: true },
  });

  return NextResponse.json({
    connected: !!(integration?.isActive),
    connectedAt: integration?.createdAt ?? null,
  });
}

export async function DELETE() {
  const { error, session } = await requireAuth();
  if (error) return error;

  await prisma.integration.updateMany({
    where: { tenantId: session!.user.tenantId, type: 'google_calendar' },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
