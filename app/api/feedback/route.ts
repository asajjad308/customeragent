import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { messageId, conversationId, rating, comment } = parsed.data;

    const feedback = await prisma.feedback.upsert({
      where: { messageId },
      create: { messageId, conversationId, rating, comment },
      update: { rating, comment },
    });

    return NextResponse.json(feedback);
  } catch (err) {
    console.error('Feedback error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
