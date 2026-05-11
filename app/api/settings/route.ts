import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { z } from 'zod';

const schema = z.object({
  companyName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.string().optional(),
  bubbleStyle: z.string().optional(),
  fontSize: z.string().optional(),
  showBranding: z.boolean().optional(),
});

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: session!.user.tenantId },
  });

  return NextResponse.json(settings ?? {});
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: session!.user.tenantId },
    create: { tenantId: session!.user.tenantId, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json(settings);
}
