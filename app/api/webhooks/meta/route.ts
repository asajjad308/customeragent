import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { groq } from '@/lib/groq';
import { resolveModel } from '@/lib/llm-client';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';
import {
  sendFacebookMessage,
  sendInstagramMessage,
  sendWhatsAppMessage,
} from '@/lib/platform-senders';

// ── GET — webhook verification ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode        = searchParams.get('hub.mode');
  const verifyToken = searchParams.get('hub.verify_token');
  const challenge   = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !verifyToken || !challenge) {
    return new Response('Bad request', { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = await (prisma as any).platformConnection.findFirst({
    where: { webhookVerifyToken: verifyToken },
  });

  if (!conn) return new Response('Verify token not found', { status: 403 });
  return new Response(challenge, { status: 200 });
}

// ── POST — receive messages ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  const isWA    = body.object === 'whatsapp_business_account';
  const isMeta  = body.object === 'page' || body.object === 'instagram';
  if (!isWA && !isMeta) return new Response('Unknown object', { status: 400 });

  for (const entry of (body.entry as unknown[]) ?? []) {
    const e = entry as Record<string, unknown>;

    if (isWA) {
      for (const change of (e.changes as unknown[]) ?? []) {
        const c = change as Record<string, unknown>;
        const value = c.value as Record<string, unknown> | undefined;
        const meta  = value?.metadata as Record<string, string> | undefined;
        const phoneNumberId = meta?.phone_number_id;
        if (!phoneNumberId) continue;

        for (const msg of (value?.messages as unknown[]) ?? []) {
          const m = msg as Record<string, unknown>;
          if (m.type !== 'text') continue;
          const senderId = m.from as string;
          const text = (m.text as Record<string, string>)?.body ?? '';
          if (!text) continue;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const conn = await (prisma as any).platformConnection.findFirst({
            where: { pageId: phoneNumberId, platform: 'WHATSAPP' },
            include: { agent: { select: { id: true, tenantId: true } } },
          });
          if (!conn?.agent || !conn.accessToken) continue;

          const reply = await getAiReply(conn.agent.id, conn.agent.tenantId, senderId, text, 'WHATSAPP');
          await sendWhatsAppMessage(conn.accessToken, phoneNumberId, senderId, reply);
        }
      }
    } else {
      for (const messaging of (e.messaging as unknown[]) ?? []) {
        const m = messaging as Record<string, unknown>;
        const senderId    = (m.sender as Record<string, string>)?.id;
        const recipientId = (m.recipient as Record<string, string>)?.id;
        const msgObj      = m.message as Record<string, unknown> | undefined;
        const text        = msgObj?.text as string ?? '';
        if (!senderId || !text || msgObj?.is_echo) continue;

        const platform = body.object === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conn = await (prisma as any).platformConnection.findFirst({
          where: { pageId: recipientId, platform },
          include: { agent: { select: { id: true, tenantId: true } } },
        });
        if (!conn?.agent || !conn.accessToken) continue;

        const reply = await getAiReply(conn.agent.id, conn.agent.tenantId, senderId, text, platform);
        if (platform === 'INSTAGRAM') {
          await sendInstagramMessage(conn.accessToken, senderId, reply);
        } else {
          await sendFacebookMessage(conn.accessToken, senderId, reply);
        }
      }
    }
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
}

// ── LLM reply helper ──────────────────────────────────────────────────────────
async function getAiReply(
  agentId: string,
  tenantId: string,
  senderId: string,
  userText: string,
  platform: string,
): Promise<string> {
  const sessionId = `${platform}:${agentId}:${senderId}`;

  // Find or create conversation
  let conversation = await prisma.conversation.findUnique({ where: { sessionId } });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        tenantId,
        agentId,
        sessionId,
        visitorId: senderId,
        channel: platform.toLowerCase(),
        status: 'active',
      },
    });
  }

  // Load recent history for context
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  history.reverse();

  // Build system prompt
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  const systemPrompt = await buildSystemPrompt(agentId, tenant?.name ?? 'Company');

  // Call LLM (non-streaming for webhooks)
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  const completion = await groq.chat.completions.create({
    model: resolveModel(agent?.model),
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: userText },
    ],
    temperature: agent?.temperature ?? 0.7,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    max_tokens: (agent as any)?.maxTokens ?? 512,
    stream: false,
  });

  const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't process that.";

  // Persist messages
  const startTime = Date.now();
  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, role: 'user', content: userText },
      { conversationId: conversation.id, role: 'assistant', content: reply, responseTimeMs: Date.now() - startTime },
    ],
  });

  // Update usage
  const month = new Date().toISOString().slice(0, 7);
  await prisma.usageRecord.upsert({
    where: { tenantId_agentId_month: { tenantId, agentId, month } },
    create: { tenantId, agentId, month, messages: 1 },
    update: { messages: { increment: 1 } },
  });

  return reply;
}
