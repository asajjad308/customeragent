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

const DEFAULT_BOT_ID = 'bot-aria';

const DEFAULT_BOT: Bot = {
  id: DEFAULT_BOT_ID,
  name: 'Aria',
  color: '#6366F1',
  systemPrompt:
    'You are Aria, a warm and efficient customer support assistant. Help users with their questions clearly and concisely. Always be empathetic. If you cannot resolve an issue, offer to connect them with a human agent.',
  businessContext:
    'SaaS company. 14-day free trial. Cancel anytime. Support hours: 24/7 via chat, Mon-Fri 9-5 for calls.',
  greeting: "Hi! I'm Aria 👋 What can I help you with today?",
  tone: 'friendly',
};

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
  // ─── Bots
  bots: Bot[];
  activeBotId: string;

  // ─── Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // ─── Analytics
  analytics: {
    messagesToday: number;
    totalMessages: number;
    responseTimes: number[];
    feedbacks: FeedbackItem[];
    resolvedChats: number;
    keywords: Record<string, number>;
    lastResetDate: string;
  };

  // ─── Knowledge Base
  kbEntries: KBEntry[];
  kbFiles: KBFile[];

  // ─── Integrations
  integrations: {
    groq: { model: string; temperature: number };
    slack: { webhookUrl: string; connected: boolean };
    whatsapp: { phoneId: string; token: string; connected: boolean };
    email: { host: string; port: string; user: string; pass: string; to: string; connected: boolean };
    zapier: { webhookUrl: string; connected: boolean };
    shopify: { storeUrl: string; apiKey: string; connected: boolean };
  };

  // ─── Settings
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

  // ─── App
  theme: ThemeKey;
  isOnboardingComplete: boolean;
  embedBotId: string;
  embedPosition: 'bottom-right' | 'bottom-left' | 'bottom-center';
  embedColor: string;

  // ─── Bot actions
  addBot: (bot: Omit<Bot, 'id'>) => string;
  updateBot: (id: string, updates: Partial<Omit<Bot, 'id'>>) => void;
  deleteBot: (id: string) => void;
  setActiveBot: (id: string) => void;
  getActiveBot: () => Bot;

  // ─── Conversation actions
  createConversation: (botId: string) => string;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id'>) => string;
  updateLastMessage: (conversationId: string, content: string) => void;
  setActiveConversation: (id: string | null) => void;
  deleteConversation: (id: string) => void;
  markConversationViewed: (id: string) => void;
  setMessageFeedback: (convId: string, msgId: string, feedback: 'up' | 'down') => void;

  // ─── Analytics actions
  trackMessage: (content: string, responseTime?: number) => void;
  trackFeedback: (messageId: string, type: 'up' | 'down', preview: string) => void;
  trackResolved: () => void;

  // ─── KB actions
  addKBEntry: (entry: Omit<KBEntry, 'id' | 'createdAt'>) => void;
  updateKBEntry: (id: string, updates: Partial<Pick<KBEntry, 'question' | 'answer'>>) => void;
  deleteKBEntry: (id: string) => void;
  addKBFile: (file: Omit<KBFile, 'id' | 'uploadedAt'>) => void;
  deleteKBFile: (id: string) => void;
  searchKB: (query: string) => string | null;

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ─── Initial state
      bots: [DEFAULT_BOT],
      activeBotId: DEFAULT_BOT_ID,

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
        groq: { model: 'llama-3.3-70b-versatile', temperature: 0.7 },
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

      // ─── Bot actions
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
          activeBotId: s.activeBotId === id ? (s.bots[0]?.id ?? DEFAULT_BOT_ID) : s.activeBotId,
        })),
      setActiveBot: (id) => set({ activeBotId: id }),
      getActiveBot: () => {
        const s = get();
        return s.bots.find((b) => b.id === s.activeBotId) ?? s.bots[0] ?? DEFAULT_BOT;
      },

      // ─── Conversation actions
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
      addKBEntry: (entry) =>
        set((s) => ({ kbEntries: [...s.kbEntries, { ...entry, id: uuid(), createdAt: Date.now() }] })),
      updateKBEntry: (id, updates) =>
        set((s) => ({ kbEntries: s.kbEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
      deleteKBEntry: (id) => set((s) => ({ kbEntries: s.kbEntries.filter((e) => e.id !== id) })),
      addKBFile: (file) =>
        set((s) => ({ kbFiles: [...s.kbFiles, { ...file, id: uuid(), uploadedAt: Date.now() }] })),
      deleteKBFile: (id) => set((s) => ({ kbFiles: s.kbFiles.filter((f) => f.id !== id) })),
      searchKB: (query) => {
        const { kbEntries, kbFiles } = get();
        const q = query.toLowerCase();
        const entry = kbEntries.find(
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
        bots: s.bots,
        activeBotId: s.activeBotId,
        conversations: s.conversations,
        analytics: s.analytics,
        kbEntries: s.kbEntries,
        kbFiles: s.kbFiles,
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
