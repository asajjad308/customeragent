import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.tenantId },
    select: { plan: true, subscriptionStatus: true, stripeCustomerId: true },
  });

  return NextResponse.json(tenant ?? { plan: 'free', subscriptionStatus: null, stripeCustomerId: null });
}
