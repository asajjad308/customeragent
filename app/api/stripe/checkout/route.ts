import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, STRIPE_PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { z } from 'zod';

const schema = z.object({ plan: z.enum(['pro', 'enterprise']) });

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const { plan } = parsed.data;
  const tenantId = session!.user.tenantId;
  const userEmail = session!.user.email;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { stripeCustomerId: true, name: true },
  });

  // Create or reuse Stripe customer
  const stripe = getStripeClient();
  let customerId = tenant?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: tenant?.name,
      metadata: { tenantId },
    });
    customerId = customer.id;
    await prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: STRIPE_PLANS[plan].priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?tab=billing&success=1`,
    cancel_url: `${appUrl}/settings?tab=billing`,
    metadata: { tenantId, plan },
    subscription_data: { metadata: { tenantId, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
