import { NextResponse } from 'next/server';
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

  const [tenants, totalUsers, totalAgents, totalConversations, usageRecords] = await Promise.all([
    prisma.tenant.findMany({
      select: { id: true, plan: true, suspended: true },
    }),
    prisma.user.count(),
    prisma.agent.count(),
    prisma.conversation.count(),
    prisma.usageRecord.aggregate({
      where: { month },
      _sum: { messages: true },
    }),
  ]);

  const totalTenants = tenants.length;
  const paidTenants = tenants.filter((t) => t.plan !== 'free').length;
  const freeTenants = tenants.filter((t) => t.plan === 'free').length;
  const suspendedTenants = tenants.filter((t) => t.suspended).length;
  const totalMessagesThisMonth = usageRecords._sum.messages ?? 0;

  const proTenants = tenants.filter((t) => t.plan === 'pro').length;
  const enterpriseTenants = tenants.filter((t) => t.plan === 'enterprise').length;
  const revenueEstimate = proTenants * 49 + enterpriseTenants * 149;

  return NextResponse.json({
    totalTenants,
    paidTenants,
    freeTenants,
    suspendedTenants,
    totalUsers,
    totalAgents,
    totalMessagesThisMonth,
    totalConversations,
    revenueEstimate,
  });
}
