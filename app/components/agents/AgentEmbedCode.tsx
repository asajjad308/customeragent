'use client';

import { useState } from 'react';
import { Check, Copy, Code2, Globe } from 'lucide-react';
import { Button } from '@/components/ds/Button';
import { Tabs } from '@/components/ds/Tabs';
import type { Agent } from '@/store/agentsStore';

interface AgentEmbedCodeProps {
  agent: Agent;
}

const TABS = [
  { id: 'script', label: 'Script Tag' },
  { id: 'iframe', label: 'iFrame' },
  { id: 'react', label: 'React' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="xs" onClick={copy} iconLeft={copied ? <Check size={11} /> : <Copy size={11} />}>
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

export function AgentEmbedCode({ agent }: AgentEmbedCodeProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const scriptCode = `<!-- SupportAI Widget -->
<script>
  window.SupportAIConfig = {
    agentId: "${agent.id}",
    theme: "${agent.widgetTheme ?? 'SOFT_AURORA'}",
    position: "bottom-right"
  };
</script>
<script src="${origin}/widget.js" async></script>`;

  const iframeCode = `<iframe
  src="${origin}/embed/${agent.id}"
  width="400"
  height="600"
  frameborder="0"
  allow="microphone"
  title="${agent.name} Chat"
></iframe>`;

  const reactCode = `import { SupportAIWidget } from '@supportai/react';

export default function App() {
  return (
    <SupportAIWidget
      agentId="${agent.id}"
      theme="${agent.widgetTheme ?? 'SOFT_AURORA'}"
      position="bottom-right"
    />
  );
}`;

  const codeMap: Record<string, string> = {
    script: scriptCode,
    iframe: iframeCode,
    react: reactCode,
  };

  return (
    <Tabs tabs={TABS}>
      {(activeTab) => (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <CopyButton text={codeMap[activeTab]} />
          </div>
          <pre className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-xl p-4 text-[11px] font-mono text-[var(--color-text-secondary)] overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {codeMap[activeTab]}
          </pre>
        </div>
      )}
    </Tabs>
  );
}
