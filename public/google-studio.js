/* Live Gemini planning and read-only Google Drive inside the original browser UI.
 * All rendered external text is escaped. This module never executes plan steps. */
(() => {
  'use strict';

  const personas = [
    ['orion', '✦', 'Orion', 'Orchestrator'],
    ['rover', '🦊', 'Rover', 'Research'],
    ['atlas', '⬡', 'Atlas', 'Analysis'],
    ['aegis', '◇', 'Aegis', 'Safety / Policy'],
    ['mercury', '✧', 'Mercury', 'Procurement'],
    ['chronicle', '✎', 'Chronicle', 'Knowledge / Records'],
  ];
  const templates = {
    Code: 'Plan a code review and safe implementation steps for: ',
    Data: 'Plan a data analysis workflow with source verification for: ',
    Research: 'Plan a research mission with evidence quality checks for: ',
    Image: 'Plan an image concept and creative brief for: ',
    Video: 'Plan a video storyboard and production checklist for: ',
    Build: 'Plan a full-stack build with tests and approval gates for: ',
    Custom: '',
  };
  const state = { status: null, plan: null, files: null, error: '', busy: false, fetchingDrive: false, goal: '', streamText: '', streaming: false, streamError: '', streamAbort: null };
  const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

  function statusPill(connected, label) {
    return `<span class="studio-pill ${connected ? '' : 'offline'}"><span class="studio-status-dot ${connected ? '' : 'off'}"></span>${html(label)}</span>`;
  }

  function renderPlan() {
    if (state.busy) return '<div class="studio-empty">✧ Contacting the Gemini API and drafting a proposed workflow…</div>';
    if (state.error) return `<div role="alert" class="studio-empty" style="color:#ffc98c">${html(state.error)}</div>`;
    if (!state.plan) return '<div class="studio-empty">Describe a goal and generate a real Gemini-powered plan. All steps remain proposed until separately reviewed.</div>';
    const p = state.plan;
    return `<div class="studio-side"><div class="studio-label">Gemini plan · ${html(p.model || 'configured model')}</div><h2 style="margin:8px 0">${html(p.overview)}</h2><p class="studio-muted">This plan is unexecuted. No sites visited, money spent or account changes made.</p></div>
      <div style="margin-top:16px">${(p.steps || []).map((step, index) => {
        const agent = personas.find(a => a[0] === step.agent) || personas[0];
        return `<div class="studio-step"><div class="studio-step-icon">${index + 1}</div><div><small>${html(agent[2])} · PROPOSED</small><b style="margin-top:3px">${html(step.title)}</b><p>${html(step.detail)}</p>${step.requiresApproval ? '<span class="studio-danger">🔒 Human approval required · not executed</span>' : ''}</div></div>`;
      }).join('')}</div><div class="studio-card" style="margin-top:12px;padding:12px"><div class="studio-label">Suggested next action</div><p class="studio-muted" style="margin-top:5px">${html(p.nextAction)}</p></div>`;
  }

  function renderDrive() {
    if (!state.status) return '<p class="studio-muted">Checking account connection…</p>';
    const account = state.status.googleDrive || {};
    if (!account.configured) return '<p class="studio-muted">Google OAuth is not configured on this server. Add the OAuth credentials from <code>.env.example</code> to enable read-only Drive metadata.</p>';
    if (!account.connected) return `<p class="studio-muted">Connect your account to view recent Drive file names. Only <b>Drive metadata read-only</b> permission is requested. No documents are downloaded or modified.</p><a class="studio-button" href="/api/google/oauth/start" style="margin-top:10px">Connect Google account ↗</a>`;
    const fileList = state.files;
    return `<p class="studio-muted">Connected as ${html(account.email || 'Google user')}. Access expires automatically; no refresh tokens are stored.</p>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button data-studio="files" class="studio-button" ${state.fetchingDrive ? 'disabled' : ''}>${state.fetchingDrive ? 'Loading…' : '↻ View recent files'}</button><button data-studio="disconnect" class="studio-button">Disconnect</button></div>
      ${fileList?.error ? `<p role="alert" class="studio-muted" style="color:#ffc98c;margin-top:8px">${html(fileList.error)}</p>` : ''}
      ${Array.isArray(fileList?.files) ? fileList.files.map(f => `<div class="studio-drive-file"><b>▤ ${html(f.name)}</b><small>${html(f.mimeType)}${f.modifiedTime ? ` · ${html(f.modifiedTime.slice(0, 10))}` : ''}</small>${typeof f.url === 'string' && /^https:\/\/drive\.google\.com\//.test(f.url) ? `<br><a href="${html(f.url)}" target="_blank" rel="noopener noreferrer">Open in Drive ↗</a>` : ''}</div>`).join('') || '<p class="studio-muted">No recent files returned.</p>' : ''}`;
  }


  function renderStream() {
    const disabled = state.status && !state.status.gemini?.streamingEnabled;
    return `<p class="studio-muted" style="margin:8px 0">Stream a proposed explanation token-by-token. No actions are executed. Production streaming stays off until user authentication and quotas are ready.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="studio-button" data-studio="stream" ${state.streaming || disabled ? 'disabled' : ''}>${state.streaming ? 'Streaming…' : '↝ Stream Gemini draft'}</button>
        ${state.streaming ? '<button class="studio-button" data-studio="cancel-stream">Stop stream</button>' : ''}
      </div>
      ${state.streamError ? `<p role="alert" class="studio-muted" style="color:#ffc98c;margin-top:8px">${html(state.streamError)}</p>` : ''}
      ${state.streamText ? `<pre class="studio-stream-output">${html(state.streamText)}</pre>` : ''}`;
  }

  async function streamDraft() {
    if (state.streaming) return;
    const goal = document.getElementById('studio-goal')?.value.trim() || state.goal;
    if (!goal) { state.streamError = 'Enter a goal first.'; repaint(); return; }
    state.goal = goal;
    state.streamText = '';
    state.streamError = '';
    state.streaming = true;
    const abort = new AbortController();
    state.streamAbort = abort;
    repaint();
    let reader;
    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }), signal: abort.signal, cache: 'no-store',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Streaming request failed (${response.status})`);
      }
      if (!response.body) throw new Error('The browser does not support streaming responses.');
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      while (!abort.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        const frames = pending.split('\n\n');
        pending = frames.pop() || '';
        for (const frame of frames) {
          const type = frame.match(/^event: (.+)$/m)?.[1];
          const dataLine = frame.match(/^data: (.+)$/m)?.[1];
          if (!dataLine) continue;
          const data = JSON.parse(dataLine);
          if (type === 'delta') { state.streamText += data.text || ''; repaint(); }
          if (type === 'error') throw new Error(data.error || 'Streaming interrupted.');
        }
      }
    } catch (error) {
      if (!abort.signal.aborted) state.streamError = error.message;
    } finally {
      if (abort.signal.aborted && reader) { try { await reader.cancel(); } catch { /* already closed */ } }
      if (reader) reader.releaseLock();
      state.streaming = false;
      state.streamAbort = null;
      repaint();
    }
  }

  function renderStudio() {
    return `<div class="studio-wrap"><div class="studio-hero"><div class="studio-eyebrow"><span class="studio-spark">✦</span> GOOGLE AGENTIC BROWSER / AGENT STUDIO</div><h1>Six minds. One mission.<br><span style="color:#9dc0ff">Your final say.</span></h1><p>Draft multi-agent workflows with the real Google Gemini API. Connect Google Drive for read-only metadata. Purchases, messages, publishing and account changes are never executed by these agents.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${statusPill(Boolean(state.status?.gemini?.available), state.status?.gemini?.available ? `Gemini available · ${state.status.gemini.model}` : state.status?.gemini?.configured ? 'Gemini paused until authentication' : 'Gemini key not configured')}${statusPill(Boolean(state.status?.googleDrive?.connected), state.status?.googleDrive?.connected ? 'Google Drive connected' : 'Google Drive disconnected')}<span class="studio-pill">🔒 Approval-first · planning only</span></div></div>
    <div class="studio-grid"><div style="min-width:0"><div class="studio-card"><div class="studio-label">Mission composer · Agent Studio</div><p class="studio-muted" style="margin:8px 0 12px">For example: “Compare three browser agent frameworks and propose a test plan.”</p><div class="studio-templates"><span class="studio-muted">Planning templates:</span>${Object.keys(templates).map(name => `<button type="button" class="studio-template" data-studio-template="${html(name)}">${html(name)}</button>`).join('')}</div><form id="studio-goal-form"><textarea class="studio-textarea" id="studio-goal" maxlength="4000" minlength="1" required placeholder="What would you like your agents to plan?">${html(state.goal)}</textarea><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:11px"><span class="studio-muted">Plans only · zero automated external actions</span><button class="studio-button primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Planning…' : '✧ Generate Gemini plan →'}</button></div></form></div><div class="studio-card" style="margin-top:13px"><div class="studio-label">Proposed workflow</div>${renderPlan()}</div><div class="studio-card" style="margin-top:13px"><div class="studio-label">Live Gemini draft · local development</div>${renderStream()}</div></div>
    <div style="min-width:0"><div class="studio-card"><div class="studio-label">Agent team</div><div class="studio-agent-grid">${personas.map(a => `<div class="studio-agent"><div class="studio-agent-icon">${a[1]}</div><div><b>${a[2]}</b><small>${a[3]}</small></div></div>`).join('')}</div><p class="studio-muted" style="margin-top:13px">Personas collaborate through Gemini-generated steps, not independent background agents with account access.</p></div><div class="studio-card" style="margin-top:13px"><div class="studio-label">Google Workspace connector</div><h2 style="font-size:19px;margin-top:9px">Drive, on your terms.</h2><div style="margin-top:10px">${renderDrive()}</div></div><div class="studio-card" style="margin-top:13px;background:rgba(66,133,244,.075)"><div class="studio-label">Safety boundary</div><p class="studio-muted" style="margin-top:8px">Nothing spends funds or alters your Google account. Higher-risk plan steps are flagged for approval, but an approval-execution backend is intentionally not enabled.</p></div></div></div></div>`;
  }

  async function getJSON(url, init) {
    const response = await fetch(url, { cache: 'no-store', ...init });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || `Request failed (${response.status})`);
    return json;
  }
  function repaint() {
    if (typeof S === 'object' && typeof rMain === 'function' && S.tabs.some(t => t.page === 'studio')) rMain();
  }
  async function refreshStatus() {
    try { state.status = await getJSON('/api/google/status'); }
    catch (error) { state.error = `Could not load API status: ${error.message}`; }
    repaint();
  }
  async function plan(goal) {
    if (state.busy) return;
    state.goal = goal;
    state.error = '';
    state.plan = null;
    state.busy = true;
    repaint();
    try { state.plan = await getJSON('/api/agent/studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal }) }); }
    catch (error) { state.error = error.message; }
    finally { state.busy = false; repaint(); }
  }
  async function loadFiles() {
    state.fetchingDrive = true;
    repaint();
    try { state.files = await getJSON('/api/google/drive'); }
    catch (error) { state.files = { error: error.message }; }
    finally { state.fetchingDrive = false; repaint(); }
  }

  GP.studio = renderStudio;
  window.openAgentStudio = () => openPage('Agent Studio', 'studio', 'agentic://studio');
  window.openGoogleStudio = window.openAgentStudio; // Backward-compatible demo entry point.
  const headerActions = document.querySelector('header .ml-auto');
  if (headerActions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'px-3 py-1.5 rounded-full text-xs font-bold text-white';
    button.style.background = 'linear-gradient(110deg,#4285f4,#8153da)';
    button.textContent = '✧ Agent Studio';
    button.addEventListener('click', window.openGoogleStudio);
    headerActions.prepend(button);
  }
  const sidebar = document.querySelector('#side');
  if (sidebar) {
    const button = document.createElement('button');
    button.className = 'w-full rounded-2xl p-3 text-left text-white flex items-center gap-3';
    button.style.cssText = 'background:linear-gradient(110deg,#223b75,#4d337d);border:1px solid rgba(157,178,255,.28)';
    button.innerHTML = '<span style="font-size:20px">✧</span><span><b class="block text-sm">Agent Studio</b><span class="text-xs opacity-80">Live plans · Google Drive</span></span><span class="ml-auto">→</span>';
    button.addEventListener('click', window.openGoogleStudio);
    sidebar.insertBefore(button, sidebar.lastElementChild);
  }
  document.addEventListener('submit', event => {
    if (event.target.id !== 'studio-goal-form') return;
    event.preventDefault();
    const goal = event.target.querySelector('textarea')?.value.trim();
    if (goal) plan(goal);
  });
  document.addEventListener('click', async event => {
    const action = event.target.closest('[data-studio]')?.dataset.studio;
    if (action === 'stream') await streamDraft();
    if (action === 'cancel-stream') state.streamAbort?.abort();
    if (action === 'files') await loadFiles();
    if (action === 'disconnect') {
      try {
        await getJSON('/api/google/disconnect', { method: 'POST' });
        state.files = null;
        await refreshStatus();
      } catch (error) { state.files = { error: error.message }; repaint(); }
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-studio-template]');
    if (!button) return;
    const key = button.dataset.studioTemplate;
    if (!Object.prototype.hasOwnProperty.call(templates, key)) return;
    state.goal = templates[key];
    repaint();
    document.getElementById('studio-goal')?.focus();
  });
  window.addEventListener('pagehide', () => state.streamAbort?.abort());
  refreshStatus();
})();
