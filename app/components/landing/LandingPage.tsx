'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bot, Zap, BarChart3, BookOpen, Puzzle, MessageSquare,
  Check, ArrowRight, Shield, ChevronDown, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    color: 'border-primary',
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
    color: 'bg-[#ECEEFF] text-[#4F46E5] dark:bg-[#1F2852] dark:text-[#A5B4FC]',
  },
  {
    icon: Zap,
    title: 'Instant Responses',
    desc: 'Powered by LLaMA 3.3 70B via Groq. Answers stream in milliseconds, day or night.',
    color: 'bg-[#F3EEFF] text-[#6D28D9] dark:bg-[#2A1F52] dark:text-[#C4B5FD]',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    desc: 'Upload docs, FAQs, and policies. The agent automatically pulls the right context into every reply.',
    color: 'bg-[#E6FAFD] text-[#0E7490] dark:bg-[#0E2A36] dark:text-[#67E8F9]',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    desc: 'Track CSAT, response times, top topics, resolved chats, and feedback — all in real time.',
    color: 'bg-[#ECEEFF] text-[#4338CA] dark:bg-[#1F2852] dark:text-[#A5B4FC]',
  },
  {
    icon: Puzzle,
    title: 'Easy Embed',
    desc: 'Two lines of code to add the floating widget to any website. Works on any stack.',
    color: 'bg-[#F3EEFF] text-[#7C3AED] dark:bg-[#2A1F52] dark:text-[#C4B5FD]',
  },
  {
    icon: Shield,
    title: 'Scope Enforcement',
    desc: 'Agents stay on-topic. Off-scope questions are politely declined and redirected.',
    color: 'bg-[#E6FAFD] text-[#0E7490] dark:bg-[#0E2A36] dark:text-[#67E8F9]',
  },
];

const STEPS = [
  { n: '01', title: 'Create an agent', desc: 'Name it, set the tone, write a system prompt, and add your knowledge base.' },
  { n: '02', title: 'Copy the snippet', desc: 'Grab the two-line embed code from your agent card and paste it into any webpage.' },
  { n: '03', title: 'Go live', desc: 'Your widget is live. Visitors can chat instantly — no extra setup required.' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div className={`brand-mark rounded-lg flex items-center justify-center shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] ${size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'}`}>
      <MessageSquare className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full border border-border bg-card text-[12px] font-medium text-brand-text">
      {children}
    </span>
  );
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans text-[15px]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display font-semibold text-lg tracking-tight">
            <BrandMark />
            SupportAI
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-5 py-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Pricing</a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign in</Button></Link>
              <Link href="/register" className="flex-1"><Button size="sm" className="w-full">Get started</Button></Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        <div aria-hidden="true" className="aurora-glow" />

        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <Eyebrow>
            <Zap className="w-3 h-3" /> Powered by LLaMA 3.3 · Built for scale
          </Eyebrow>

          <h1 className="text-[40px] md:text-[68px] font-semibold tracking-[-0.04em] leading-[1.04] mb-6">
            AI customer support{' '}
            <span className="block">
              that <span className="accent-serif text-[1.08em]">never sleeps</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy a fully-configured AI support agent on your website in minutes. Answers questions, stays on topic, and learns from your knowledge base — 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-grad-fill hover:opacity-95 px-7 gap-2 shadow-lift">
                Get started free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="px-7 gap-2 bg-card">
                See how it works <ChevronDown className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">No credit card required · Free plan forever · Setup in 5 minutes</p>
        </div>

        {/* Widget preview */}
        <div className="relative max-w-5xl mx-auto mt-16 md:mt-20 px-5">
          <div className="rounded-2xl border border-border shadow-lift overflow-hidden bg-card">
            <div className="h-10 bg-muted border-b border-border flex items-center gap-2 px-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B4A]/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]/70" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">yourwebsite.com</span>
            </div>
            <div className="p-6 md:p-8 min-h-[300px] relative">
              {/* Placeholder page skeleton */}
              <div aria-hidden="true" className="space-y-3 max-w-md">
                <div className="h-3 w-40 rounded-full bg-muted" />
                <div className="h-6 w-72 max-w-full rounded-lg bg-muted" />
                <div className="h-3 w-64 max-w-full rounded-full bg-muted" />
                <div className="h-3 w-56 max-w-full rounded-full bg-muted" />
              </div>
              {/* Floating widget mock */}
              <div className="absolute bottom-5 right-5 flex flex-col items-end gap-3">
                <div className="bg-card rounded-2xl shadow-lift border border-border w-64 sm:w-72 overflow-hidden text-left">
                  <div className="bg-grad-fill px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">A</div>
                    <div>
                      <div className="text-xs font-semibold">Aria</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#6EE7B7] rounded-full" /><span className="opacity-80 text-xs">Online</span></div>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]">Hi! How can I help you today? 👋</div>
                    <div className="bg-primary text-primary-foreground rounded-xl rounded-tr-sm px-3 py-2 text-xs ml-auto max-w-[80%]">What&apos;s your refund policy?</div>
                    <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-xs max-w-[90%]">We offer a full refund within 30 days of purchase, no questions asked.</div>
                  </div>
                </div>
                <div className="brand-mark w-12 h-12 rounded-full flex items-center justify-center shadow-lift">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <Eyebrow>Features</Eyebrow>
            <h2 className="text-3xl md:text-[44px] font-semibold tracking-[-0.03em] leading-tight mb-4">
              Everything you need to <span className="accent-serif">support customers</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From deployment to analytics, SupportAI covers the full lifecycle of AI-powered customer support.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[17px] mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-muted/60 border-y border-border">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="text-3xl md:text-[44px] font-semibold tracking-[-0.03em] leading-tight mb-4">
              Live in <span className="accent-serif">5 minutes</span>
            </h2>
            <p className="text-muted-foreground">No engineering team required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 h-px border-t-2 border-dashed border-border z-0" style={{ width: 'calc(100% - 3rem)', left: 'calc(50% + 2rem)' }} />
                )}
                <div className="relative z-10 text-center">
                  <div className="brand-mark w-12 h-12 rounded-2xl font-display font-semibold text-lg flex items-center justify-center mx-auto mb-4 shadow-soft">
                    {s.n}
                  </div>
                  <h3 className="font-semibold text-[17px] mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-3xl md:text-[44px] font-semibold tracking-[-0.03em] leading-tight mb-4">
              Simple, <span className="accent-serif">transparent</span> pricing
            </h2>
            <p className="text-muted-foreground mb-8">Start free. Upgrade when you grow. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-muted border border-border rounded-full p-1">
              <button
                onClick={() => setBillingAnnual(false)}
                aria-pressed={!billingAnnual}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!billingAnnual ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                aria-pressed={billingAnnual}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billingAnnual ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'}`}
              >
                Annual <span className="text-success font-semibold">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan) => {
              const annualPrice = plan.price.startsWith('$')
                ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
                : plan.price;
              const displayPrice = billingAnnual && plan.price !== '$0' ? annualPrice : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`rounded-2xl border bg-card p-6 flex flex-col relative ${plan.badge ? 'border-2 border-primary shadow-lift md:-mt-2' : `${plan.color} shadow-soft`}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-grad-fill text-xs font-semibold px-3 py-1 rounded-full shadow-soft">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="flex items-end gap-1">
                      <span className="font-display text-4xl font-semibold tracking-tight">{displayPrice}</span>
                      {plan.price !== 'Custom' && (
                        <span className="text-muted-foreground text-sm mb-1">
                          {billingAnnual && plan.price !== '$0' ? '/ mo, billed annually' : `/ ${plan.period}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-brand-text shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full ${plan.badge ? 'bg-grad-fill hover:opacity-95' : ''}`}
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
      <section className="py-16 bg-muted/60 border-y border-border">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-[0.14em] mb-8 font-semibold">Trusted by teams worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {['AcmeCo', 'Globex Inc', 'Initech', 'Umbrella'].map((name) => (
              <div key={name} className="font-display text-muted-foreground/60 font-semibold text-xl tracking-tight">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-24 px-5">
        <div className="relative overflow-hidden max-w-5xl mx-auto rounded-3xl bg-[#0B1020] text-[#EEF2FF] px-6 py-16 md:py-20 text-center shadow-lift">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(50%_80%_at_15%_0%,rgb(79_70_229/0.55),transparent_70%),radial-gradient(45%_70%_at_85%_10%,rgb(124_58_237/0.45),transparent_70%),radial-gradient(40%_60%_at_60%_100%,rgb(6_182_212/0.30),transparent_70%)]"
          />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-[44px] font-semibold tracking-[-0.03em] leading-tight mb-4">
              Ready to <span className="font-serif italic font-normal text-[#A5B4FC]">automate</span> your support?
            </h2>
            <p className="text-[#C7D2FE] mb-8 text-lg">Join hundreds of businesses using SupportAI to handle customer questions instantly.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-[#3730A3] hover:bg-[#EEF2FF] px-7 font-semibold gap-2">
                  Start for free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white px-7">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-[#A3ADC8] text-sm">Free plan · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-display font-semibold tracking-tight">
              <BrandMark size="sm" />
              SupportAI
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Sign up</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SupportAI · A{' '}
              <a href="https://www.northlane.live/" className="text-foreground underline underline-offset-4 hover:text-brand-text">Northlane</a>{' '}
              product
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
