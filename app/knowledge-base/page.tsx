'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Trash2, Plus, BookOpen, Edit2, Check, X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function KnowledgeBasePage() {
  const { bots, activeBotId, kbEntries, kbFiles, loadKB, addKBEntry, updateKBEntry, deleteKBEntry, addKBFile, deleteKBFile } = useAppStore();

  const [selectedAgentId, setSelectedAgentId] = useState<string>(activeBotId);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    loadKB(selectedAgentId).finally(() => setLoading(false));
  }, [selectedAgentId]);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(txt|md|csv|pdf)$/i)) {
      toast.error('Only .txt, .md, .csv, and .pdf files are supported');
      return;
    }
    try {
      const content = await file.text();
      addKBFile({ name: file.name, size: file.size, content, type: file.type || 'text/plain' });
      toast.success(`"${file.name}" uploaded`);
    } catch {
      toast.error('Failed to read file');
    }
  }, [addKBFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(processFile);
    if (fileRef.current) fileRef.current.value = '';
  }, [processFile]);

  const handleAddEntry = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Both question and answer are required');
      return;
    }
    setSaving(true);
    const result = await addKBEntry({ question: question.trim(), answer: answer.trim(), agentId: selectedAgentId });
    setSaving(false);
    if (!result) { toast.error('Failed to save entry'); return; }
    setQuestion('');
    setAnswer('');
    toast.success('Entry added');
  };

  const startEdit = (id: string, q: string, a: string) => {
    setEditingId(id);
    setEditQ(q);
    setEditA(a);
  };

  const saveEdit = async (id: string) => {
    if (!editQ.trim() || !editA.trim()) return;
    await updateKBEntry(id, { question: editQ.trim(), answer: editA.trim() });
    setEditingId(null);
    toast.success('Entry updated');
  };

  const selectedAgent = bots.find((b) => b.id === selectedAgentId);
  const agentEntries = kbEntries.filter((e) => e.agentId === selectedAgentId);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <Badge variant="secondary">{agentEntries.length} entries · {kbFiles.length} files</Badge>
        </div>
      </div>

      {/* Agent selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Knowledge base for agent</p>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: bot.color }}
                        />
                        {bot.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedAgent && (
              <p className="text-xs text-muted-foreground">
                Entries here are injected into <strong>{selectedAgent.name}</strong>'s context automatically.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]' : 'border-border hover:border-[var(--color-accent)]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Drop files here or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">Supports .txt · .md · .csv · .pdf</p>
          </div>
          <input ref={fileRef} type="file" className="hidden" multiple accept=".txt,.md,.csv,.pdf" onChange={handleFileInput} />

          {kbFiles.length > 0 && (
            <div className="space-y-2">
              {kbFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { deleteKBFile(file.id); toast.success('File removed'); }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Q&A Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Q&amp;A Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do I reset my password?"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Answer</label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. Go to Settings → Security → Reset Password..."
              rows={3}
            />
          </div>
          <Button onClick={handleAddEntry} disabled={saving}>
            <Plus className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Add Entry'}
          </Button>
        </CardContent>
      </Card>

      {/* Q&A List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading entries…</div>
      ) : agentEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Q&amp;A Entries ({agentEntries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {agentEntries.map((entry) => (
                <AccordionItem key={entry.id} value={entry.id} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    {editingId === entry.id ? (
                      <Input
                        value={editQ}
                        onChange={(e) => setEditQ(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm h-7"
                      />
                    ) : (
                      <span className="text-left flex-1 pr-4">{entry.question}</span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {editingId === entry.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editA}
                          onChange={(e) => setEditA(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(entry.id)}>
                            <Check className="w-3.5 h-3.5 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{entry.answer}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry.id, entry.question, entry.answer)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => { await deleteKBEntry(entry.id); toast.success('Entry deleted'); }}>
                            <Trash2 className="w-3.5 h-3.5 mr-1 text-destructive" /> Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No Q&amp;A entries for <strong>{selectedAgent?.name}</strong> yet. Add one above.
        </div>
      )}
    </div>
  );
}
