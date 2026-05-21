'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Bot,
  MessageSquare,
  Ban,
  CheckCircle,
  ChevronDown,
  X,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Database,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

interface AgentRow {
  id: string;
  name: string;
  status: string;
  messageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  subscriptionStatus: string;
  suspended: boolean;
  createdAt: string;
  stripeCustomerId: string | null;
  messagesThisMonth: number;
  _count: {
    agents: number;
    users: number;
    knowledgeBase: number;
    conversations: number;
  };
  users: UserRow[];
  agents: AgentRow[];
}

interface Stats {
  totalTenants: number;
  paidTenants: number;
  freeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalAgents: number;
  totalMessagesThisMonth: number;
  totalConversations: number;
  revenueEstimate: number;
}

const PLAN_OPTIONS = ['free', 'pro', 'enterprise'];

function planBadgeClass(plan: string) {
  if (plan === 'pro') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
  if (plan === 'enterprise') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

function statusBadgeClass(status: string) {
  if (status === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'trialing') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (status === 'past_due') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
}

function agentStatusBadgeClass(status: string) {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'PAUSED') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
  if (status === 'DRAFT') return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  if (status === 'ARCHIVED') return 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400';
  return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
}

function roleBadgeClass(role: string) {
  if (role === 'owner') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
  if (role === 'admin') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded bg-muted animate-pulse w-20" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [userSearch, setUserSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<TenantRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/tenants'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(tenantId: string, updates: Partial<{ plan: string; suspended: boolean }>) {
    const res = await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, ...updated } : t))
      );
      if (selectedTenant?.id === tenantId) {
        setSelectedTenant((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      toast.success('Updated successfully');
    } else {
      toast.error('Failed to update');
    }
  }

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || t.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const allUsers: (UserRow & { tenantName: string })[] = tenants.flatMap((t) =>
    t.users.map((u) => ({ ...u, tenantName: t.name }))
  );

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statCards = stats
    ? [
        { label: 'Total Tenants', value: stats.totalTenants, icon: <Database className="w-4 h-4 text-indigo-500" /> },
        { label: 'Paid', value: stats.paidTenants, icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
        { label: 'Free', value: stats.freeTenants, icon: <TrendingUp className="w-4 h-4 text-sky-500" /> },
        { label: 'Suspended', value: stats.suspendedTenants, icon: <Ban className="w-4 h-4 text-red-500" /> },
        { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-4 h-4 text-violet-500" /> },
        { label: 'Total Agents', value: stats.totalAgents, icon: <Bot className="w-4 h-4 text-amber-500" /> },
        { label: 'Msgs This Month', value: stats.totalMessagesThisMonth.toLocaleString(), icon: <MessageSquare className="w-4 h-4 text-teal-500" /> },
        { label: 'Est. Revenue', value: `$${stats.revenueEstimate.toLocaleString()}`, icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            <h1 className="text-lg font-semibold tracking-tight">Super Admin</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {loading && !stats
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2 animate-pulse">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-6 w-10 bg-muted rounded" />
                </div>
              ))
            : statCards.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    {s.icon}
                    <span className="truncate">{s.label}</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">{s.value}</div>
                </div>
              ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(['tenants', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'tenants' ? `Tenants (${tenants.length})` : `Users (${allUsers.length})`}
            </button>
          ))}
        </div>

        {/* Tenants tab */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
              />
              <div className="flex gap-1">
                {(['all', 'free', 'pro', 'enterprise'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlanFilter(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors border ${
                      planFilter === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-input text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenants table */}
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['Tenant', 'Plan', 'Status', 'Users', 'Agents', 'Conversations', 'Msgs/mo', 'Joined', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-muted-foreground font-medium whitespace-nowrap text-xs uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows cols={9} />
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No tenants found.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTenant(t)}
                        className={`border-t border-border transition-colors hover:bg-muted/30 cursor-pointer ${
                          t.suspended ? 'opacity-60' : ''
                        } ${selectedTenant?.id === t.id ? 'bg-muted/40' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.email}</div>
                          <div className="text-xs text-muted-foreground/60 font-mono">{t.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="relative inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={t.plan}
                              onChange={(e) => patch(t.id, { plan: e.target.value })}
                              className="appearance-none text-xs font-medium px-2 py-1 pr-6 rounded-md border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              {PLAN_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(
                              t.subscriptionStatus
                            )}`}
                          >
                            {t.subscriptionStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {t._count.users}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3 text-muted-foreground" />
                            {t._count.agents}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{t._count.conversations.toLocaleString()}</td>
                        <td className="px-4 py-3 tabular-nums">{t.messagesThisMonth.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => patch(t.id, { suspended: !t.suspended })}
                            className={`text-xs px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                              t.suspended
                                ? 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                                : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
                            }`}
                          >
                            {t.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['Name', 'Email', 'Role', 'Tenant', 'Verified', 'Last Login', 'Joined'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-muted-foreground font-medium whitespace-nowrap text-xs uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows cols={7} />
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.tenantName}</td>
                        <td className="px-4 py-3">
                          {u.emailVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedTenant && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 backdrop-blur-sm"
            onClick={() => setSelectedTenant(null)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border z-40 overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold truncate">{selectedTenant.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planBadgeClass(selectedTenant.plan)}`}>
                    {selectedTenant.plan}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(selectedTenant.subscriptionStatus)}`}>
                    {selectedTenant.subscriptionStatus}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedTenant.email}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Joined {new Date(selectedTenant.createdAt).toLocaleDateString()}
                  {selectedTenant.stripeCustomerId && (
                    <span className="ml-2 font-mono">{selectedTenant.stripeCustomerId}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Counts summary */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Database className="w-3 h-3" />Knowledge Base
                </div>
                <div className="text-xl font-bold mt-1">{selectedTenant._count.knowledgeBase}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" />Conversations
                </div>
                <div className="text-xl font-bold mt-1">{selectedTenant._count.conversations.toLocaleString()}</div>
              </div>
            </div>

            <div className="px-6 space-y-6 pb-8">
              {/* Users section */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Users ({selectedTenant.users.length})
                </h3>
                {selectedTenant.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border border-border rounded-lg">
                    No users yet.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {['Name / Email', 'Role', 'Verified', 'Last Login'].map((h) => (
                            <th key={h} className="text-left px-3 py-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTenant.users.map((u) => (
                          <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                            <td className="px-3 py-2">
                              <div className="font-medium text-xs">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeClass(u.role)}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {u.emailVerified ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Agents section */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-500" />
                  Agents ({selectedTenant.agents.length})
                </h3>
                {selectedTenant.agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border border-border rounded-lg">
                    No agents yet.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {['Name', 'Status', 'Messages', 'Active', 'Created'].map((h) => (
                            <th key={h} className="text-left px-3 py-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTenant.agents.map((a) => (
                          <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium text-xs">{a.name}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agentStatusBadgeClass(a.status)}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 tabular-nums text-xs">{a.messageCount.toLocaleString()}</td>
                            <td className="px-3 py-2">
                              {a.isActive ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-muted-foreground/40" />
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
