import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          console.log('[auth] authorize called, credentials keys:', Object.keys(credentials ?? {}));
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            console.log('[auth] zod parse failed:', parsed.error.issues);
            return null;
          }

          const { email, password } = parsed.data;
          console.log('[auth] looking up email:', email);

          const user = await prisma.user.findFirst({
            where: { email },
            include: { tenant: { select: { id: true, slug: true, plan: true } } },
          });

          if (!user) {
            console.log('[auth] user not found');
            return null;
          }

          const valid = await bcrypt.compare(password, user.password);
          console.log('[auth] password valid:', valid);
          if (!valid) return null;

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            tenantSlug: user.tenant.slug,
            role: user.role,
            plan: user.tenant.plan,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.role = (user as any).role;
        token.plan = (user as any).plan;
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
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      tenantSlug: string;
      role: string;
      plan: string;
    };
  }
}
