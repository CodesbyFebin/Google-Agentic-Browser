import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security';

// Public, read-only GitHub data. Never invent repository counts or activity.
export const dynamic = 'force-dynamic';
const OWNER = 'CodesbyFebin';
const REPO = 'Google-Agentic-Browser';
const API = 'https://api.github.com';

export async function GET() {
  const rate = checkRateLimit('live-public-github', 120, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Live GitHub rate limit reached.' }, { status: 429 });
  try {
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const options = { headers, cache: 'no-store' as const, signal: AbortSignal.timeout(10000) };
    const [repoResponse, commitsResponse] = await Promise.all([
      fetch(`${API}/repos/${OWNER}/${REPO}`, options),
      fetch(`${API}/repos/${OWNER}/${REPO}/commits?per_page=5`, options),
    ]);
    if (!repoResponse.ok || !commitsResponse.ok) {
      return NextResponse.json({ error: 'GitHub is unavailable or has rate-limited the request.' }, { status: 503 });
    }
    const repository = await repoResponse.json();
    const commits = await commitsResponse.json();
    if (!Array.isArray(commits) || typeof repository.stargazers_count !== 'number') {
      return NextResponse.json({ error: 'Unexpected response from GitHub.' }, { status: 502 });
    }
    return NextResponse.json({
      source: 'GitHub REST API',
      fetchedAt: new Date().toISOString(),
      repository: {
        fullName: repository.full_name,
        description: repository.description,
        url: repository.html_url,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        openIssues: repository.open_issues_count,
        updatedAt: repository.updated_at,
      },
      commits: commits.map((commit: { sha: string; html_url: string; commit?: { message?: string; author?: { date?: string } } }) => ({
        sha: commit.sha,
        url: commit.html_url,
        message: commit.commit?.message?.split('\n')[0] || '(No commit message)',
        date: commit.commit?.author?.date || null,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to reach live GitHub data.' }, { status: 503 });
  }
}
