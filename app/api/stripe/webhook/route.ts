import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, planFromPriceId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendUsageWarningEmail } from '@/lib/email';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

async function syncSubscription(sub: Stripe.Subscription) {
  const tenantId = sub.metadata?.tenantId;
  console.log('[webhook] syncSubscription tenantId:', tenantId, 'status:', sub.status);
  if (!tenantId) return;

  const priceId = sub.items.data[0]?.price.id ?? '';
  const plan = sub.status === 'active' || sub.status === 'trialing'
    ? planFromPriceId(priceId)
    : 'free';
  console.log('[webhook] priceId:', priceId, '→ plan:', plan);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
    },
  });
  console.log('[webhook] tenant updated to plan:', plan);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: customerId },
          select: { email: true, name: true },
        });
        if (tenant) {
          await sendUsageWarningEmail(tenant.email, tenant.name, 100, 'Payment failed — please update your billing details to keep your subscription active.');
        }
      }
      break;
    }

    case 'checkout.session.completed': {
      const cs = event.data.object as Stripe.Checkout.Session;
      const tenantId = cs.metadata?.tenantId;
      const plan = cs.metadata?.plan;
      console.log('[webhook] checkout.session.completed tenantId:', tenantId, 'plan:', plan, 'customer:', cs.customer);
      if (tenantId && cs.customer) {
        const updateData: Record<string, string> = { stripeCustomerId: cs.customer as string };
        if (plan && (plan === 'pro' || plan === 'enterprise')) {
          updateData.plan = plan;
          updateData.subscriptionStatus = 'active';
        }
        await prisma.tenant.update({
          where: { id: tenantId },
          data: updateData,
        });
        console.log('[webhook] tenant updated from checkout:', updateData);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
