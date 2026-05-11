'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Plus, BookOpen, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
}

export default function KnowledgeBasePage() {
  const { kbEntries, kbFiles, addKBEntry, updateKBEntry, deleteKBEntry, addKBFile, deleteKBFile } = useAppStore();

  const [dragging, setDragging] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const allowedTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/pdf'];
    if (!allowedTypes.some((t) => file.type.startsWith(t.split('/')[0]) || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.pdf'))) {
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

  const handleAddEntry = () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Both question and answer are required');
      return;
    }
    addKBEntry({ question: question.trim(), answer: answer.trim() });
    setQuestion('');
    setAnswer('');
    toast.success('Entry added');
  };

  const startEdit = (id: string, q: string, a: string) => {
    setEditingId(id);
    setEditQ(q);
    setEditA(a);
  };

  const saveEdit = (id: string) => {
    if (!editQ.trim() || !editA.trim()) return;
    updateKBEntry(id, { question: editQ.trim(), answer: editA.trim() });
    setEditingId(null);
    toast.success('Entry updated');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-indigo-500" />
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <Badge variant="secondary">{kbEntries.length} entries · {kbFiles.length} files</Badge>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragging ? 'border-indigo-500 bg-indigo-50' : 'border-border hover:border-indigo-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            aria-label="Upload files"
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
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(file.size)} · {formatDate(file.uploadedAt)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => { deleteKBFile(file.id); toast.success('File removed'); }}
                    aria-label={`Delete ${file.name}`}
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
          <CardTitle className="text-base">Add Q&A Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Question</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do I reset my password?"
              aria-label="Question"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Answer</label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. Go to Settings → Security → Reset Password..."
              rows={3}
              aria-label="Answer"
            />
          </div>
          <Button onClick={handleAddEntry} aria-label="Add Q&A entry">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </CardContent>
      </Card>

      {/* Q&A List */}
      {kbEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Q&A Entries ({kbEntries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {kbEntries.map((entry) => (
                <AccordionItem key={entry.id} value={entry.id} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    {editingId === entry.id ? (
                      <Input
                        value={editQ}
                        onChange={(e) => setEditQ(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm h-7"
                        aria-label="Edit question"
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
                          aria-label="Edit answer"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(entry.id)} aria-label="Save entry">
                            <Check className="w-3.5 h-3.5 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel edit">
                            <X className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{entry.answer}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry.id, entry.question, entry.answer)} aria-label="Edit entry">
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { deleteKBEntry(entry.id); toast.success('Entry deleted'); }} aria-label="Delete entry">
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
      )}
    </div>
  );
}
