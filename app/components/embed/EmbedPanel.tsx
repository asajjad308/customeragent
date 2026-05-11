'use client';

import { useState } from 'react';
import { Copy, Check, Globe, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

const COLOR_OPTIONS = [
  '#6366F1', '#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#3B82F6',
];

export function EmbedPanel() {
  const { embedBotId, embedPosition, embedColor, setEmbedConfig, getActiveBot } = useAppStore();
  const bot = getActiveBot();

  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const embedCode = `<script>
  window.SupportAIConfig = {
    botId: "${embedBotId}",
    position: "${embedPosition}",
    primaryColor: "${embedColor}",
    greeting: "${bot.greeting.replace(/"/g, '\\"')}"
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" async></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Bot ID */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Your Bot ID</div>
          <div className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">
            {embedBotId}
          </div>
          <Badge variant="secondary" className="mt-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
            Active
          </Badge>
        </CardContent>
      </Card>

      {/* Embed code */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Embed Code</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          <pre className="bg-zinc-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          <Button onClick={handleCopy} size="sm" className="w-full" aria-label="Copy embed code">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </CardContent>
      </Card>

      {/* Widget customization */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Customization</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Position</label>
            <Select
              value={embedPosition}
              onValueChange={(v) => setEmbedConfig({ embedPosition: v as typeof embedPosition })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Primary Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  aria-label={`Select color ${color}`}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    embedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setEmbedConfig({ embedColor: color })}
                />
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowPreview(true)}
            aria-label="Open widget preview"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Widget
          </Button>
        </CardContent>
      </Card>

      {/* Preview modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Widget Preview</DialogTitle>
          </DialogHeader>
          <div className="relative bg-gray-100 rounded-lg h-64 overflow-hidden">
            {/* Fake website background */}
            <div className="p-4 space-y-2">
              <div className="h-3 bg-gray-300 rounded w-3/4" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            {/* Widget launcher */}
            <div
              className={`absolute bottom-4 ${
                embedPosition === 'bottom-right' ? 'right-4' : embedPosition === 'bottom-left' ? 'left-4' : 'left-1/2 -translate-x-1/2'
              }`}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white text-xl"
                style={{ backgroundColor: embedColor }}
              >
                💬
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            The chat widget will appear on your website at the selected position.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
