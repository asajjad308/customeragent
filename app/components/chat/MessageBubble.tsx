'use client';

import { motion } from 'framer-motion';
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  };
  isUser: boolean;
}

export function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };

  const handleFeedback = (positive: boolean) => {
    toast.success(positive ? 'Thanks for the feedback!' : 'Feedback noted');
  };

  return (
    <motion.div
      initial={{ x: isUser ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        <Card className={`p-4 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </Card>

        <div className={`flex items-center gap-2 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(true)}
                className="h-6 w-6 p-0"
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(false)}
                className="h-6 w-6 p-0"
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
          {message.timestamp && (
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}