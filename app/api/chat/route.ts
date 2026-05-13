import { NextRequest } from 'next/server';
import { groq } from '@/lib/groq';
import { prisma } from '@/lib/prisma';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';

// Matches {"handoff": "trigger", "reason": "..."}
const HANDOFF_RE = /\{"handoff"\s*:\s*"([^"]+)"[^}]*?"reason"\s*:\s*"([^"]*)"\}/;

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // New format: { agentId, message, history? }
    // Old format: { messages, systemPrompt, model, temperature, conversationId, agentId, tenantId }
    const isNewFormat = 'agentId' in body && 'message' in body && !('messages' in body);

    let systemPrompt: string;
    let chatMessages: { role: string; content: string }[];
    let model: string;
    let temperature: number;
    let maxTokens: number;
    let agentId: string | null = null;
    let conversationId: string | null = null;
    let tenantId: string | null = null;

    if (isNewFormat) {
      agentId = body.agentId as string;

      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      tenantId = agent.tenantId;
      conversationId = (body.conversationId as string | undefined) ?? null;

      const tenant = await prisma.tenant.findUnique({
        where: { id: agent.tenantId },
        select: { name: true },
      });

      systemPrompt = await buildSystemPrompt(agentId, tenant?.name ?? 'Company');

      const history: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : [];
      chatMessages = [...history, { role: 'user', content: String(body.message) }];
      model = agent.model ?? 'llama-3.3-70b-versatile';
      temperature = agent.temperature ?? 0.7;
      maxTokens = agent.maxTokens ?? 512;
    } else {
      // Legacy format — keep identical behaviour
      systemPrompt = body.systemPrompt as string;
      chatMessages = body.messages as { role: string; content: string }[];
      model = (body.model as string | undefined) ?? 'llama-3.3-70b-versatile';
      temperature = (body.temperature as number | undefined) ?? 0.7;
      maxTokens = 1024;
      agentId = (body.agentId as string | undefined) ?? null;
      conversationId = (body.conversationId as string | undefined) ?? null;
      tenantId = (body.tenantId as string | undefined) ?? null;
    }

    const startTime = Date.now();

    const stream = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatMessages.map(({ role, content }) => ({
          role: role as 'user' | 'assistant' | 'system',
          content,
        })),
      ],
      stream: true,
      temperature,
      max_tokens: maxTokens,
    });

    const encoder = new TextEncoder();
    let fullContent = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? '';
            if (content) {
              fullContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // Handoff detection — only for new format requests
          if (isNewFormat && agentId) {
            const match = HANDOFF_RE.exec(fullContent);
            if (match) {
              const trigger = match[1];
              const reason = match[2];

              const connection = await prisma.agentConnection.findFirst({
                where: { fromAgentId: agentId, trigger },
                include: { toAgent: { select: { id: true, name: true } } },
              });

              if (connection) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'handoff',
                      toAgentId: connection.toAgentId,
                      toAgentName: connection.toAgent.name,
                      reason,
                      trigger,
                    })}\n\n`
                  )
                );
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // Persist to DB only when we have a real conversation
          if (conversationId && tenantId) {
            const safeTenantId: string = tenantId;
            const responseTimeMs = Date.now() - startTime;
            const lastUserMsg = chatMessages[chatMessages.length - 1];
            try {
              await prisma.message.createMany({
                data: [
                  { conversationId, role: 'user', content: lastUserMsg?.content ?? '' },
                  { conversationId, role: 'assistant', content: fullContent, responseTimeMs },
                ],
              });

              const month = new Date().toISOString().slice(0, 7);
              // Prisma compound-unique where requires string (not null) for agentId;
              // use a raw cast to preserve original nullable semantics.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const agentIdForUsage = (agentId ?? null) as any;
              await prisma.usageRecord.upsert({
                where: { tenantId_agentId_month: { tenantId: safeTenantId, agentId: agentIdForUsage, month } },
                create: { tenantId: safeTenantId, agentId: agentIdForUsage, month, messages: 1 },
                update: { messages: { increment: 1 } },
              });

              if (agentId) {
                await prisma.agent.update({
                  where: { id: agentId },
                  data: { lastActiveAt: new Date(), messageCount: { increment: 1 } },
                });
              }
            } catch (dbErr) {
              console.error('DB persist error:', dbErr);
            }
          }
        } catch (streamError) {
          console.error('Groq stream error:', streamError);
          controller.error(streamError);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calling Groq API:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
