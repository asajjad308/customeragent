import { prisma } from '@/lib/prisma';

export async function buildSystemPrompt(agentId: string, orgName: string): Promise<string> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      connectionsFrom: {
        include: { toAgent: { select: { id: true, name: true } } },
        orderBy: { priority: 'asc' },
      },
    },
  });

  if (!agent) throw new Error(`Agent ${agentId} not found`);

  let prompt = agent.systemPrompt.replace(/\{\{company_name\}\}/g, orgName);

  if (agent.businessContext) {
    prompt += `\n\nBusiness Context: ${agent.businessContext}`;
  }

  prompt += `\nTone: ${agent.tone}`;
  prompt +=
    '\n\nSCOPE ENFORCEMENT: Only answer questions relevant to your role and the business context above. Politely decline off-topic requests.';

  if (agent.connectionsFrom.length > 0) {
    const handoffList = agent.connectionsFrom
      .map((c) => `- trigger: "${c.trigger}" → ${c.label}`)
      .join('\n');

    prompt +=
      `\n\n---\nAGENT HANDOFF INSTRUCTIONS:\n` +
      `You can transfer this conversation to a specialist agent when needed.\n` +
      `To trigger a handoff, respond with exactly this JSON on its own line:\n` +
      `{"handoff": "<trigger>", "reason": "<one sentence why>"}\n\n` +
      `Available handoffs:\n${handoffList}\n\n` +
      `IMPORTANT: Only trigger a handoff when the user's request is clearly outside your scope. ` +
      `Always inform the user before transferring.\n---`;
  }

  return prompt;
}
