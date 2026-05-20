import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const month = new Date().toISOString().slice(0, 7);

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, plan: true,
      subscriptionStatus: true, suspended: true, createdAt: true,
      _count: { select: { agents: true, users: true } },
    },
  });

  // Attach this month's message usage
  const usageRecords = await prisma.usageRecord.groupBy({
    by: ['tenantId'],
    where: { month },
    _sum: { messages: true },
  });

  const usageMap = Object.fromEntries(usageRecords.map((r) => [r.tenantId, r._sum.messages ?? 0]));

  return NextResponse.json(
    tenants.map((t) => ({ ...t, messagesThisMonth: usageMap[t.id] ?? 0 }))
  );
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { tenantId, plan, suspended } = await req.json();
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (plan !== undefined) data.plan = plan;
  if (suspended !== undefined) data.suspended = suspended;

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data,
    select: { id: true, plan: true, suspended: true },
  });

  return NextResponse.json(updated);
}
