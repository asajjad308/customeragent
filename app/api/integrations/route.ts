import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { z } from 'zod';

const schema = z.object({
  type: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const integrations = await prisma.integration.findMany({
    where: { tenantId: session!.user.tenantId },
  });

  return NextResponse.json(
    integrations.map((i: (typeof integrations)[number]) => ({
      ...i,
      config: JSON.parse(i.config),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { type, config, isActive } = parsed.data;

  const integration = await prisma.integration.upsert({
    where: { tenantId_type: { tenantId: session!.user.tenantId, type } },
    create: {
      tenantId: session!.user.tenantId,
      type,
      config: JSON.stringify(config),
      isActive: isActive ?? true,
    },
    update: {
      config: JSON.stringify(config),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json({ ...integration, config: JSON.parse(integration.config) });
}
