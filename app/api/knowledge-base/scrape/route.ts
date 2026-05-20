import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';
import { z } from 'zod';

const schema = z.object({
  url: z.string().url(),
  agentId: z.string().optional(),
});

// Tags whose inner text we want to skip entirely
const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'svg', 'head', 'nav', 'footer']);

function extractText($: cheerio.CheerioAPI): string {
  // Remove noisy elements first
  $('script, style, noscript, iframe, svg, nav, footer, header, [aria-hidden="true"]').remove();

  // Collect text from meaningful tags in document order
  const chunks: string[] = [];

  $('h1, h2, h3, h4, p, li, td, th, blockquote, figcaption').each((_, el) => {
    const tag = (el as cheerio.Element).tagName?.toLowerCase() ?? '';
    if (SKIP_TAGS.has(tag)) return;
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 20) chunks.push(text);
  });

  return chunks.join('\n');
}

function chunkText(text: string, maxChars = 2000): string[] {
  const paragraphs = text.split('\n').filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n' + para).length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { url, agentId } = parsed.data;
  const { tenantId, plan } = session!.user;
  const limits = getPlanLimits(plan);

  const existingCount = await prisma.knowledgeBase.count({ where: { tenantId } });
  if (existingCount >= limits.maxKnowledgeBaseEntries) {
    return NextResponse.json({ error: 'Knowledge base limit reached. Upgrade your plan.' }, { status: 403 });
  }

  // Fetch the page
  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SupportAI-Crawler/1.0 (knowledge base indexer)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: `Could not fetch URL: HTTP ${response.status}` }, { status: 422 });
    }
    html = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return NextResponse.json({ error: `Failed to fetch URL: ${msg}` }, { status: 422 });
  }

  const $ = cheerio.load(html);
  const pageTitle = $('title').first().text().trim() || new URL(url).hostname;
  const text = extractText($);

  if (text.length < 50) {
    return NextResponse.json({ error: 'Page has too little readable content to index.' }, { status: 422 });
  }

  const chunks = chunkText(text);
  const slotsLeft = limits.maxKnowledgeBaseEntries - existingCount;
  const toCreate = chunks.slice(0, slotsLeft);

  const created = await Promise.all(
    toCreate.map((chunk, i) =>
      prisma.knowledgeBase.create({
        data: {
          tenantId,
          agentId: agentId ?? null,
          type: 'website',
          title: toCreate.length === 1 ? pageTitle : `${pageTitle} (${i + 1}/${toCreate.length})`,
          content: chunk,
          keywords: new URL(url).hostname,
          isActive: true,
        },
      })
    )
  );

  return NextResponse.json({
    created: created.length,
    skipped: chunks.length - created.length,
    title: pageTitle,
  });
}
