import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';
import { z } from 'zod';
import crypto from 'crypto';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  agentId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const keys = await prisma.apiKey.findMany({
    where: { tenantId: session!.user.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keys.map((k) => ({ ...k, key: `${k.key.slice(0, 8)}...` })));
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { tenantId, plan } = session!.user;
  const limits = getPlanLimits(plan);

  const count = await prisma.apiKey.count({ where: { tenantId } });
  if (count >= limits.maxApiKeys) {
    return NextResponse.json({ error: 'API key limit reached. Upgrade your plan.' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const key = `sai_${crypto.randomBytes(24).toString('hex')}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name: parsed.data.name,
      agentId: parsed.data.agentId,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      key,
    },
  });

  return NextResponse.json({ ...apiKey, key }, { status: 201 });
}
