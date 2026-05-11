// Load env first before any module-level initialization
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

config({ path: resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Tenant 1: AcmeCo
  const acme = await prisma.tenant.upsert({
    where: { slug: 'acmeco' },
    update: {},
    create: {
      name: 'AcmeCo',
      slug: 'acmeco',
      email: 'admin@acmeco.com',
      plan: 'pro',
      primaryColor: '#6366F1',
    },
  });

  const acmePassword = await bcrypt.hash('password123', 12);
  const acmeUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: acme.id, email: 'admin@acmeco.com' } },
    update: {},
    create: {
      tenantId: acme.id,
      email: 'admin@acmeco.com',
      name: 'Alice Admin',
      password: acmePassword,
      role: 'owner',
    },
  });

  const acmeAgent1 = await prisma.agent.upsert({
    where: { tenantId_slug: { tenantId: acme.id, slug: 'aria' } },
    update: {},
    create: {
      tenantId: acme.id,
      name: 'Aria',
      slug: 'aria',
      avatarColor: '#6366F1',
      widgetColor: '#6366F1',
      systemPrompt:
        'You are Aria, a warm and efficient customer support assistant for AcmeCo. Help users with their questions clearly and concisely. Always be empathetic.',
      businessContext:
        'AcmeCo is a SaaS company. 14-day free trial. Cancel anytime. Support hours: 24/7 via chat.',
      greeting: "Hi! I'm Aria 👋 How can I help you today?",
      tone: 'friendly',
    },
  });

  const acmeAgent2 = await prisma.agent.upsert({
    where: { tenantId_slug: { tenantId: acme.id, slug: 'max' } },
    update: {},
    create: {
      tenantId: acme.id,
      name: 'Max',
      slug: 'max',
      avatarColor: '#F59E0B',
      widgetColor: '#F59E0B',
      systemPrompt:
        'You are Max, a knowledgeable technical support specialist for AcmeCo. Help users troubleshoot issues, explain features, and guide them through complex workflows.',
      businessContext: 'AcmeCo enterprise plan. Priority support. SLA: 4 hours.',
      greeting: "Hey there! I'm Max, your technical support specialist 🛠️ What can I help with?",
      tone: 'professional',
    },
  });

  // KB entries for AcmeCo — check before inserting to avoid duplicates
  const kbCount = await prisma.knowledgeBase.count({ where: { tenantId: acme.id } });
  if (kbCount === 0) {
    await prisma.knowledgeBase.create({
      data: {
        tenantId: acme.id,
        agentId: acmeAgent1.id,
        type: 'faq',
        title: 'How do I reset my password?',
        content:
          'To reset your password: go to Settings > Security > Change Password. Enter your current password then your new password twice. Click Save.',
        keywords: 'password reset security',
      },
    });
    await prisma.knowledgeBase.create({
      data: {
        tenantId: acme.id,
        agentId: acmeAgent1.id,
        type: 'policy',
        title: 'Refund Policy',
        content:
          'We offer a 30-day money-back guarantee. Contact support within 30 days of purchase for a full refund. No questions asked.',
        keywords: 'refund money back guarantee',
      },
    });
  }

  await prisma.tenantSettings.upsert({
    where: { tenantId: acme.id },
    update: {},
    create: {
      tenantId: acme.id,
      companyName: 'AcmeCo',
      supportEmail: 'support@acmeco.com',
      language: 'en',
      timezone: 'America/New_York',
    },
  });

  // Tenant 2: Globex
  const globex = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      name: 'Globex Corp',
      slug: 'globex',
      email: 'admin@globex.com',
      plan: 'free',
      primaryColor: '#10B981',
    },
  });

  const globexPassword = await bcrypt.hash('password123', 12);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: globex.id, email: 'admin@globex.com' } },
    update: {},
    create: {
      tenantId: globex.id,
      email: 'admin@globex.com',
      name: 'Bob Builder',
      password: globexPassword,
      role: 'owner',
    },
  });

  await prisma.agent.upsert({
    where: { tenantId_slug: { tenantId: globex.id, slug: 'helper' } },
    update: {},
    create: {
      tenantId: globex.id,
      name: 'Helper',
      slug: 'helper',
      avatarColor: '#10B981',
      widgetColor: '#10B981',
      systemPrompt:
        'You are Helper, a friendly support assistant for Globex Corp. Help customers with their questions about our products and services.',
      greeting: "Hi! I'm Helper 👋 What can I help you with today?",
      tone: 'friendly',
    },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: globex.id },
    update: {},
    create: {
      tenantId: globex.id,
      companyName: 'Globex Corp',
      supportEmail: 'support@globex.com',
    },
  });

  console.log('✅ Seed complete');
  console.log('');
  console.log('Test accounts:');
  console.log('  AcmeCo  — admin@acmeco.com / password123  (pro plan)');
  console.log('  Globex  — admin@globex.com / password123  (free plan)');
  console.log('');
  console.log('AcmeCo agents:', acmeAgent1.id, acmeAgent2.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
