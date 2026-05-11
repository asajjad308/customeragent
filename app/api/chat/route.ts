import { NextRequest } from 'next/server';
import { groq } from '@/lib/groq';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, systemPrompt, model, temperature, conversationId, agentId, tenantId } = await request.json();

    const startTime = Date.now();

    const stream = await groq.chat.completions.create({
      model: model ?? 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(({ role, content }: { role: string; content: string }) => ({ role, content })),
      ],
      stream: true,
      temperature: temperature ?? 0.7,
      max_tokens: 1024,
    });

    const encoder = new TextEncoder();
    let fullContent = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // Persist user + assistant messages if we have a DB conversation
          if (conversationId && tenantId) {
            const responseTimeMs = Date.now() - startTime;
            const lastUserMsg = messages[messages.length - 1];
            try {
              await prisma.message.createMany({
                data: [
                  {
                    conversationId,
                    role: 'user',
                    content: lastUserMsg?.content ?? '',
                  },
                  {
                    conversationId,
                    role: 'assistant',
                    content: fullContent,
                    responseTimeMs,
                  },
                ],
              });

              // Update usage record
              const month = new Date().toISOString().slice(0, 7);
              await prisma.usageRecord.upsert({
                where: { tenantId_agentId_month: { tenantId, agentId: agentId ?? null, month } },
                create: { tenantId, agentId: agentId ?? null, month, messages: 1 },
                update: { messages: { increment: 1 } },
              });
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
