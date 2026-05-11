'use client';

import {
  MessageSquare,
  BarChart3,
  MessageCircle,
  Settings,
  HelpCircle,
  Zap,
  User,
  Crown,
  Puzzle,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { BotSelector } from '@/components/sidebar/BotSelector';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { useAppStore } from '@/store';

const navigation = [
  { name: 'Live Chat', icon: MessageSquare },
  { name: 'Agents', icon: Bot },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Conversations', icon: MessageCircle },
  { name: 'Knowledge Base', icon: HelpCircle },
  { name: 'Integrations', icon: Puzzle },
  { name: 'Settings', icon: Settings },
];

interface LeftSidebarProps {
  selectedNav: string;
  onNavChange: (nav: string) => void;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

export function LeftSidebar({ selectedNav, onNavChange, onConversationSelect, onNewConversation }: LeftSidebarProps) {
  const { analytics, settings } = useAppStore();

  const totalMessages = analytics.totalMessages;
  const limit = 10000;
  const usedPercent = Math.min((totalMessages / limit) * 100, 100);
  const progressColor = usedPercent > 85 ? 'bg-red-500' : usedPercent > 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="w-60 bg-card border-r border-border flex flex-col shrink-0">
      {/* Bot Selector (header) */}
      <div className="p-3">
        <BotSelector />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="px-3 py-3 shrink-0">
        <ul className="space-y-0.5">
          {navigation.map((item) => (
            <li key={item.name}>
              <Button
                variant={selectedNav === item.name ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2.5 h-8"
                onClick={() => onNavChange(item.name)}
                aria-label={item.name}
                aria-current={selectedNav === item.name ? 'page' : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{item.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      {/* Conversation list */}
      {selectedNav === 'Live Chat' && (
        <div className="flex-1 min-h-0 flex flex-col py-2">
          <ConversationList onSelect={onConversationSelect} onNew={onNewConversation} />
        </div>
      )}

      {selectedNav !== 'Live Chat' && <div className="flex-1" />}

      <Separator />

      {/* Usage */}
      <div className="p-3 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs font-medium">Usage</span>
            </div>
            <span className="text-xs text-muted-foreground">{totalMessages.toLocaleString()} / {limit.toLocaleString()}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${progressColor}`} style={{ width: `${usedPercent}%` }} />
          </div>
          {usedPercent > 80 && (
            <button onClick={() => onNavChange('Settings')} className="text-xs text-orange-500 hover:underline">
              Upgrade Plan →
            </button>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs">
              <User className="w-3.5 h-3.5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{settings.companyName}</div>
            <Badge variant="secondary" className="text-xs py-0 h-4">
              <Crown className="w-2.5 h-2.5 mr-0.5" />
              Pro
            </Badge>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
