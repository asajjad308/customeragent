import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, company, email, password } = parsed.data;

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const baseSlug = slugify(company);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const hashed = await bcrypt.hash(password, 12);

    const tenant = await prisma.tenant.create({
      data: {
        name: company,
        slug,
        email,
        users: {
          create: {
            email,
            name,
            password: hashed,
            role: 'owner',
          },
        },
        agents: {
          create: {
            name: 'Support Agent',
            slug: 'support-agent',
            systemPrompt: 'You are a helpful customer support assistant. Assist users with their questions clearly and concisely. Always be empathetic.',
            greeting: 'Hi! How can I help you today?',
          },
        },
        settings: {
          create: {
            companyName: company,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, tenantId: tenant.id }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
