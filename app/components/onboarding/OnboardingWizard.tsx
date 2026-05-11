'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Palette, FileText, Code, ArrowRight, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppStore } from '@/store';

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#3B82F6'];

const BUSINESS_PROMPTS: Record<string, string> = {
  ecommerce: 'You are a helpful e-commerce support assistant. Help customers with orders, returns, shipping, and product questions. Be friendly and solution-focused.',
  saas: 'You are a SaaS product support assistant. Help users with account setup, billing, features, and technical issues. Be clear and empathetic.',
  agency: 'You are a client services assistant for a digital agency. Help clients with project updates, deliverables, and general inquiries. Be professional.',
  healthcare: 'You are a patient services assistant. Help patients with appointment scheduling, general health information, and clinic policies. Be compassionate and clear. Always recommend consulting a doctor for medical advice.',
  education: 'You are a student support assistant. Help students with course information, enrollment, deadlines, and academic resources. Be encouraging and helpful.',
  other: 'You are a helpful customer support assistant. Assist users with their questions clearly and concisely. Always be empathetic.',
};

export function OnboardingWizard() {
  const { isOnboardingComplete, completeOnboarding, updateBot, getActiveBot, embedBotId } = useAppStore();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [botName, setBotName] = useState('Aria');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [businessType, setBusinessType] = useState('saas');
  const [businessContext, setBusinessContext] = useState('');
  const [copied, setCopied] = useState(false);

  // Wait for Zustand store to rehydrate from localStorage before rendering
  useEffect(() => { setHydrated(true); }, []);

  // All hooks must be called before any conditional returns
  if (!hydrated || isOnboardingComplete) return null;

  const embedCode = `<script>
  window.SupportAIConfig = {
    botId: "${embedBotId}",
    position: "bottom-right",
    primaryColor: "${color}",
    greeting: "Hi! I'm ${botName} 👋 How can I help?"
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/embed.js" async></script>`;

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    updateBot(getActiveBot().id, {
      name: botName,
      color,
      systemPrompt: BUSINESS_PROMPTS[businessType],
      businessContext,
      greeting: `Hi! I'm ${botName} 👋 What can I help you with today?`,
    });
    completeOnboarding();
    toast.success(`Welcome to SupportAI! Your bot "${botName}" is ready.`);
  };

  const steps = [
    { num: 1, icon: <Bot className="w-5 h-5" />, label: 'Welcome' },
    { num: 2, icon: <Palette className="w-5 h-5" />, label: 'Bot Setup' },
    { num: 3, icon: <FileText className="w-5 h-5" />, label: 'Context' },
    { num: 4, icon: <Code className="w-5 h-5" />, label: 'Embed' },
  ];

  return (
    <Dialog open={!isOnboardingComplete} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.num ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {s.num}
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 ${step > s.num ? 'bg-indigo-500' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">👋</div>
                <h2 className="text-2xl font-bold">Welcome to SupportAI</h2>
                <p className="text-muted-foreground">Let's set up your first bot in 3 quick steps.</p>
                <Button className="w-full" onClick={() => setStep(2)} aria-label="Get started">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Set Up Your Bot</h2>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Bot Name</label>
                  <Input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="e.g. Aria, Max, Lily" aria-label="Bot name" />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Avatar Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={`Select color ${c}`} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Business Type</label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger aria-label="Business type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                  <strong>System prompt preview:</strong><br />
                  {BUSINESS_PROMPTS[businessType].slice(0, 100)}...
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" aria-label="Back">Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1" disabled={!botName.trim()} aria-label="Next step">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Add Business Context</h2>
                <p className="text-sm text-muted-foreground">What should your bot know? Products, policies, FAQs...</p>
                <div className="grid gap-1.5">
                  <Textarea
                    value={businessContext}
                    onChange={(e) => setBusinessContext(e.target.value.slice(0, 2000))}
                    placeholder="e.g. We sell premium coffee online. Free shipping over $50. Returns accepted within 30 days..."
                    rows={5}
                    aria-label="Business context"
                  />
                  <div className="text-xs text-muted-foreground text-right">{businessContext.length} / 2000</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1" aria-label="Back">Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1" aria-label="Next step">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Get Your Embed Code</h2>
                <p className="text-sm text-muted-foreground">Paste this on any website to add the chat widget.</p>
                <pre className="bg-zinc-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
                <Button variant="outline" onClick={handleCopyEmbed} className="w-full" aria-label="Copy embed code">
                  {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Embed Code</>}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1" aria-label="Back">Back</Button>
                  <Button onClick={handleFinish} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white" aria-label="Open dashboard">
                    Open Dashboard 🚀
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
