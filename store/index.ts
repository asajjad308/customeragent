import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeKey = 'glassmorphism' | 'brutalism' | 'aurora';

export interface Bot {
  id: string;
  name: string;
  color: string;
  systemPrompt: string;
  businessContext: string;
  greeting: string;
  tone: string;
  slug?: string;
  model?: string;
  temperature?: number;
  widgetPosition?: string;
  isActive?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: 'up' | 'down';
  isHuman?: boolean;
  humanName?: string;
  kbUsed?: boolean;
  responseTime?: number;
}

export interface Conversation {
  id: string;
  botId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isViewed: boolean;
}

export interface KBEntry {
  id: string;
  agentId?: string | null;
  question: string;
  answer: string;
  createdAt: number;
}

export interface KBFile {
  id: string;
  name: string;
  size: number;
  content: string;
  type: string;
  uploadedAt: number;
}

export interface FeedbackItem {
  messageId: string;
  type: 'up' | 'down';
  preview: string;
  timestamp: number;
}
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const COMMON_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'i', 'my', 'how', 'can', 'do', 'to', 'in', 'of', 'and', 'or', 'it', 'this', 'that', 'what', 'why', 'when', 'where', 'who', 'you', 'me', 'we', 'us', 'be', 'was', 'been', 'have', 'has', 'had', 'not', 'no', 'yes', 'for', 'with', 'on', 'at', 'by', 'from', 'about', 'up', 'out', 'if', 'so', 'but', 'please', 'hi', 'hello', 'help']);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !COMMON_WORDS.has(w));
}

export interface AppState {
  // ─── Bots (populated from DB on load, not persisted)
  bots: Bot[];
  activeBotId: string;

  // ─── Conversations (populated from DB on load, not persisted)
  conversations: Conversation[];
  activeConversationId: string | null;

  // ─── Analytics (local tracking, not persisted to keep fresh)
  analytics: {
    messagesToday: number;
    totalMessages: number;
    responseTimes: number[];
    feedbacks: FeedbackItem[];
    resolvedChats: number;
    keywords: Record<string, number>;
    lastResetDate: string;
  };

  // ─── Knowledge Base (populated from DB, not persisted)
  kbEntries: KBEntry[];
  kbFiles: KBFile[];

  // ─── Integrations (persisted – user config)
  integrations: {
    groq: { model: string; temperature: number };
    slack: { webhookUrl: string; connected: boolean };
    whatsapp: { phoneId: string; token: string; connected: boolean };
    email: { host: string; port: string; user: string; pass: string; to: string; connected: boolean };
    zapier: { webhookUrl: string; connected: boolean };
    shopify: { storeUrl: string; apiKey: string; connected: boolean };
  };

  // ─── Settings (persisted for fast load)
  settings: {
    companyName: string;
    supportEmail: string;
    language: string;
    timezone: string;
    dateFormat: string;
    bubbleStyle: 'rounded' | 'sharp' | 'pill';
    fontSize: 'small' | 'medium' | 'large';
    showTimestamps: boolean;
    showReactions: boolean;
    showQuickChips: boolean;
    showPoweredBy: boolean;
    notifyEmail: boolean;
    notifySlack: boolean;
    notifyDailyReport: boolean;
    notifyWeeklySummary: boolean;
    apiKey: string;
    rateLimit: number;
    blockedWords: string[];
    ipWhitelist: string;
  };

  // ─── App (persisted)
  theme: ThemeKey;
  isOnboardingComplete: boolean;
  embedBotId: string;
  embedPosition: 'bottom-right' | 'bottom-left' | 'bottom-center';
  embedColor: string;

  // ─── API loading state
  isLoadingAgents: boolean;
  isLoadingConversations: boolean;

  // ─── Bot actions (local)
  addBot: (bot: Omit<Bot, 'id'>) => string;
  updateBot: (id: string, updates: Partial<Omit<Bot, 'id'>>) => void;
  deleteBot: (id: string) => void;
  setActiveBot: (id: string) => void;
  getActiveBot: () => Bot;
  setBots: (bots: Bot[]) => void;

  // ─── DB-backed bot actions
  loadAgents: () => Promise<void>;
  createAgent: (data: Partial<Bot>) => Promise<Bot | null>;
  updateAgent: (id: string, data: Partial<Bot>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;

  // ─── Conversation actions (local)
  createConversation: (botId: string) => string;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id'>) => string;
  updateLastMessage: (conversationId: string, content: string) => void;
  setActiveConversation: (id: string | null) => void;
  deleteConversation: (id: string) => void;
  markConversationViewed: (id: string) => void;
  setMessageFeedback: (convId: string, msgId: string, feedback: 'up' | 'down') => void;
  setConversations: (conversations: Conversation[]) => void;

  // ─── DB-backed conversation actions
  loadConversations: (agentId?: string) => Promise<void>;
  createConversationDB: (agentId: string) => Promise<string | null>;

  // ─── Analytics actions
  trackMessage: (content: string, responseTime?: number) => void;
  trackFeedback: (messageId: string, type: 'up' | 'down', preview: string) => void;
  trackResolved: () => void;

  // ─── KB actions
  loadKB: (agentId?: string | null) => Promise<void>;
  addKBEntry: (entry: Omit<KBEntry, 'id' | 'createdAt'>) => Promise<KBEntry | null>;
  updateKBEntry: (id: string, updates: Partial<Pick<KBEntry, 'question' | 'answer'>>) => Promise<void>;
  deleteKBEntry: (id: string) => Promise<void>;
  addKBFile: (file: Omit<KBFile, 'id' | 'uploadedAt'>) => void;
  deleteKBFile: (id: string) => void;
  searchKB: (query: string) => string | null;
  setKBEntries: (entries: KBEntry[]) => void;

  // ─── Integration actions
  updateIntegration: <K extends keyof AppState['integrations']>(
    key: K,
    data: Partial<AppState['integrations'][K]>
  ) => void;

  // ─── Settings actions
  updateSettings: (updates: Partial<AppState['settings']>) => void;
  updateTheme: (theme: ThemeKey) => void;
  completeOnboarding: () => void;
  setEmbedConfig: (config: Partial<Pick<AppState, 'embedPosition' | 'embedColor'>>) => void;
}

const DEFAULT_BOT: Bot = {
  id: 'bot-default',
  name: 'Support Agent',
  color: '#6366F1',
  systemPrompt: 'You are a helpful customer support assistant.',
  businessContext: '',
  greeting: "Hi! How can I help you today?",
  tone: 'friendly',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Initial state
      bots: [],
      activeBotId: '',

      conversations: [],
      activeConversationId: null,

      analytics: {
        messagesToday: 0,
        totalMessages: 0,
        responseTimes: [],
        feedbacks: [],
        resolvedChats: 0,
        keywords: {},
        lastResetDate: todayString(),
      },

      kbEntries: [],
      kbFiles: [],

      integrations: {
        groq: { model: 'openai/gpt-oss-120b', temperature: 0.7 },
        slack: { webhookUrl: '', connected: false },
        whatsapp: { phoneId: '', token: '', connected: false },
        email: { host: '', port: '587', user: '', pass: '', to: '', connected: false },
        zapier: { webhookUrl: '', connected: false },
        shopify: { storeUrl: '', apiKey: '', connected: false },
      },

      settings: {
        companyName: 'My Company',
        supportEmail: 'support@example.com',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        bubbleStyle: 'rounded',
        fontSize: 'medium',
        showTimestamps: true,
        showReactions: true,
        showQuickChips: true,
        showPoweredBy: true,
        notifyEmail: false,
        notifySlack: false,
        notifyDailyReport: false,
        notifyWeeklySummary: false,
        apiKey: uuid(),
        rateLimit: 20,
        blockedWords: [],
        ipWhitelist: '',
      },

      theme: 'aurora',
      isOnboardingComplete: false,
      embedBotId: uuid(),
      embedPosition: 'bottom-right',
      embedColor: '#6366F1',

      isLoadingAgents: false,
      isLoadingConversations: false,

      // ─── Bot actions (local)
      addBot: (bot) => {
        const id = uuid();
        set((s) => ({ bots: [...s.bots, { ...bot, id }] }));
        return id;
      },
      updateBot: (id, updates) =>
        set((s) => ({ bots: s.bots.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      deleteBot: (id) =>
        set((s) => ({
          bots: s.bots.filter((b) => b.id !== id),
          activeBotId: s.activeBotId === id ? (s.bots.find(b => b.id !== id)?.id ?? '') : s.activeBotId,
        })),
      setActiveBot: (id) => set({ activeBotId: id }),
      getActiveBot: () => {
        const s = get();
        return s.bots.find((b) => b.id === s.activeBotId) ?? s.bots[0] ?? DEFAULT_BOT;
      },
      setBots: (bots) => set({ bots }),

      // ─── DB-backed bot actions
      loadAgents: async () => {
        set({ isLoadingAgents: true });
        try {
          const res = await fetch('/api/agents');
          if (!res.ok) return;
          const agents = await res.json();
          const bots: Bot[] = agents.map((a: any) => ({
            id: a.id,
            name: a.name,
            color: a.widgetColor ?? '#6366F1',
            systemPrompt: a.systemPrompt,
            businessContext: a.businessContext ?? '',
            greeting: a.greeting,
            tone: a.tone,
            slug: a.slug,
            model: a.model,
            temperature: a.temperature,
            widgetPosition: a.widgetPosition,
            isActive: a.isActive,
          }));
          const currentId = get().activeBotId;
          set({
            bots,
            activeBotId: bots.find(b => b.id === currentId)?.id ?? bots[0]?.id ?? '',
            isLoadingAgents: false,
          });
        } catch {
          set({ isLoadingAgents: false });
        }
      },
      createAgent: async (data) => {
        try {
          const res = await fetch('/api/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              slug: data.slug ?? data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              systemPrompt: data.systemPrompt ?? 'You are a helpful assistant.',
              greeting: data.greeting ?? 'Hi! How can I help?',
              tone: data.tone,
              avatarColor: data.color,
              widgetColor: data.color,
            }),
          });
          if (!res.ok) return null;
          const agent = await res.json();
          const bot: Bot = {
            id: agent.id,
            name: agent.name,
            color: agent.widgetColor ?? '#6366F1',
            systemPrompt: agent.systemPrompt,
            businessContext: agent.businessContext ?? '',
            greeting: agent.greeting,
            tone: agent.tone,
            slug: agent.slug,
          };
          set((s) => ({ bots: [...s.bots, bot], activeBotId: bot.id }));
          return bot;
        } catch {
          return null;
        }
      },
      updateAgent: async (id, data) => {
        try {
          await fetch(`/api/agents/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              systemPrompt: data.systemPrompt,
              greeting: data.greeting,
              tone: data.tone,
              widgetColor: data.color,
              avatarColor: data.color,
              businessContext: data.businessContext,
            }),
          });
          set((s) => ({ bots: s.bots.map((b) => (b.id === id ? { ...b, ...data } : b)) }));
        } catch {
          // local update still applied
        }
      },
      deleteAgent: async (id) => {
        try {
          await fetch(`/api/agents/${id}`, { method: 'DELETE' });
        } catch {
          // fall through to local delete
        }
        set((s) => ({
          bots: s.bots.filter((b) => b.id !== id),
          activeBotId: s.activeBotId === id ? (s.bots.find(b => b.id !== id)?.id ?? '') : s.activeBotId,
        }));
      },

      // ─── Conversation actions (local)
      createConversation: (botId) => {
        const id = uuid();
        const now = Date.now();
        set((s) => ({
          conversations: [
            { id, botId, title: 'New conversation', messages: [], createdAt: now, updatedAt: now, isViewed: true },
            ...s.conversations,
          ],
          activeConversationId: id,
        }));
        return id;
      },
      addMessage: (conversationId, message) => {
        const id = uuid();
        const msg: ChatMessage = { ...message, id };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  title: c.messages.length === 0 && message.role === 'user' ? message.content.slice(0, 40) : c.title,
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
        return id;
      },
      updateLastMessage: (conversationId, content) => {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages];
            if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
            return { ...c, messages: msgs };
          }),
        }));
      },
      setActiveConversation: (id) => set({ activeConversationId: id }),
      deleteConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),
      markConversationViewed: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, isViewed: true } : c)),
        })),
      setMessageFeedback: (convId, msgId, feedback) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, feedback } : m)) }
              : c
          ),
        }));
        const conv = get().conversations.find((c) => c.id === convId);
        const msg = conv?.messages.find((m) => m.id === msgId);
        if (msg) get().trackFeedback(msgId, feedback, msg.content.slice(0, 60));
      },
      setConversations: (conversations) => set({ conversations }),

      // ─── DB-backed conversation actions
      loadConversations: async (agentId) => {
        set({ isLoadingConversations: true });
        try {
          const url = agentId ? `/api/conversations?agentId=${agentId}` : '/api/conversations';
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          const conversations: Conversation[] = data.map((c: any) => ({
            id: c.id,
            botId: c.agentId,
            title: c.messages?.[0]?.content?.slice(0, 40) ?? 'Conversation',
            messages: (c.messages ?? []).map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt).getTime(),
            })),
            createdAt: new Date(c.startedAt).getTime(),
            updatedAt: new Date(c.startedAt).getTime(),
            isViewed: true,
          }));
          set({ conversations, isLoadingConversations: false });
        } catch {
          set({ isLoadingConversations: false });
        }
      },
      createConversationDB: async (agentId) => {
        try {
          const res = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
          });
          if (!res.ok) return null;
          const conv = await res.json();
          const localConv: Conversation = {
            id: conv.id,
            botId: agentId,
            title: 'New conversation',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isViewed: true,
          };
          set((s) => ({
            conversations: [localConv, ...s.conversations],
            activeConversationId: conv.id,
          }));
          return conv.id;
        } catch {
          return null;
        }
      },

      // ─── Analytics actions
      trackMessage: (content, responseTime) => {
        const today = todayString();
        const keywords = extractKeywords(content);
        set((s) => {
          const analytics = { ...s.analytics };
          if (analytics.lastResetDate !== today) {
            analytics.messagesToday = 0;
            analytics.lastResetDate = today;
          }
          analytics.messagesToday += 1;
          analytics.totalMessages += 1;
          if (responseTime !== undefined) analytics.responseTimes = [...analytics.responseTimes.slice(-99), responseTime];
          const kw = { ...analytics.keywords };
          keywords.forEach((w) => { kw[w] = (kw[w] ?? 0) + 1; });
          analytics.keywords = kw;
          return { analytics };
        });
      },
      trackFeedback: (messageId, type, preview) =>
        set((s) => ({
          analytics: {
            ...s.analytics,
            feedbacks: [{ messageId, type, preview, timestamp: Date.now() }, ...s.analytics.feedbacks.slice(0, 49)],
          },
        })),
      trackResolved: () =>
        set((s) => ({ analytics: { ...s.analytics, resolvedChats: s.analytics.resolvedChats + 1 } })),

      // ─── KB actions
      loadKB: async (agentId) => {
        const url = agentId ? `/api/kb?agentId=${encodeURIComponent(agentId)}` : '/api/kb';
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const entries: KBEntry[] = (data as any[]).map((d) => ({
          id: d.id,
          agentId: d.agentId,
          question: d.title,
          answer: d.content ?? '',
          createdAt: new Date(d.createdAt).getTime(),
        }));
        set({ kbEntries: entries });
      },
      addKBEntry: async (entry) => {
        const res = await fetch('/api/kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'qa', title: entry.question, content: entry.answer, agentId: entry.agentId }),
        });
        if (!res.ok) return null;
        const d = await res.json();
        const newEntry: KBEntry = { id: d.id, agentId: d.agentId, question: d.title, answer: d.content ?? '', createdAt: new Date(d.createdAt).getTime() };
        set((s) => ({ kbEntries: [newEntry, ...s.kbEntries] }));
        return newEntry;
      },
      updateKBEntry: async (id, updates) => {
        await fetch(`/api/kb/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...(updates.question !== undefined ? { title: updates.question } : {}), ...(updates.answer !== undefined ? { content: updates.answer } : {}) }),
        });
        set((s) => ({ kbEntries: s.kbEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
      },
      deleteKBEntry: async (id) => {
        await fetch(`/api/kb/${id}`, { method: 'DELETE' });
        set((s) => ({ kbEntries: s.kbEntries.filter((e) => e.id !== id) }));
      },
      addKBFile: (file) =>
        set((s) => ({ kbFiles: [...s.kbFiles, { ...file, id: uuid(), uploadedAt: Date.now() }] })),
      deleteKBFile: (id) => set((s) => ({ kbFiles: s.kbFiles.filter((f) => f.id !== id) })),
      searchKB: (query) => {
        const { kbEntries, kbFiles, activeBotId } = get();
        const q = query.toLowerCase();
        const relevant = kbEntries.filter((e) => !e.agentId || e.agentId === activeBotId);
        const entry = relevant.find(
          (e) => q.includes(e.question.toLowerCase()) || e.question.toLowerCase().split(' ').some((w) => w.length > 3 && q.includes(w))
        );
        if (entry) return entry.answer;
        for (const file of kbFiles) {
          const lines = file.content.split('\n');
          const match = lines.find((l) => l.toLowerCase().includes(q.slice(0, 20)));
          if (match) return match;
        }
        return null;
      },
      setKBEntries: (entries) => set({ kbEntries: entries }),

      // ─── Integration actions
      updateIntegration: (key, data) =>
        set((s) => ({ integrations: { ...s.integrations, [key]: { ...s.integrations[key], ...data } } })),

      // ─── Settings actions
      updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
      updateTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      setEmbedConfig: (config) => set(config),
    }),
    {
      name: 'supportai_state',
      partialize: (s) => ({
        // Only persist UI preferences, not server data
        activeBotId: s.activeBotId,
        analytics: s.analytics,
        integrations: s.integrations,
        settings: s.settings,
        theme: s.theme,
        isOnboardingComplete: s.isOnboardingComplete,
        embedBotId: s.embedBotId,
        embedPosition: s.embedPosition,
        embedColor: s.embedColor,
      }),
    }
  )
);
