import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';

type Ctx = { params: Promise<{ agentId: string }> };

async function getAgent(agentId: string, tenantId: string) {
  return prisma.agent.findFirst({ where: { id: agentId, tenantId } });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const { agentId } = await ctx.params;

  const agent = await getAgent(agentId, session!.user.tenantId);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = await (prisma as any).platformConnection.findUnique({ where: { agentId } });
  return NextResponse.json(conn ?? null);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const { agentId } = await ctx.params;

  const agent = await getAgent(agentId, session!.user.tenantId);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { platform, pageId, pageName, accessToken } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pc = prisma as any;
  const existing = await pc.platformConnection.findUnique({ where: { agentId } });

  const conn = existing
    ? await pc.platformConnection.update({
        where: { agentId },
        data: {
          platform:    platform    ?? existing.platform,
          pageId:      pageId      ?? existing.pageId,
          pageName:    pageName    ?? existing.pageName,
          accessToken: accessToken ?? existing.accessToken,
          connectedAt: new Date(),
        },
      })
    : await pc.platformConnection.create({
        data: {
          agentId,
          platform: platform ?? 'FACEBOOK',
          pageId:      pageId      ?? null,
          pageName:    pageName    ?? null,
          accessToken: accessToken ?? null,
          connectedAt: new Date(),
        },
      });

  // Keep Agent.platform in sync
  await prisma.agent.update({
    where: { id: agentId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { platform: conn.platform } as any,
  });

  return NextResponse.json(conn);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const { agentId } = await ctx.params;

  const agent = await getAgent(agentId, session!.user.tenantId);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).platformConnection.deleteMany({ where: { agentId } });

  // Reset agent platform to WEBSITE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.agent as any).update({ where: { id: agentId }, data: { platform: 'WEBSITE' } });

  return NextResponse.json({ success: true });
}
