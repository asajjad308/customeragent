import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function findOrCreateGoogleTenant(email: string, name: string) {
  const existing = await prisma.user.findFirst({
    where: { email },
    include: { tenant: { select: { id: true, slug: true, plan: true, suspended: true } } },
  });

  if (existing) {
    if (!existing.emailVerified) {
      await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: true } });
    }
    return {
      id: existing.id, email: existing.email, name: existing.name,
      tenantId: existing.tenantId, tenantSlug: existing.tenant.slug,
      role: existing.role, plan: existing.tenant.plan,
    };
  }

  const company = name || email.split('@')[0];
  const baseSlug = slugify(company);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) slug = `${baseSlug}-${suffix++}`;

  const tenant = await prisma.tenant.create({
    data: {
      name: company, slug, email,
      users: {
        create: {
          email, name: name || company,
          password: crypto.randomBytes(32).toString('hex'),
          role: 'owner',
          emailVerified: true,
        },
      },
      agents: {
        create: {
          name: 'Support Agent', slug: 'support-agent',
          systemPrompt: 'You are a helpful customer support assistant for {{company_name}}. Always be empathetic and concise.',
          greeting: 'Hi! How can I help you today?',
        },
      },
      settings: { create: { companyName: company } },
    },
    include: { users: true },
  });

  const user = tenant.users[0];
  return { id: user.id, email: user.email, name: user.name, tenantId: tenant.id, tenantSlug: tenant.slug, role: user.role, plan: tenant.plan };
}

const loginSchema = z.object({
  email: z.string().refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email'),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;
          const user = await prisma.user.findFirst({
            where: { email },
            include: { tenant: { select: { id: true, slug: true, plan: true, suspended: true } } },
          });

          if (!user || !(await bcrypt.compare(password, user.password))) return null;
          if (user.tenant.suspended) return null;

          await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

          return {
            id: user.id, email: user.email, name: user.name,
            tenantId: user.tenantId, tenantSlug: user.tenant.slug,
            role: user.role, plan: user.tenant.plan,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const data = await findOrCreateGoogleTenant(user.email!, user.name ?? '');
          Object.assign(user, data);
        } catch (err) {
          console.error('[auth] Google signIn error:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.tenantId = u.tenantId;
        token.tenantSlug = u.tenantSlug;
        token.role = u.role;
        token.plan = u.plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string;
      session.user.tenantSlug = token.tenantSlug as string;
      session.user.role = token.role as string;
      session.user.plan = token.plan as string;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string; email: string; name: string;
      tenantId: string; tenantSlug: string;
      role: string; plan: string;
    };
  }
}
