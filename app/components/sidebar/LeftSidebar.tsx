'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  BarChart3,
  MessageCircle,
  Settings,
  HelpCircle,
  Zap,
  User,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const navigation = [
  { name: 'Live Chat', icon: MessageSquare, current: true },
  { name: 'Analytics', icon: BarChart3, current: false },
  { name: 'Conversations', icon: MessageCircle, current: false },
  { name: 'Knowledge Base', icon: HelpCircle, current: false },
  { name: 'Integrations', icon: Settings, current: false },
  { name: 'Settings', icon: Settings, current: false },
];

export function LeftSidebar() {
  const [selectedNav, setSelectedNav] = useState('Live Chat');

  return (
    <div className="w-60 bg-white/4 border-r border-white/8 backdrop-blur-xl flex flex-col">
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
                onClick={() => setSelectedNav(item.name)}
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
              <div key={i} className="p-3 rounded-lg bg-white/4 hover:bg-white/6 cursor-pointer">
                <div className="text-sm font-medium">Customer {i + 1}</div>
                <div className="text-xs text-white/60">2 hours ago</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Usage & User */}
      <div className="p-4 space-y-4">
        <div className="bg-white/4 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Usage</span>
          </div>
          <div className="text-xs text-white/60">1,234 / 10,000 messages</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
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