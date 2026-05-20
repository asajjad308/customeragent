'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Copy, Plug } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { toast } from 'sonner';
import { PLATFORM_META, PLATFORMS, type Platform } from '@/lib/platforms';

interface PlatformConnection {
  id: string;
  platform: Platform;
  pageId: string | null;
  pageName: string | null;
  accessToken: string | null;
  webhookVerifyToken: string;
  connectedAt: string | null;
}

interface Props {
  agentId: string;
  currentPlatform: Platform;
}

function CopyField({ label, value }: { label: string; value: string }) {
  function copy() {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }
  return (
    <div>
      <p className="text-[10px] text-[var(--color-text-tertiary)] mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 text-[10px] bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] rounded-lg px-2 py-1.5 text-[var(--color-text-secondary)] truncate font-mono">
          {value}
        </code>
        <button
          onClick={copy}
          className="p-1.5 rounded-lg hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] transition-colors"
        >
          <Copy size={11} />
        </button>
      </div>
    </div>
  );
}

export function PlatformConnectionPanel({ agentId, currentPlatform }: Props) {
  const [conn, setConn] = useState<PlatformConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(currentPlatform);
  const [form, setForm] = useState({ pageId: '', pageName: '', accessToken: '' });

  const meta = PLATFORM_META[selectedPlatform];
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/meta`
    : '/api/webhooks/meta';

  useEffect(() => {
    fetch(`/api/agents/${agentId}/platform`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) {
          setConn(d);
          setSelectedPlatform(d.platform);
          setForm({
            pageId:      d.pageId      ?? '',
            pageName:    d.pageName    ?? '',
            accessToken: d.accessToken ?? '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [agentId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/platform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedPlatform, ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        setConn(data);
        toast.success('Platform connection saved');
      } else {
        toast.error(data.error ?? 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    await fetch(`/api/agents/${agentId}/platform`, { method: 'DELETE' });
    setConn(null);
    setForm({ pageId: '', pageName: '', accessToken: '' });
    setSelectedPlatform('WEBSITE');
    toast.success('Disconnected');
  }

  if (loading) {
    return <div className="h-20 rounded-xl bg-[var(--color-bg-subtle)] animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      {/* Platform picker */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2">Platform</p>
        <div className="grid grid-cols-3 gap-1.5">
          {PLATFORMS.map((p) => {
            const pm = PLATFORM_META[p];
            const active = selectedPlatform === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all ${
                  active
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] bg-[var(--surface-0)]'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: pm.color }}
                >
                  {pm.shortName}
                </span>
                <span className="text-[9px] text-[var(--color-text-secondary)] font-medium leading-tight">
                  {pm.label}
                  {pm.comingSoon && <span className="block text-[8px] text-[var(--color-text-tertiary)]">Soon</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Website: just redirect to Embed tab */}
      {selectedPlatform === 'WEBSITE' && (
        <div className="p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            Website agents use the embeddable widget. See the <strong>Embed</strong> tab for the installation code.
          </p>
        </div>
      )}

      {/* Coming soon platforms */}
      {meta.comingSoon && (
        <div className="p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]">
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            <strong>{meta.label}</strong> integration is coming soon. Supported now: Facebook, Instagram, WhatsApp.
          </p>
        </div>
      )}

      {/* Meta platforms (FB / IG / WA) */}
      {meta.usesMetaWebhook && !meta.comingSoon && (
        <>
          {/* Connection status */}
          {conn?.connectedAt ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC]">
              <CheckCircle2 size={13} className="text-[#16A34A] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-[#16A34A]">{meta.label} connected</div>
                {conn.pageName && (
                  <div className="text-[10px] text-[#4B7C59] mt-0.5">{conn.pageName}</div>
                )}
              </div>
              <button
                onClick={disconnect}
                className="text-[10px] text-[#16A34A] hover:text-red-600 underline underline-offset-2 flex-shrink-0 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)]">
              <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
              <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
                {meta.label} not connected
              </span>
            </div>
          )}

          {/* Webhook setup */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Webhook Setup</p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
              In your Meta App Dashboard → Webhooks, configure these values:
            </p>
            <CopyField label="Callback URL" value={webhookUrl} />
            {conn?.webhookVerifyToken && (
              <CopyField label="Verify Token" value={conn.webhookVerifyToken} />
            )}
            {!conn && (
              <p className="text-[10px] text-amber-600">
                Save the connection below to generate your unique verify token.
              </p>
            )}
          </div>

          {/* Connection form */}
          <div className="space-y-2 pt-1 border-t border-[var(--color-border-subtle)]">
            <p className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Connection Details</p>

            <div>
              <label className="text-[10px] text-[var(--color-text-tertiary)]">{meta.idLabel}</label>
              <input
                value={form.pageId}
                onChange={(e) => setForm((f) => ({ ...f, pageId: e.target.value }))}
                placeholder={selectedPlatform === 'WHATSAPP' ? '1234567890' : '987654321'}
                className="w-full mt-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-text-tertiary)]">Page Access Token</label>
              <input
                type="password"
                value={form.accessToken}
                onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                placeholder="EAAxxxxxx..."
                className="w-full mt-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--color-text-tertiary)]">Display Name (optional)</label>
              <input
                value={form.pageName}
                onChange={(e) => setForm((f) => ({ ...f, pageName: e.target.value }))}
                placeholder="My Facebook Page"
                className="w-full mt-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-0)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>

            <Button
              variant="primary"
              size="xs"
              fullWidth
              iconLeft={<Plug size={11} />}
              onClick={save}
              disabled={saving || !form.pageId || !form.accessToken}
            >
              {saving ? 'Saving…' : conn?.connectedAt ? 'Update Connection' : `Connect ${meta.label}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
