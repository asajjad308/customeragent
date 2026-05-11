'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { toast } from 'sonner';

export type TakeoverState = 'idle' | 'waiting' | 'connected';

interface HumanTakeoverBarProps {
  state: TakeoverState;
  onEnd: () => void;
}

export function HumanTakeoverBar({ state, onEnd }: HumanTakeoverBarProps) {
  if (state === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-center justify-between px-4 py-2 text-sm border-b ${
          state === 'waiting'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}
      >
        <div className="flex items-center gap-2">
          {state === 'waiting' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Waiting for agent...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <UserCheck className="w-4 h-4" />
              <span>Agent John connected</span>
            </>
          )}
        </div>
        {state === 'connected' && (
          <Button size="xs" variant="ghost" onClick={onEnd} aria-label="End human session" className="text-green-700 hover:text-green-900">
            <X className="w-3.5 h-3.5 mr-1" /> End Session
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export function useHumanTakeover() {
  const [state, setState] = useState<TakeoverState>('idle');
  const { integrations } = useAppStore();

  const trigger = async (transcript: string) => {
    setState('waiting');

    // Notify Slack if configured
    if (integrations.slack.connected && integrations.slack.webhookUrl) {
      try {
        await fetch(integrations.slack.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            text: `🚨 *Human takeover requested*\n\n*Recent transcript:*\n${transcript.slice(0, 500)}`,
          }),
        });
      } catch {
        // Slack notification is best-effort
      }
    }

    // Simulate agent joining after 5 seconds
    setTimeout(() => {
      setState('connected');
      toast.success('Agent John has joined the conversation!');
    }, 5000);
  };

  const end = () => {
    setState('idle');
    toast.info('Session ended. Back to bot mode.');
  };

  return { state, trigger, end };
}
