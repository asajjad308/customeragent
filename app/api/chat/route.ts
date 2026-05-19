import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLlmClient } from '@/lib/llm-client';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';
import {
  getAvailableSlots,
  createEvent,
  resolveDateStr,
  type GoogleTokens,
} from '@/lib/google-calendar';

// ── Regex detectors ────────────────────────────────────────────────────────────
const HANDOFF_RE = /\{"handoff"\s*:\s*"([^"]+)"[^}]*?"reason"\s*:\s*"([^"]*)"\}/;
const BOOKING_RE = /\{[^{}]*"booking_action"\s*:\s*"([^"]+)"[^{}]*\}/;

// ── Google Calendar token lookup ───────────────────────────────────────────────
async function getGoogleTokens(tenantId: string): Promise<GoogleTokens | null> {
  const integration = await prisma.integration.findUnique({
    where: { tenantId_type: { tenantId, type: 'google_calendar' } },
    select: { config: true, isActive: true },
  });
  if (!integration?.isActive) return null;
  try { return JSON.parse(integration.config) as GoogleTokens; } catch { return null; }
}

// ── Booking-aware system prompt ────────────────────────────────────────────────
function buildBookingSystemPrompt(base: string, hasCalendar: boolean): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!hasCalendar) return base;
  return `=== CALENDAR BOOKING SYSTEM (Google Calendar connected) ===
Today's date: ${today}

CRITICAL OVERRIDE: Google Calendar is directly connected. You MUST use the JSON actions below to check real availability and create real calendar events. Do NOT share any booking URL or calendar link — that workflow is disabled when the calendar integration is active.

BOOKING FLOW — follow this exactly, step by step:

STEP 1 — Ask what type of meeting they need (appointment, demo, consultation, etc.).

STEP 2 — Ask for their preferred date (e.g. "tomorrow", "next Monday", "May 20").

STEP 3 — Check availability. Emit EXACTLY this JSON on its own line (nothing else on that line):
{"booking_action":"check_availability","date":"<YYYY-MM-DD or natural phrase>","duration":60}
The system will display available slots to the user automatically. Do NOT list slots yourself.

STEP 4 — The user will send a combined booking message containing all required info. It will look like:
"Book my appointment - Slot: <label> (start: <ISO>, end: <ISO>), Name: <name>, Email: <email>"
Extract the slot ISO times, name, and email from this message, then emit EXACTLY this JSON on its own line:
{"booking_action":"create_event","slot_start":"<start ISO>","slot_end":"<end ISO>","guest_name":"<name>","guest_email":"<email>","summary":"<brief meeting title>"}

STEP 5 — The system confirms the booking. Tell the user it is confirmed and summarise the details.

RULES:
- NEVER share a booking URL or calendar link.
- NEVER re-check availability after the user has picked a slot.
- NEVER invent slot times — only use ISO times provided in the user's message.
- NEVER ask for name or email in chat — the UI collects them automatically.
- Emit JSON blocks ONLY when triggering an action, not in normal conversation.
- If no slots are available, ask the user to try a different date.
=== END CALENDAR BOOKING SYSTEM ===

${base}`;
}

// ── Booking action handler (runs after stream completes) ───────────────────────
async function handleBookingAction(
  rawJson: string,
  tokens: GoogleTokens,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  timezone: string,
): Promise<void> {
  let parsed: Record<string, string>;
  try { parsed = JSON.parse(rawJson); } catch { return; }

  const action = parsed.booking_action;

  if (action === 'check_availability') {
    try {
      const dateStr = resolveDateStr(parsed.date ?? 'tomorrow');
      const duration = parseInt(parsed.duration ?? '60', 10) || 60;
      const slots = await getAvailableSlots(tokens, dateStr, duration, timezone);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'booking_slots', date: dateStr, slots })}\n\n`
        )
      );
    } catch (err) {
      console.error('[Calendar] check_availability error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'booking_error', message: `Could not fetch availability: ${msg}` })}\n\n`
        )
      );
    }
    return;
  }

  if (action === 'create_event') {
    const email = (parsed.guest_email ?? '').trim();
    const name  = (parsed.guest_name  ?? '').trim();
    const PLACEHOLDER_RE = /^(your\s+email|name|guest|user|example|test|placeholder|your\s+name)$/i;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!validEmail || PLACEHOLDER_RE.test(email) || PLACEHOLDER_RE.test(name) || !name) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'booking_error',
            message: !validEmail
              ? 'Please ask the user for their real name and email address before booking.'
              : 'Missing guest name. Please collect the user\'s name before booking.',
          })}\n\n`
        )
      );
      return;
    }

    try {
      const event = await createEvent(tokens, {
        summary:    parsed.summary      ?? 'Meeting',
        guestName:  name,
        guestEmail: email,
        startIso:    parsed.slot_start,
        endIso:      parsed.slot_end,
        timezone,
        description: `Booked via SupportAI`,
      });

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'booking_confirmed', event })}\n\n`
        )
      );
    } catch (err) {
      console.error('[Calendar] create_event error:', err);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'booking_error', message: 'Failed to create event. Please try again.' })}\n\n`
        )
      );
    }
    return;
  }
}

// ── Main POST handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const isNewFormat = 'agentId' in body && 'message' in body && !('messages' in body);

    let systemPrompt: string;
    let chatMessages: { role: string; content: string }[];
    let model: string;
    let temperature: number;
    let maxTokens: number;
    let agentId: string | null = null;
    let conversationId: string | null = null;
    let tenantId: string | null = null;
    let isBookingAgent = false;
    let googleTokens: GoogleTokens | null = null;
    const timezone: string = (body.timezone as string | undefined) || 'UTC';

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

      // Check if this is a booking agent with Google Calendar connected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isBookingAgent = (agent as any).typeId === 'BOOKING';
      if (isBookingAgent) {
        googleTokens = await getGoogleTokens(agent.tenantId);
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: agent.tenantId },
        select: { name: true },
      });

      const basePrompt = await buildSystemPrompt(agentId, tenant?.name ?? 'Company');
      systemPrompt = isBookingAgent
        ? buildBookingSystemPrompt(basePrompt, googleTokens !== null)
        : basePrompt;

      const history: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : [];
      chatMessages = [...history, { role: 'user', content: String(body.message) }];
      model = agent.model ?? 'llama-3.3-70b-versatile';
      temperature = agent.temperature ?? 0.7;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maxTokens = (agent as any).maxTokens ?? 512;
    } else {
      systemPrompt = body.systemPrompt as string;
      chatMessages = body.messages as { role: string; content: string }[];
      model = (body.model as string | undefined) ?? 'llama-3.3-70b-versatile';
      temperature = (body.temperature as number | undefined) ?? 0.7;
      maxTokens = 1024;
      agentId = (body.agentId as string | undefined) ?? null;
      conversationId = (body.conversationId as string | undefined) ?? null;
      tenantId = (body.tenantId as string | undefined) ?? null;
    }

    const llm = await getLlmClient(tenantId, model);

    if (!llm.apiKey) {
      return new Response(
        JSON.stringify({ error: `No API key configured for provider "${llm.provider}". Add one in Settings → AI Providers.` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const startTime = Date.now();

    // ── Anthropic streaming ──────────────────────────────────────────────────
    if (llm.provider === 'anthropic') {
      const anthropicMessages = chatMessages.map(({ role, content }) => ({
        role: role as 'user' | 'assistant',
        content,
      }));

      const stream = await llm.client.messages.stream({
        model,
        system: systemPrompt,
        messages: anthropicMessages,
        temperature,
        max_tokens: maxTokens,
      });

      const encoder = new TextEncoder();
      let fullContent = '';

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (
                chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta'
              ) {
                const content = chunk.delta.text;
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const agentIdForUsage = (agentId ?? null) as any;
                await prisma.usageRecord.upsert({
                  where: { tenantId_agentId_month: { tenantId: safeTenantId, agentId: agentIdForUsage, month } },
                  create: { tenantId: safeTenantId, agentId: agentIdForUsage, month, messages: 1 },
                  update: { messages: { increment: 1 } },
                });
                if (agentId) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await (prisma.agent as any).update({
                    where: { id: agentId },
                    data: { lastActiveAt: new Date(), messageCount: { increment: 1 } },
                  });
                }
              } catch (dbErr) {
                console.error('DB persist error:', dbErr);
              }
            }
          } catch (streamError) {
            console.error('Anthropic stream error:', streamError);
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
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ── OpenAI-compatible streaming (Groq / OpenAI) ──────────────────────────
    const stream = await llm.client.chat.completions.create({
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

          // ── Handoff detection ────────────────────────────────────────────
          if (isNewFormat && agentId) {
            const match = HANDOFF_RE.exec(fullContent);
            if (match) {
              const trigger = match[1];
              const reason  = match[2];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const connection = await (prisma as any).agentConnection.findFirst({
                where: { fromAgentId: agentId, trigger },
                include: { toAgent: { select: { id: true, name: true } } },
              });
              if (connection) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'handoff',
                      toAgentId:   connection.toAgentId,
                      toAgentName: connection.toAgent.name,
                      reason,
                      trigger,
                    })}\n\n`
                  )
                );
              }
            }
          }

          // ── Booking action detection ──────────────────────────────────────
          if (isNewFormat && isBookingAgent && googleTokens) {
            const bookingMatch = BOOKING_RE.exec(fullContent);
            if (bookingMatch) {
              // Strip the raw JSON from the displayed assistant message
              const cleanContent = fullContent.replace(bookingMatch[0], '').trim();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'replace_content',
                  content: cleanContent || 'Let me check that for you…',
                })}\n\n`)
              );
              await handleBookingAction(bookingMatch[0], googleTokens, encoder, controller, timezone);
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // ── DB persist ────────────────────────────────────────────────────
          if (conversationId && tenantId) {
            const safeTenantId: string = tenantId;
            const responseTimeMs = Date.now() - startTime;
            const lastUserMsg = chatMessages[chatMessages.length - 1];
            try {
              await prisma.message.createMany({
                data: [
                  { conversationId, role: 'user',      content: lastUserMsg?.content ?? '' },
                  { conversationId, role: 'assistant',  content: fullContent, responseTimeMs },
                ],
              });
              const month = new Date().toISOString().slice(0, 7);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const agentIdForUsage = (agentId ?? null) as any;
              await prisma.usageRecord.upsert({
                where:  { tenantId_agentId_month: { tenantId: safeTenantId, agentId: agentIdForUsage, month } },
                create: { tenantId: safeTenantId, agentId: agentIdForUsage, month, messages: 1 },
                update: { messages: { increment: 1 } },
              });
              if (agentId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (prisma.agent as any).update({
                  where: { id: agentId },
                  data:  { lastActiveAt: new Date(), messageCount: { increment: 1 } },
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
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calling Groq API:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
