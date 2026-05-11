import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { tenantId } = session!.user;
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  const days = parseInt(searchParams.get('days') ?? '30');

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where = {
    tenantId,
    ...(agentId ? { agentId } : {}),
    startedAt: { gte: since },
  };

  const [
    totalConversations,
    totalMessages,
    avgResponseTime,
    feedbackStats,
    topKeywords,
  ] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.message.count({
      where: { conversation: { tenantId, ...(agentId ? { agentId } : {}) } },
    }),
    prisma.message.aggregate({
      where: {
        conversation: { tenantId, ...(agentId ? { agentId } : {}) },
        responseTimeMs: { not: null },
      },
      _avg: { responseTimeMs: true },
    }),
    prisma.feedback.aggregate({
      where: { conversation: { tenantId, ...(agentId ? { agentId } : {}) } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.message.findMany({
      where: {
        conversation: { tenantId, ...(agentId ? { agentId } : {}) },
        role: 'user',
        createdAt: { gte: since },
      },
      select: { content: true },
      take: 500,
    }),
  ]);

  // Simple keyword extraction
  const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'i', 'to', 'do', 'how', 'what', 'can', 'you', 'my', 'me', 'we', 'in', 'of', 'and', 'or']);
  const wordCounts: Record<string, number> = {};
  for (const { content } of topKeywords) {
    for (const word of content.toLowerCase().split(/\W+/)) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] ?? 0) + 1;
      }
    }
  }
  const keywords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return NextResponse.json({
    totalConversations,
    totalMessages,
    avgResponseTimeMs: Math.round(avgResponseTime._avg.responseTimeMs ?? 0),
    satisfactionScore: feedbackStats._avg.rating ? Math.round(feedbackStats._avg.rating * 20) : null,
    feedbackCount: feedbackStats._count,
    keywords,
  });
}
