import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: botId, isActive: true },
    select: {
      id: true,
      name: true,
      greeting: true,
      systemPrompt: true,
      businessContext: true,
      tone: true,
      model: true,
      temperature: true,
      widgetColor: true,
      widgetPosition: true,
      avatarColor: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  return NextResponse.json({
    botId: agent.id,
    name: agent.name,
    greeting: agent.greeting,
    systemPrompt: agent.businessContext
      ? `${agent.systemPrompt}\n\nBusiness context: ${agent.businessContext}`
      : agent.systemPrompt,
    tone: agent.tone,
    model: agent.model,
    temperature: agent.temperature,
    color: agent.widgetColor,
    avatarColor: agent.avatarColor,
    position: agent.widgetPosition,
  });
}
