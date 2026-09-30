'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import {
  MessageSquare, Clock, Star, CheckCircle, ThumbsUp, ThumbsDown,
  TrendingUp, BarChart3, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store';

const CHART_COLORS = ['#4F46E5', '#7C3AED', '#0891B2', '#DB2777', '#D97706'];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const { analytics, bots, conversations } = useAppStore();
  const avgResponseTime = useMemo(() => {
    if (!analytics.responseTimes.length) return '—';
    const avg = analytics.responseTimes.reduce((a, b) => a + b, 0) / analytics.responseTimes.length;
    return `${(avg / 1000).toFixed(1)}s`;
  }, [analytics.responseTimes]);

  const satisfactionScore = useMemo(() => {
    const { feedbacks } = analytics;
    if (!feedbacks.length) return null;
    const ups = feedbacks.filter((f) => f.type === 'up').length;
    return Math.round((ups / feedbacks.length) * 100);
  }, [analytics.feedbacks]);

  const topKeywords = useMemo(() => {
    return Object.entries(analytics.keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));
  }, [analytics.keywords]);

  const feedbackPieData = useMemo(() => {
    const ups = analytics.feedbacks.filter((f) => f.type === 'up').length;
    const downs = analytics.feedbacks.filter((f) => f.type === 'down').length;
    if (!ups && !downs) return [];
    return [
      { name: 'Positive', value: ups, fill: '#10B981' },
      { name: 'Negative', value: downs, fill: '#EF4444' },
    ];
  }, [analytics.feedbacks]);

  const totalConversations = conversations.length;
  const avgMsgsPerConversation = totalConversations
    ? (conversations.reduce((sum, c) => sum + c.messages.length, 0) / totalConversations).toFixed(1)
    : '0';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[var(--color-accent)]" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live metrics across all your agents</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Messages today"
          value={analytics.messagesToday}
          sub="resets at midnight"
          color="bg-[#4F46E5]"
        />
        <StatCard
          icon={TrendingUp}
          label="Total messages"
          value={analytics.totalMessages.toLocaleString()}
          sub="all time"
          color="bg-[#0891B2]"
        />
        <StatCard
          icon={Clock}
          label="Avg response"
          value={avgResponseTime}
          sub={analytics.responseTimes.length ? `${analytics.responseTimes.length} samples` : 'no data yet'}
          color="bg-[#7C3AED]"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved chats"
          value={analytics.resolvedChats}
          sub="thanked or solved"
          color="bg-green-500"
        />
        <StatCard
          icon={Star}
          label="CSAT score"
          value={satisfactionScore !== null ? `${satisfactionScore}%` : '—'}
          sub={analytics.feedbacks.length ? `${analytics.feedbacks.length} ratings` : 'no ratings yet'}
          color="bg-yellow-500"
        />
        <StatCard
          icon={Users}
          label="Conversations"
          value={totalConversations}
          sub={`~${avgMsgsPerConversation} msgs each`}
          color="bg-pink-500"
        />
        <StatCard
          icon={ThumbsUp}
          label="Positive feedback"
          value={analytics.feedbacks.filter((f) => f.type === 'up').length}
          sub="thumbs up"
          color="bg-emerald-500"
        />
        <StatCard
          icon={ThumbsDown}
          label="Negative feedback"
          value={analytics.feedbacks.filter((f) => f.type === 'down').length}
          sub="thumbs down"
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top topics chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Topics</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-12">
                Send messages to start seeing keyword analytics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topKeywords} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <XAxis dataKey="word" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [v as number, 'mentions']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {topKeywords.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Feedback pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feedback Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackPieData.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-12">
                No feedback collected yet. Users can rate messages with 👍 / 👎.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={feedbackPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={(props) => `${props.name ?? ''} ${Math.round((props.percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {feedbackPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v as number, 'ratings']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agents overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Agents Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {bots.map((bot) => {
              const botConvs = conversations.filter((c) => c.botId === bot.id);
              const botMsgs = botConvs.reduce((sum, c) => sum + c.messages.length, 0);
              return (
                <div key={bot.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: bot.color }}
                  >
                    {bot.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{bot.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{bot.tone} tone</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{botMsgs}</p>
                    <p className="text-xs text-muted-foreground">messages</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{botConvs.length}</p>
                    <p className="text-xs text-muted-foreground">convos</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent feedback */}
      {analytics.feedbacks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.feedbacks.slice(0, 10).map((fb) => (
              <div key={fb.messageId} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${fb.type === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {fb.type === 'up'
                    ? <ThumbsUp className="w-3 h-3 text-green-600" />
                    : <ThumbsDown className="w-3 h-3 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{fb.preview}</p>
                  <p className="text-xs text-muted-foreground">{new Date(fb.timestamp).toLocaleString()}</p>
                </div>
                <Badge variant={fb.type === 'up' ? 'secondary' : 'outline'} className="text-xs shrink-0">
                  {fb.type === 'up' ? 'Positive' : 'Negative'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
