'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickChips } from './QuickChips';
import type { Message } from '@/hooks/useChat';

interface ChatAreaProps {
  messages: Message[];
  currentResponse: string;
  isTyping: boolean;
  quickChips: string[];
  onQuickChipSelect: (chip: string) => void;
}

export function ChatArea({
  messages,
  currentResponse,
  isTyping,
  quickChips,
  onQuickChipSelect,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentResponse, isTyping]);

  return (
    <div className="flex-1 flex flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}

          {currentResponse && (
            <MessageBubble
              message={{ role: 'assistant', content: currentResponse }}
              isUser={false}
            />
          )}

          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {messages.length === 1 && !isTyping && (
        <QuickChips
          chips={quickChips}
          onSelect={onQuickChipSelect}
          disabled={isTyping}
        />
      )}
    </div>
  );
}