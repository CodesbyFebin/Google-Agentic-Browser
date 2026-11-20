import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { GET } from '../app/api/live/github/route';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test('GitHub live endpoint returns only provider values and commit links', async () => {
  const requests: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith('/Google-Agentic-Browser')) {
      return Response.json({
        full_name: 'CodesbyFebin/Google-Agentic-Browser',
        description: 'Real GitHub project',
        html_url: 'https://github.com/CodesbyFebin/Google-Agentic-Browser',
        stargazers_count: 19, forks_count: 4, open_issues_count: 3,
        updated_at: '2026-11-20T00:00:00Z',
      });
    }
    return Response.json([{ sha: 'abc1234', html_url: 'https://github.com/CodesbyFebin/Google-Agentic-Browser/commit/abc1234', commit: { message: 'Real commit\nDetails', author: { date: '2026-11-20T00:00:00Z' } } }]);
  }) as typeof fetch;
  const response = await GET();
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.repository.stars, 19);
  assert.equal(json.repository.forks, 4);
  assert.equal(json.commits[0].message, 'Real commit');
  assert.equal(json.source, 'GitHub REST API');
  assert.equal(requests.length, 2);
  assert.ok(requests.every((url) => url.startsWith('https://api.github.com/repos/CodesbyFebin/Google-Agentic-Browser')));
});

test('GitHub provider failure does not substitute fake counts', async () => {
  globalThis.fetch = (async () => { throw new Error('Provider offline'); }) as typeof fetch;
  const response = await GET();
  assert.equal(response.status, 503);
  const json = await response.json();
  assert.ok(json.error);
  assert.equal(json.repository, undefined);
});
