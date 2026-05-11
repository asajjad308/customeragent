'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
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

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground">This section is coming soon.</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { theme } = useTheme();
  const [selectedNav, setSelectedNav] = useState('Live Chat');
  const [botName, setBotName] = useState('Aria');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Aria, a warm and efficient customer support assistant. Help users with their questions clearly and concisely. Always be empathetic. If you cannot resolve an issue, offer to connect them with a human agent.'
  );
  const [businessContext, setBusinessContext] = useState(
    'SaaS company. 14-day free trial. Cancel anytime. Support hours: 24/7 via chat, Mon-Fri 9-5 for calls.'
  );
  const [greeting, setGreeting] = useState('Hi! I\'m Aria 👋 What can I help you with today?');
  const [tone, setTone] = useState('friendly');

  const quickChips = ['Billing issue', 'Reset password', 'Upgrade plan', 'Talk to human'];

  const { messages, isTyping, currentResponse, sendMessage, resetChat } = useChat();

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
      <LeftSidebar selectedNav={selectedNav} onNavChange={setSelectedNav} />

      {selectedNav === 'Live Chat' ? (
        <>
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className={`h-16 ${themeClasses.sidebar} border-b flex items-center justify-between px-6`}>
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
                <Badge variant="secondary">{messages.length} messages</Badge>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ChatArea
              messages={messages}
              currentResponse={currentResponse}
              isTyping={isTyping}
              quickChips={quickChips}
              onQuickChipSelect={handleSendMessage}
            />

            <InputBar onSend={handleSendMessage} disabled={isTyping} />
          </div>

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
        </>
      ) : (
        <PlaceholderView title={selectedNav} />
      )}
    </div>
  );
}
