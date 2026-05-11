import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { tenantId, plan } = session!.user;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);

  const records = await prisma.usageRecord.findMany({
    where: { tenantId, month },
  });

  const totalMessages = records.reduce((sum: number, r) => sum + r.messages, 0);
  const totalTokens = records.reduce((sum: number, r) => sum + r.tokens, 0);
  const limits = getPlanLimits(plan);

  return NextResponse.json({
    month,
    totalMessages,
    totalTokens,
    limits: {
      maxMessagesPerMonth: limits.maxMessagesPerMonth,
    },
    usagePercent:
      limits.maxMessagesPerMonth === Infinity
        ? 0
        : Math.round((totalMessages / limits.maxMessagesPerMonth) * 100),
    records,
  });
}
