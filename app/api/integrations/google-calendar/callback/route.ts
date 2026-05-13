import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCode } from '@/lib/google-calendar';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get('code');
  const tenantId = searchParams.get('state');
  const errParam = searchParams.get('error');

  if (errParam || !code || !tenantId) {
    return NextResponse.redirect(
      new URL('/dashboard?gcal=denied', req.url)
    );
  }

  try {
    const tokens = await exchangeCode(code);

    await prisma.integration.upsert({
      where: { tenantId_type: { tenantId, type: 'google_calendar' } },
      create: {
        tenantId,
        type: 'google_calendar',
        config: JSON.stringify(tokens),
        isActive: true,
      },
      update: {
        config: JSON.stringify(tokens),
        isActive: true,
      },
    });

    return NextResponse.redirect(
      new URL('/dashboard?gcal=connected', req.url)
    );
  } catch (err) {
    console.error('Google Calendar OAuth error:', err);
    return NextResponse.redirect(
      new URL('/dashboard?gcal=error', req.url)
    );
  }
}
