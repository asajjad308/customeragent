'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Menu, BarChart3, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { RightPanel } from '@/components/sidebar/RightPanel';
import { ChatArea } from '@/components/chat/ChatArea';
import { InputBar } from '@/components/chat/InputBar';
import { HumanTakeoverBar, useHumanTakeover } from '@/components/chat/HumanTakeover';
import { themes } from '@/lib/themes';
import { useAppStore } from '@/store';
import { useChat } from '@/hooks/useChat';
import KnowledgeBasePage from '@/app/knowledge-base/page';
import IntegrationsPage from '@/app/integrations/page';
import SettingsPage from '@/app/settings/page';

const QUICK_CHIPS = ['Billing issue', 'Reset password', 'Upgrade plan', 'Talk to human'];

export default function DashboardPage() {
  const {
    theme,
    getActiveBot,
    activeBotId,
    createConversation,
    activeConversationId,
    setActiveConversation,
    conversations,
    loadAgents,
    loadConversations,
    bots,
    isLoadingAgents,
    completeOnboarding,
  } = useAppStore();

  const [selectedNav, setSelectedNav] = useState('Live Chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { state: takeoverState, trigger: triggerTakeover, end: endTakeover } = useHumanTakeover();

  // Load agents from DB on mount
  useEffect(() => {
    loadAgents().then(() => {
      setInitialized(true);
    });
  }, []);

  // Once agents load, mark onboarding complete (they have a DB account)
  useEffect(() => {
    if (bots.length > 0) {
      completeOnboarding();
    }
  }, [bots.length]);

  const bot = getActiveBot();

  // Ensure there's always an active conversation for the current bot
  useEffect(() => {
    if (!initialized || !activeBotId) return;
    const botConvs = conversations.filter((c) => c.botId === activeBotId);
    if (botConvs.length === 0 || !activeConversationId || !botConvs.find((c) => c.id === activeConversationId)) {
      if (botConvs.length > 0) {
        setActiveConversation(botConvs[0].id);
      } else {
        createConversation(activeBotId);
      }
    }
  }, [activeBotId, initialized]);

  const { messages, isTyping, currentResponse, sendMessage, giveFeedback } = useChat(activeConversationId);

  // Seed greeting if conversation is empty
  useEffect(() => {
    if (activeConversationId && messages.length === 0 && bot.greeting) {
      const { addMessage } = useAppStore.getState();
      addMessage(activeConversationId, {
        role: 'assistant',
        content: bot.greeting,
        timestamp: Date.now(),
      });
    }
  }, [activeConversationId, bot.greeting]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId) return;

      if (content.toLowerCase().includes('talk to human') || content.toLowerCase().includes('human agent')) {
        sendMessage(content, buildPrompt());
        const transcript = messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n');
        triggerTakeover(transcript);
        return;
      }

      if (content.toLowerCase().includes('thank') || content.toLowerCase().includes('solved') || content.toLowerCase().includes('resolved')) {
        useAppStore.getState().trackResolved();
      }

      sendMessage(content, buildPrompt());
    },
    [activeConversationId, messages, sendMessage, triggerTakeover, bot]
  );

  function buildPrompt() {
    return `${bot.systemPrompt}\n\nBusiness Context: ${bot.businessContext}\nTone: ${bot.tone}`;
  }

  const handleNewConversation = () => {
    createConversation(activeBotId);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (id: string) => {
    setActiveConversation(id);
    setSidebarOpen(false);
  };

  const handleNavChange = (nav: string) => {
    setSelectedNav(nav);
    setSidebarOpen(false);
  };

  const themeClasses = themes[theme];

  const sidebarContent = (
    <LeftSidebar
      selectedNav={selectedNav}
      onNavChange={handleNavChange}
      onConversationSelect={handleConversationSelect}
      onNewConversation={handleNewConversation}
    />
  );

  if (!initialized || isLoadingAgents) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const mainContent = () => {
    switch (selectedNav) {
      case 'Knowledge Base': return <KnowledgeBasePage />;
      case 'Integrations': return <IntegrationsPage />;
      case 'Settings': return <SettingsPage />;
      case 'Analytics':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-2">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <h2 className="text-xl font-semibold">Analytics</h2>
              <p className="text-muted-foreground text-sm">View analytics in the right panel → Analytics tab.</p>
            </div>
          </div>
        );
      case 'Conversations':
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">All Conversations</h1>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign out
              </Button>
            </div>
            {conversations.length === 0 ? (
              <p className="text-muted-foreground">No conversations yet. Start chatting!</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveConversation(c.id); setSelectedNav('Live Chat'); }}
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.messages.length} messages · {new Date(c.updatedAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <>
            {/* Chat column */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top bar */}
              <div className={`h-14 ${themeClasses.sidebar} border-b flex items-center justify-between px-4 shrink-0`}>
                <div className="flex items-center gap-3">
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-60">
                      {sidebarContent}
                    </SheetContent>
                  </Sheet>

                  <Avatar className="w-8 h-8">
                    <AvatarFallback style={{ backgroundColor: bot.color }} className="text-white text-sm font-semibold">
                      {bot.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-semibold text-sm">{bot.name}</h1>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">{messages.length} msgs</Badge>
                  <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out" className="hidden md:flex">
                    <LogOut className="w-4 h-4" />
                  </Button>
                  <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open settings panel">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-80">
                      <RightPanel />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Human takeover bar */}
              <HumanTakeoverBar state={takeoverState} onEnd={endTakeover} />

              {/* Chat messages */}
              <ChatArea
                messages={messages}
                currentResponse={currentResponse}
                isTyping={isTyping}
                quickChips={QUICK_CHIPS}
                onQuickChipSelect={handleSendMessage}
                onFeedback={giveFeedback}
                takeoverState={takeoverState}
              />

              {/* Input */}
              <InputBar onSend={handleSendMessage} disabled={isTyping} />
            </div>

            {/* Right panel — hidden on mobile/tablet, shown on lg+ */}
            <div className="hidden lg:flex">
              <RightPanel />
            </div>
          </>
        );
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden ${themeClasses.background}`}>
      {/* Left sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex">
        {sidebarContent}
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {mainContent()}
      </div>
    </div>
  );
}
