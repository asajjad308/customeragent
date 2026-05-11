'use client';

import type { Message } from '@/hooks/useChat';
import { motion } from 'framer-motion';
import { Copy, ThumbsUp, ThumbsDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  isHumanAgent?: boolean;
  onFeedback?: (msgId: string, feedback: 'up' | 'down') => void;
}

export function MessageBubble({ message, isUser, isHumanAgent, onFeedback }: MessageBubbleProps) {
  const { settings, getActiveBot } = useAppStore();
  const bot = getActiveBot();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };

  const handleFeedback = (type: 'up' | 'down') => {
    if (message.id && onFeedback) {
      onFeedback(message.id, type);
    }
    toast.success(type === 'up' ? 'Thanks for the feedback!' : 'Feedback noted');
  };

  const bubbleRadius =
    settings.bubbleStyle === 'sharp' ? 'rounded-none' :
    settings.bubbleStyle === 'pill' ? 'rounded-full px-5' :
    'rounded-2xl';

  const fontSize =
    settings.fontSize === 'small' ? 'text-xs' :
    settings.fontSize === 'large' ? 'text-base' :
    'text-sm';

  return (
    <motion.div
      initial={{ x: isUser ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback
            style={isHumanAgent ? {} : { backgroundColor: bot.color }}
            className={isHumanAgent ? 'bg-green-500 text-white' : 'text-white'}
          >
            {isHumanAgent ? <User className="w-4 h-4" /> : bot.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[75%] md:max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        {isHumanAgent && (
          <p className="text-xs text-muted-foreground mb-1 ml-1">John (Human Agent)</p>
        )}
        {message.kbUsed && !isUser && (
          <p className="text-xs text-indigo-500 mb-1 ml-1">📚 Using knowledge base</p>
        )}
        <Card className={`py-3 px-4 ${bubbleRadius} ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
          <p className={`${fontSize} leading-relaxed`}>{message.content}</p>
        </Card>

        <div className={`flex items-center gap-1.5 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && settings.showReactions && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleFeedback('up')}
                className={message.feedback === 'up' ? 'text-green-500' : ''}
                aria-label="Thumbs up"
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleFeedback('down')}
                className={message.feedback === 'down' ? 'text-red-500' : ''}
                aria-label="Thumbs down"
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon-xs" onClick={handleCopy} aria-label="Copy message">
            <Copy className="w-3 h-3" />
          </Button>
          {settings.showTimestamps && message.timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
