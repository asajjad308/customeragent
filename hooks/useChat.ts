import { useState, useCallback } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const sendMessage = useCallback(async (content: string, systemPrompt: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsTyping(true);
    setCurrentResponse('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, systemPrompt }),
      });

      if (!response.ok) throw new Error('API error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body.');

      let accumulated = '';
      let buffer = '';
      let done = false;

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
          if (data === '[DONE]') {
            done = true;
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed?.content) {
              accumulated += parsed.content;
              setCurrentResponse(accumulated);
            }
          } catch (e) {
            // ignore partial or malformed chunks until complete
          }
        }
      }

      if (!done && buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed?.content) {
              accumulated += parsed.content;
              setCurrentResponse(accumulated);
            }
          } catch {}
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: accumulated,
        timestamp: new Date(),
      };
      setMessages([...newMessages, assistantMessage]);
      setCurrentResponse('');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong.',
        timestamp: new Date(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const resetChat = useCallback((greeting: string) => {
    setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
    setCurrentResponse('');
  }, []);

  return {
    messages,
    isTyping,
    currentResponse,
    sendMessage,
    resetChat,
  };
}