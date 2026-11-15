import { NextRequest, NextResponse } from 'next/server';

interface DocParagraphElement {
  textRun?: { content?: string };
}

interface DocStructuralElement {
  paragraph?: { elements?: DocParagraphElement[] };
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
  const documentId = searchParams.get('documentId')?.trim() || '';
  if (!documentId || !/^[a-zA-Z0-9_-]{1,128}$/.test(documentId)) {
    return NextResponse.json(
      { error: 'Provide a valid Google Doc documentId.' },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`,
    { headers: { Authorization: authHeader } }
  );
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || 'Failed to read Google Doc.' },
      { status: res.status }
    );
  }

  const contentBlocks: DocStructuralElement[] = data.body?.content ?? [];
  const extractedText = contentBlocks
    .map((block) =>
      (block.paragraph?.elements ?? [])
        .map((el) => el.textRun?.content ?? '')
        .join('')
    )
    .join('')
    .slice(0, 16000);

  return NextResponse.json({
    documentId: data.documentId,
    title: data.title || 'Untitled Document',
    text: extractedText,
  });
}
