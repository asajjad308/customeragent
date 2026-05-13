import { create } from 'zustand';

export type AgentType =
  | 'SUPPORT'
  | 'TECHNICAL'
  | 'SALES'
  | 'LEAD_GEN'
  | 'ONBOARDING'
  | 'HR'
  | 'BOOKING'
  | 'CUSTOM';

export type AgentStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'ARCHIVED';
export type WidgetTheme = 'GLASSMORPHISM_DARK' | 'NEO_BRUTALISM' | 'SOFT_AURORA';

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  typeId: AgentType;
  status: AgentStatus;
  avatarColor: string;
  widgetColor: string;
  systemPrompt: string;
  businessContext?: string | null;
  greeting: string;
  tone: string;
  model: string;
  temperature: number;
  maxTokens: number;
  widgetTheme: WidgetTheme;
  quickReplies: string[];
  sessions: number;
  messageCount: number;
  satisfaction?: number | null;
  isActive: boolean;
  widgetPosition: string;
  allowedDomains?: string | null;
  maxMsgPerHour: number;
  blockedWords?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string | null;
}

export interface AgentConnection {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  trigger: string;
  label: string;
  priority: number;
  createdAt: string;
  toAgent?: {
    id: string;
    name: string;
    typeId: AgentType;
    avatarColor: string;
    widgetColor: string;
  };
}

export interface AgentFormData {
  name: string;
  typeId: AgentType;
  color: string;
  greeting: string;
  systemPrompt: string;
  businessContext: string;
  tone: string;
  temperature: number;
  maxTokens: number;
  widgetTheme: WidgetTheme;
  quickReplies: string[];
}

export interface ConnectionFormData {
  toAgentId: string;
  trigger: string;
  label: string;
  priority: number;
}

interface AgentsState {
  agents: Agent[];
  connections: Record<string, AgentConnection[]>;
  selectedAgentId: string | null;
  loading: boolean;
  error: string | null;

  fetchAgents: () => Promise<void>;
  createAgent: (form: Partial<AgentFormData>) => Promise<Agent | null>;
  updateAgent: (id: string, form: Partial<AgentFormData>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  changeStatus: (id: string, status: AgentStatus) => Promise<void>;
  selectAgent: (id: string | null) => void;

  fetchConnections: (agentId: string) => Promise<void>;
  addConnection: (agentId: string, data: ConnectionFormData) => Promise<{ error?: string }>;
  removeConnection: (agentId: string, connectionId: string) => Promise<void>;
}

export const useAgentsStore = create<AgentsState>()((set, get) => ({
  agents: [],
  connections: {},
  selectedAgentId: null,
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to load agents');
      const data: Agent[] = await res.json();
      set({ agents: data, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  },

  createAgent: async (form) => {
    const raw = form.name ?? '';
    const slug = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'agent';

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug,
          typeId: form.typeId ?? 'SUPPORT',
          systemPrompt: form.systemPrompt ?? 'You are a helpful assistant.',
          greeting: form.greeting ?? 'Hi! How can I help?',
          businessContext: form.businessContext ?? '',
          tone: form.tone ?? 'friendly',
          avatarColor: form.color ?? '#6366F1',
          widgetColor: form.color ?? '#6366F1',
          temperature: form.temperature ?? 0.4,
          maxTokens: form.maxTokens ?? 512,
          widgetTheme: form.widgetTheme ?? 'SOFT_AURORA',
          quickReplies: form.quickReplies ?? [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Failed to create agent');
      set((s) => ({ agents: [...s.agents, json as Agent] }));
      return json as Agent;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create agent');
    }
  },

  updateAgent: async (id, form) => {
    const prev = get().agents.find((a) => a.id === id);
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id !== id
          ? a
          : {
              ...a,
              name: form.name ?? a.name,
              systemPrompt: form.systemPrompt ?? a.systemPrompt,
              greeting: form.greeting ?? a.greeting,
              tone: form.tone ?? a.tone,
              avatarColor: form.color ?? a.avatarColor,
              widgetColor: form.color ?? a.widgetColor,
              businessContext: form.businessContext ?? a.businessContext,
              typeId: form.typeId ?? a.typeId,
              temperature: form.temperature ?? a.temperature,
              maxTokens: form.maxTokens ?? a.maxTokens,
              widgetTheme: form.widgetTheme ?? a.widgetTheme,
              quickReplies: form.quickReplies ?? a.quickReplies,
            }
      ),
    }));
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          systemPrompt: form.systemPrompt,
          greeting: form.greeting,
          tone: form.tone,
          avatarColor: form.color,
          widgetColor: form.color,
          businessContext: form.businessContext,
          typeId: form.typeId,
          temperature: form.temperature,
          maxTokens: form.maxTokens,
          widgetTheme: form.widgetTheme,
          quickReplies: form.quickReplies,
        }),
      });
      if (!res.ok && prev) {
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? prev : a)) }));
      }
    } catch {
      if (prev) set((s) => ({ agents: s.agents.map((a) => (a.id === id ? prev : a)) }));
    }
  },

  deleteAgent: async (id) => {
    const prev = get().agents;
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) }));
    try {
      const res = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (!res.ok) set({ agents: prev });
    } catch {
      set({ agents: prev });
    }
  },

  changeStatus: async (id, status) => {
    const prev = get().agents.find((a) => a.id === id);
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)) }));
    try {
      const res = await fetch(`/api/agents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok && prev) {
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? prev : a)) }));
      }
    } catch {
      if (prev) set((s) => ({ agents: s.agents.map((a) => (a.id === id ? prev : a)) }));
    }
  },

  selectAgent: (id) => set({ selectedAgentId: id }),

  fetchConnections: async (agentId) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/connections`);
      if (!res.ok) return;
      const data: AgentConnection[] = await res.json();
      set((s) => ({ connections: { ...s.connections, [agentId]: data } }));
    } catch {
      // network error — leave existing cache
    }
  },

  addConnection: async (agentId, data) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: (json as { error?: string }).error ?? 'Failed to add connection' };
      await get().fetchConnections(agentId);
      return {};
    } catch {
      return { error: 'Network error' };
    }
  },

  removeConnection: async (agentId, connectionId) => {
    const prev = get().connections[agentId] ?? [];
    set((s) => ({
      connections: {
        ...s.connections,
        [agentId]: (s.connections[agentId] ?? []).filter((c) => c.id !== connectionId),
      },
    }));
    try {
      const res = await fetch(`/api/agents/${agentId}/connections`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) set((s) => ({ connections: { ...s.connections, [agentId]: prev } }));
    } catch {
      set((s) => ({ connections: { ...s.connections, [agentId]: prev } }));
    }
  },
}));
