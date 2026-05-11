import { NextRequest } from 'next/server';

// In a real app this would read from a database.
// Here we return a default config for any botId.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;

  const config = {
    botId,
    name: 'Aria',
    greeting: "Hi! I'm Aria 👋 What can I help you with today?",
    systemPrompt:
      'You are Aria, a warm and efficient customer support assistant. Help users with their questions clearly and concisely. Always be empathetic. If you cannot resolve an issue, offer to connect them with a human agent.',
    businessContext: 'SaaS company. 14-day free trial. Cancel anytime. Support hours: 24/7 via chat.',
    tone: 'friendly',
    color: '#6366F1',
  };

  return Response.json(config);
}
