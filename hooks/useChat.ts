import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  kbUsed?: boolean;
  feedback?: 'up' | 'down';
}

export function useChat(conversationId: string | null) {
  const {
    conversations,
    activeConversationId,
    addMessage,
    updateLastMessage,
    setMessageFeedback,
    trackMessage,
    searchKB,
    integrations,
  } = useAppStore();

  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const conversation = conversations.find((c) => c.id === (conversationId ?? activeConversationId));
  const messages: Message[] = (conversation?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
    kbUsed: m.kbUsed,
    feedback: m.feedback,
  }));

  const model = integrations.groq.model;
  const temperature = integrations.groq.temperature;

  const sendMessage = useCallback(
    async (content: string, systemPrompt: string) => {
      if (!content.trim() || !conversationId) return;

      const kbAnswer = searchKB(content);
      const enhancedPrompt = kbAnswer ? `${systemPrompt}\n\nRelevant info from knowledge base: ${kbAnswer}` : systemPrompt;

      const now = Date.now();
      const userMsgId = addMessage(conversationId, {
        role: 'user',
        content,
        timestamp: now,
        kbUsed: !!kbAnswer,
      });

      setIsTyping(true);
      setCurrentResponse('');
      const startTime = Date.now();

      const apiMessages = [
        ...(conversation?.messages ?? []).map(({ role, content }) => ({ role, content })),
        { role: 'user' as const, content },
      ];

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            systemPrompt: enhancedPrompt,
            model,
            temperature,
          }),
        });

        if (response.status === 429) {
          toast.error('Slow down! Rate limit reached. Try again in a moment.', { duration: 4000 });
          throw new Error('Rate limit');
        }
        if (!response.ok) throw new Error('API error');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No response body.');

        let accumulated = '';
        let buffer = '';
        let done = false;

        // Placeholder for streaming message
        const assistantMsgId = addMessage(conversationId, {
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          kbUsed: !!kbAnswer,
        });

        while (!done) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') { done = true; break; }
            try {
              const parsed = JSON.parse(data);
              if (parsed?.content) {
                accumulated += parsed.content;
                setCurrentResponse(accumulated);
              }
            } catch {}
          }
        }

        updateLastMessage(conversationId, accumulated);
        setCurrentResponse('');

        const responseTime = Date.now() - startTime;
        trackMessage(content, responseTime);
      } catch (error) {
        const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
        if (isNetworkError) {
          toast.error('Connection lost. Check your internet.', {
            action: { label: 'Retry', onClick: () => sendMessage(content, systemPrompt) },
          });
        }
        addMessage(conversationId, {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: Date.now(),
        });
      } finally {
        setIsTyping(false);
      }
    },
    [conversationId, conversation, addMessage, updateLastMessage, trackMessage, searchKB, model, temperature]
  );

  const giveFeedback = useCallback(
    (msgId: string, feedback: 'up' | 'down') => {
      if (!conversationId) return;
      setMessageFeedback(conversationId, msgId, feedback);
    },
    [conversationId, setMessageFeedback]
  );

  return {
    messages,
    isTyping,
    currentResponse,
    sendMessage,
    giveFeedback,
  };
}
