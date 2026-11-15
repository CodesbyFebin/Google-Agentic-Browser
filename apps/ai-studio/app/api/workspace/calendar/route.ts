import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Disconnected: Google Workspace access token is required.' },
      { status: 401 }
    );
  }

  const nowIso = new Date().toISOString();
  const params = new URLSearchParams({
    timeMin: nowIso,
    maxResults: '15',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: authHeader } }
  );
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || 'Failed to load Google Calendar events.' },
      { status: res.status }
    );
  }

  return NextResponse.json({ events: data.items ?? [] });
}
