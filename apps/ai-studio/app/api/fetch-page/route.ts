import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyRequestSession } from '@/lib/server/auth';
import { checkRateLimit, detectPromptInjection, validateExternalUrl } from '@/lib/security';

const FetchPageSchema = z.object({
  url: z.string().min(1).max(2048),
});

function extractMeta(html: string): {
  title: string;
  description: string;
  readableText: string;
} {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const descMatch =
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html) ||
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i.exec(html);

  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: decodeHtmlEntities((titleMatch?.[1] || '').trim()).slice(0, 180),
    description: decodeHtmlEntities((descMatch?.[1] || '').trim()).slice(0, 400),
    readableText: decodeHtmlEntities(stripped).slice(0, 6000),
  };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function POST(req: NextRequest) {
  // Hostname-only URL checks cannot guarantee DNS pinning or prevent
  // rebinding. Keep arbitrary server-side page fetches in local demos until
  // a hardened network egress proxy is integrated.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Server-side page fetching is disabled in deployed builds. Open the URL in your browser instead.' },
      { status: 403 },
    );
  }

  const session = await verifyRequestSession(req);
  const rate = checkRateLimit(`fetch-page:${session.uid}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = FetchPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid URL payload.' }, { status: 400 });
  }

  const validation = validateExternalUrl(parsed.data.url);
  if (!validation.valid || !validation.normalizedUrl) {
    return NextResponse.json(
      { error: validation.reason || 'Blocked URL.' },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(validation.normalizedUrl, {
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'GoogleAgenticBrowser-Prototype/1.0 (+safe-reader)',
        Accept: 'text/html, text/plain, application/json',
      },
    });
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({
        url: validation.normalizedUrl,
        title: new URL(validation.normalizedUrl).hostname,
        description: `Redirect returned (HTTP ${res.status}). Open directly in a browser tab to follow redirects.`,
        readableText: '',
        embeddable: false,
        injectionWarning: null,
      });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream server returned HTTP ${res.status}.` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get('content-type') || '';
    const xfo = res.headers.get('x-frame-options') || '';
    const csp = res.headers.get('content-security-policy') || '';
    const embedBlocked =
      Boolean(xfo) || csp.toLowerCase().includes('frame-ancestors');

    const rawText = await res.text();
    const meta = contentType.includes('html')
      ? extractMeta(rawText)
      : {
          title: new URL(validation.normalizedUrl).hostname,
          description: `Content-Type: ${contentType}`,
          readableText: rawText.slice(0, 6000),
        };

    const injectionCheck = detectPromptInjection(meta.readableText);

    return NextResponse.json({
      url: validation.normalizedUrl,
      title: meta.title || new URL(validation.normalizedUrl).hostname,
      description: meta.description,
      readableText: meta.readableText,
      embeddable: !embedBlocked,
      injectionWarning: injectionCheck.flagged
        ? `Aegis flagged suspicious text patterns: ${injectionCheck.findings.join(', ')}`
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch URL.';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
