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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const navigation = [
  { name: 'Live Chat', icon: MessageSquare },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Conversations', icon: MessageCircle },
  { name: 'Knowledge Base', icon: HelpCircle },
  { name: 'Integrations', icon: Puzzle },
  { name: 'Settings', icon: Settings },
];

interface LeftSidebarProps {
  selectedNav: string;
  onNavChange: (nav: string) => void;
}

export function LeftSidebar({ selectedNav, onNavChange }: LeftSidebarProps) {
  return (
    <div className="w-60 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">SupportAI</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Button
                variant={selectedNav === item.name ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => onNavChange(item.name)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      {/* Conversation History */}
      <div className="flex-1 px-4 py-4">
        <h3 className="text-sm font-medium mb-3">Recent Conversations</h3>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
                <div className="text-sm font-medium">Customer {i + 1}</div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Usage & User */}
      <div className="p-4 space-y-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Usage</span>
          </div>
          <div className="text-xs text-muted-foreground">1,234 / 10,000 messages</div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className="bg-indigo-500 h-2 rounded-full w-1/8"></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium">John Doe</div>
            <Badge variant="secondary" className="text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
        </div>

        <ThemeSwitcher />
      </div>
    </div>
  );
}
