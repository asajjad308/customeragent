'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { RightPanel } from '@/components/sidebar/RightPanel';
import { ChatArea } from '@/components/chat/ChatArea';
import { InputBar } from '@/components/chat/InputBar';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/hooks/useTheme';
import { themes } from '@/lib/themes';

export default function Home() {
  const { theme } = useTheme();
  const [botName, setBotName] = useState('Aria');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Aria, a warm and efficient customer support assistant. Help users with their questions clearly and concisely. Always be empathetic. If you cannot resolve an issue, offer to connect them with a human agent.'
  );
  const [businessContext, setBusinessContext] = useState(
    'SaaS company. 14-day free trial. Cancel anytime. Support hours: 24/7 via chat, Mon-Fri 9-5 for calls.'
  );
  const [greeting, setGreeting] = useState('Hi! I\'m Aria 👋 What can I help you with today?');
  const [tone, setTone] = useState('friendly');

  const quickChips = [
    'Billing issue',
    'Reset password',
    'Upgrade plan',
    'Talk to human',
  ];

  const { messages, isTyping, currentResponse, sendMessage, resetChat } = useChat();

  // Initialize with greeting
  useEffect(() => {
    resetChat(greeting);
  }, [greeting, resetChat]);

  const handleSendMessage = (content: string) => {
    const fullPrompt = `${systemPrompt}\n\nBusiness Context: ${businessContext}\nTone: ${tone}`;
    sendMessage(content, fullPrompt);
  };

  const themeClasses = themes[theme];

  return (
    <div className={`h-screen flex ${themeClasses.background}`}>
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className={`h-16 ${themeClasses.sidebar} border-b ${themeClasses.sidebarBorder} backdrop-blur-xl flex items-center justify-between px-6`}>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-indigo-500 text-white">
                {botName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{botName}</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {messages.length} messages
            </Badge>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <ChatArea
          messages={messages}
          currentResponse={currentResponse}
          isTyping={isTyping}
          quickChips={quickChips}
          onQuickChipSelect={handleSendMessage}
        />

        {/* Input Bar */}
        <InputBar onSend={handleSendMessage} disabled={isTyping} />
      </div>

      {/* Right Panel */}
      <RightPanel
        botName={botName}
        setBotName={setBotName}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        businessContext={businessContext}
        setBusinessContext={setBusinessContext}
        greeting={greeting}
        setGreeting={setGreeting}
        tone={tone}
        setTone={setTone}
        resetChat={resetChat}
      />
    </div>
  );
}
