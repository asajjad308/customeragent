import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/tenant';
import { getAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const url = getAuthUrl(session!.user.tenantId);
  return NextResponse.redirect(url);
}
