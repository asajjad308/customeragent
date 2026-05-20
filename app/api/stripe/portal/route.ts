import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';

export async function POST() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.tenantId },
    select: { stripeCustomerId: true },
  });

  if (!tenant?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${appUrl}/settings?tab=billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
