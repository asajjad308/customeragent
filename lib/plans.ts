export type Plan = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxAgents: number;
  maxMessagesPerMonth: number;
  maxKnowledgeBaseEntries: number;
  maxApiKeys: number;
  customDomains: boolean;
  analytics: boolean;
  integrations: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxAgents: 1,
    maxMessagesPerMonth: 1000,
    maxKnowledgeBaseEntries: 50,
    maxApiKeys: 2,
    customDomains: false,
    analytics: false,
    integrations: false,
  },
  pro: {
    maxAgents: 5,
    maxMessagesPerMonth: 10000,
    maxKnowledgeBaseEntries: 500,
    maxApiKeys: 10,
    customDomains: true,
    analytics: true,
    integrations: true,
  },
  enterprise: {
    maxAgents: Infinity,
    maxMessagesPerMonth: Infinity,
    maxKnowledgeBaseEntries: Infinity,
    maxApiKeys: Infinity,
    customDomains: true,
    analytics: true,
    integrations: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.free;
}

export function isWithinLimit(plan: string, resource: keyof PlanLimits, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  const limit = limits[resource];
  if (typeof limit === 'boolean') return limit;
  return currentCount < limit;
}
