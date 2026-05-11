'use client';

import { useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';

interface ConversationsPageProps {
  onSelect: (id: string) => void;
}

export function ConversationsPage({ onSelect }: ConversationsPageProps) {
  const { bots, conversations } = useAppStore();
  const [selectedBotId, setSelectedBotId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = conversations
    .filter((c) => selectedBotId === 'all' || c.botId === selectedBotId)
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const countFor = (botId: string) =>
    botId === 'all'
      ? conversations.length
      : conversations.filter((c) => c.botId === botId).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
        <h1 className="text-2xl font-bold">Conversations</h1>

        {/* Agent filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedBotId('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedBotId === 'all'
                ? 'bg-foreground text-background border-foreground'
                : 'border-border hover:bg-muted'
            }`}
          >
            All
            <Badge variant="secondary" className="text-xs h-4 py-0 px-1.5">{countFor('all')}</Badge>
          </button>
          {bots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => setSelectedBotId(bot.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedBotId === bot.id
                  ? 'text-white border-transparent'
                  : 'border-border hover:bg-muted'
              }`}
              style={selectedBotId === bot.id ? { backgroundColor: bot.color, borderColor: bot.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedBotId === bot.id ? 'rgba(255,255,255,0.7)' : bot.color }}
              />
              {bot.name}
              <Badge
                variant="secondary"
                className="text-xs h-4 py-0 px-1.5"
                style={selectedBotId === bot.id ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' } : {}}
              >
                {countFor(bot.id)}
              </Badge>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No conversations found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try a different search term.' : 'Start chatting to see conversations here.'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const bot = bots.find((b) => b.id === conv.botId);
            const lastMsg = conv.messages[conv.messages.length - 1];
            const preview = lastMsg?.content?.slice(0, 100) ?? 'No messages yet';

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors flex items-start gap-3 group"
              >
                {/* Agent avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                  style={{ backgroundColor: bot?.color ?? '#6366F1' }}
                >
                  {(bot?.name ?? '?').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{conv.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{preview}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {bot && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: bot.color }}
                      >
                        {bot.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{conv.messages.length} messages</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
