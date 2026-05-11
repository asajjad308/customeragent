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

      if (reader) {
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: accumulated,
                  timestamp: new Date(),
                };
                setMessages([...newMessages, assistantMessage]);
                setCurrentResponse('');
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulated += parsed.content;
                  setCurrentResponse(accumulated);
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }
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