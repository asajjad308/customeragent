'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store';

interface ConversationListProps {
  onSelect: (id: string) => void;
  onNew: () => void;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ConversationList({ onSelect, onNew }: ConversationListProps) {
  const { conversations, activeConversationId, activeBotId, deleteConversation, markConversationViewed } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const botConvs = conversations.filter((c) => c.botId === activeBotId);
    if (!search.trim()) return botConvs;
    const q = search.toLowerCase();
    return botConvs.filter(
      (c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, activeBotId, search]);

  const handleSelect = (id: string) => {
    markConversationViewed(id);
    onSelect(id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversations</h3>
        <Button size="icon-xs" variant="ghost" onClick={onNew} aria-label="New conversation">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-7 h-7 text-xs"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 px-2">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
            {search ? 'No results' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isActive = conv.id === activeConversationId;
              const unread = !conv.isViewed;
              const initials = conv.title.slice(0, 2).toUpperCase() || '?';

              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive ? 'bg-accent' : 'hover:bg-muted/60'
                  }`}
                  onClick={() => handleSelect(conv.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open conversation: ${conv.title}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(conv.id)}
                >
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs truncate flex-1 ${unread ? 'font-semibold' : 'font-medium'}`}>
                        {conv.title}
                      </span>
                      {unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate">{lastMsg.content.slice(0, 35)}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">{timeAgo(conv.updatedAt)}</p>
                  </div>

                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 shrink-0 absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    aria-label={`Delete conversation: ${conv.title}`}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
