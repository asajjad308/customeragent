import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — no auth required. Returns only safe display fields.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await ctx.params;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      greeting: true,
      avatarColor: true,
      widgetColor: true,
      widgetTheme: true,
      widgetPosition: true,
      quickReplies: true,
      status: true,
    },
  });

  if (!agent || agent.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const res = NextResponse.json(agent);
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Cache-Control', 'public, s-maxage=60');
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
