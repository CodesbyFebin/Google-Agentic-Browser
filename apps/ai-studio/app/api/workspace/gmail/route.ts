import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface GmailHeader {
  name: string;
  value: string;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Disconnected: Google Workspace access token is required.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const listParams = new URLSearchParams({ maxResults: '10' });
  if (q) listParams.set('q', q);

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`,
    { headers: { Authorization: authHeader } }
  );
  const listData = await listRes.json();
  if (!listRes.ok) {
    return NextResponse.json(
      { error: listData.error?.message || 'Failed to list Gmail messages.' },
      { status: listRes.status }
    );
  }

  const messageRefs: { id: string }[] = (listData.messages ?? []).slice(0, 8);
  const messages = await Promise.all(
    messageRefs.map(async (m) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: authHeader } }
      );
      if (!msgRes.ok) return null;
      const msg = await msgRes.json();
      const headers: GmailHeader[] = msg.payload?.headers ?? [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      return {
        id: msg.id as string,
        snippet: (msg.snippet as string) || '',
        subject: getHeader('Subject') || '(No Subject)',
        from: getHeader('From') || 'Unknown Sender',
        date: getHeader('Date') || '',
      };
    })
  );

  return NextResponse.json({
    messages: messages.filter(Boolean),
  });
}

const DraftSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Disconnected: Google Workspace access token is required.' },
      { status: 401 }
    );
  }

  const rawBody = await req.json();
  const parsed = DraftSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Gmail draft payload.' }, { status: 400 });
  }

  const { to, subject, body } = parsed.data;
  const rawMime = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`;
  const encoded = Buffer.from(rawMime, 'utf8').toString('base64url');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw: encoded } }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || 'Failed to create Gmail draft.' },
      { status: res.status }
    );
  }

  return NextResponse.json({
    draftId: data.id,
    message: `Created Gmail draft for ${to}. Sending requires explicit approval.`,
  });
}
