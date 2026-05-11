'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bot, Zap, BarChart3, BookOpen, Puzzle, MessageSquare,
  Check, ArrowRight, Star, Shield, Globe, ChevronDown, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Pricing plans ────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out SupportAI.',
    color: 'border-border',
    badge: null,
    features: [
      '1 AI agent',
      '1,000 messages / month',
      'Basic analytics',
      'Embed widget',
      'Community support',
    ],
    cta: 'Get started free',
    ctaVariant: 'outline' as const,
    href: '/register',
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For growing teams that need more.',
    color: 'border-indigo-500',
    badge: 'Most Popular',
    features: [
      '5 AI agents',
      '10,000 messages / month',
      'Advanced analytics & CSAT',
      'Knowledge base (Q&A + files)',
      'Custom tone & branding',
      'Priority email support',
    ],
    cta: 'Start Pro trial',
    ctaVariant: 'default' as const,
    href: '/register?plan=pro',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large-scale deployments.',
    color: 'border-border',
    badge: null,
    features: [
      'Unlimited agents',
      'Unlimited messages',
      'Custom integrations',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'SSO / SAML support',
    ],
    cta: 'Contact sales',
    ctaVariant: 'outline' as const,
    href: 'mailto:sales@supportai.com',
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Bot,
    title: 'Multiple AI Agents',
    desc: 'Create distinct agents for sales, support, and onboarding — each with its own persona, tone, and knowledge.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    desc: 'Powered by LLaMA 3.3 70B via Groq. Answers stream in milliseconds, day or night.',
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    desc: 'Upload docs, FAQs, and policies. The agent automatically pulls the right context into every reply.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    desc: 'Track CSAT, response times, top topics, resolved chats, and feedback — all in real time.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Puzzle,
    title: 'Easy Embed',
    desc: 'Two lines of code to add the floating widget to any website. Works on any stack.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Shield,
    title: 'Scope Enforcement',
    desc: 'Agents stay on-topic. Off-scope questions are politely declined and redirected.',
    color: 'bg-rose-100 text-rose-600',
  },
];

const STEPS = [
  { n: '01', title: 'Create an agent', desc: 'Name it, set the tone, write a system prompt, and add your knowledge base.' },
  { n: '02', title: 'Copy the snippet', desc: 'Grab the two-line embed code from your agent card and paste it into any webpage.' },
  { n: '03', title: 'Go live', desc: 'Your widget is live. Visitors can chat instantly — no extra setup required.' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            SupportAI
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get started free
              </Button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3">
            <a href="#features" className="block text-sm text-slate-600" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-slate-600" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-sm text-slate-600" onClick={() => setMobileOpen(false)}>Pricing</a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign in</Button></Link>
              <Link href="/register" className="flex-1"><Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Get started</Button></Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <Badge className="mb-6 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50">
            <Zap className="w-3 h-3 mr-1" /> Powered by LLaMA 3.3 · Built for scale
          </Badge>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            AI customer support
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              that never sleeps
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy a fully-configured AI support agent on your website in minutes. Answers questions, stays on topic, and learns from your knowledge base — 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 gap-2">
                Get started free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8 gap-2">
                See how it works <ChevronDown className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <p className="mt-5 text-xs text-slate-400">No credit card required · Free plan forever · Setup in 5 minutes</p>
        </div>

        {/* Fake widget preview */}
        <div className="relative max-w-5xl mx-auto mt-20 px-5">
          <div className="rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white">
            <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center gap-2 px-4">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 text-xs text-slate-400">yourwebsite.com</span>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-8 min-h-[220px] relative">
              <div className="text-slate-300 text-sm">Your website content here…</div>
              {/* Floating widget mock */}
              <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-64 overflow-hidden">
                  <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">A</div>
                    <div>
                      <div className="text-white text-xs font-semibold">Aria</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-300 rounded-full" /><span className="text-white/70 text-xs">Online</span></div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="bg-slate-100 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-slate-700 max-w-[80%]">Hi! How can I help you today? 👋</div>
                    <div className="bg-indigo-600 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white ml-auto max-w-[80%]">What's your refund policy?</div>
                    <div className="bg-slate-100 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-slate-700 max-w-[90%]">We offer a full refund within 30 days of purchase, no questions asked.</div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to support customers</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From deployment to analytics, SupportAI covers the full lifecycle of AI-powered customer support.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white text-slate-600 border-slate-200 hover:bg-white">How it works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Live in 5 minutes</h2>
            <p className="text-slate-500">No engineering team required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px border-t-2 border-dashed border-slate-200 z-0" style={{ width: 'calc(100% - 3rem)', left: '4rem' }} />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {s.n}
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 mb-8">Start free. Upgrade when you grow. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!billingAnnual ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billingAnnual ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
              >
                Annual <span className="text-green-600 font-semibold">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => {
              const annualPrice = plan.price.startsWith('$')
                ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
                : plan.price;
              const displayPrice = billingAnnual && plan.price !== '$0' ? annualPrice : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`rounded-2xl border-2 p-6 flex flex-col relative ${plan.color} ${plan.badge ? 'shadow-xl' : ''}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold">{displayPrice}</span>
                      {plan.price !== 'Custom' && (
                        <span className="text-slate-400 text-sm mb-1">
                          {billingAnnual && plan.price !== '$0' ? '/ mo, billed annually' : `/ ${plan.period}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.badge ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <p className="text-sm text-slate-400 uppercase tracking-wider mb-8 font-medium">Trusted by teams worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {['AcmeCo', 'Globex Inc', 'Initech', 'Umbrella'].map((name) => (
              <div key={name} className="text-slate-300 font-bold text-xl">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to automate your support?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Join hundreds of businesses using SupportAI to handle customer questions instantly.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 font-semibold gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-indigo-300 text-sm">Free plan · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
              SupportAI
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-white transition-colors">Sign up</Link>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} SupportAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
