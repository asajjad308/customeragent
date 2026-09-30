'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, Bot, MessageSquare, Ban, CheckCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface TenantRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  subscriptionStatus: string;
  suspended: boolean;
  createdAt: string;
  messagesThisMonth: number;
  _count: { agents: number; users: number };
}

const PLAN_OPTIONS = ['free', 'pro', 'enterprise'];

export default function AdminPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) setTenants(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function patch(tenantId: string, updates: Partial<{ plan: string; suspended: boolean }>) {
    const res = await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTenants((prev) => prev.map((t) => t.id === tenantId ? { ...t, ...updated } : t));
      toast.success('Updated');
    } else {
      toast.error('Failed to update');
    }
  }

  const filtered = tenants.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: tenants.length,
    paid: tenants.filter((t) => t.plan !== 'free').length,
    suspended: tenants.filter((t) => t.suspended).length,
    messages: tenants.reduce((s, t) => s + t.messagesThisMonth, 0),
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: stats.total, icon: <Users className="w-4 h-4" /> },
          { label: 'Paid Tenants', value: stats.paid, icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
          { label: 'Suspended', value: stats.suspended, icon: <Ban className="w-4 h-4 text-red-500" /> },
          { label: 'Msgs This Month', value: stats.messages.toLocaleString(), icon: <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">{s.icon}{s.label}</div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full max-w-sm px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {['Tenant', 'Plan', 'Sub Status', 'Agents', 'Users', 'Msgs/mo', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted animate-pulse w-20" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map((t) => (
              <tr key={t.id} className={`border-t transition-colors hover:bg-muted/30 ${t.suspended ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <select
                      value={t.plan}
                      onChange={(e) => patch(t.id, { plan: e.target.value })}
                      className="appearance-none text-xs font-medium px-2 py-1 pr-6 rounded-md border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' :
                    t.subscriptionStatus === 'trialing' ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]' :
                    t.subscriptionStatus === 'past_due' ? 'bg-red-100 text-red-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {t.subscriptionStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3" />{t._count.agents}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t._count.users}</span>
                </td>
                <td className="px-4 py-3">{t.messagesThisMonth.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => patch(t.id, { suspended: !t.suspended })}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      t.suspended
                        ? 'border-green-300 text-green-700 hover:bg-green-50'
                        : 'border-red-300 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {t.suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No tenants found.</div>
        )}
      </div>
    </div>
  );
}
