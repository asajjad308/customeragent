'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ThumbsUp, ThumbsDown, MessageSquare, Clock, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store';

export function AnalyticsPanel() {
  const analytics = useAppStore((s) => s.analytics);

  const avgResponseTime = useMemo(() => {
    if (!analytics.responseTimes.length) return 0;
    const avg = analytics.responseTimes.reduce((a, b) => a + b, 0) / analytics.responseTimes.length;
    return (avg / 1000).toFixed(1);
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
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
  }, [analytics.keywords]);

  const recentFeedbacks = useMemo(
    () => analytics.feedbacks.slice(0, 5),
    [analytics.feedbacks]
  );

  const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="text-2xl font-bold">{analytics.messagesToday}</div>
            <div className="text-xs text-muted-foreground">messages</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Avg time</span>
            </div>
            <div className="text-2xl font-bold">{avgResponseTime}s</div>
            <div className="text-xs text-muted-foreground">response</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">CSAT</span>
            </div>
            <div className="text-2xl font-bold">
              {satisfactionScore !== null ? `${satisfactionScore}%` : '—'}
            </div>
            <div className="text-xs text-muted-foreground">satisfaction</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Resolved</span>
            </div>
            <div className="text-2xl font-bold">{analytics.resolvedChats}</div>
            <div className="text-xs text-muted-foreground">chats</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions Chart */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Top Topics</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {topKeywords.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              Send messages to see keyword analytics
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={topKeywords} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="word" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [v, 'mentions']}
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

      {/* Recent Feedback */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {recentFeedbacks.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-2">
              No feedback yet
            </div>
          ) : (
            recentFeedbacks.map((fb) => (
              <div key={fb.messageId} className="flex items-start gap-2">
                {fb.type === 'up' ? (
                  <ThumbsUp className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <ThumbsDown className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{fb.preview}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(fb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
