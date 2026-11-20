'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDocFromServer, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowUpRight, Loader2, RefreshCw, Send, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { useBrowserState } from '@/components/BrowserStateProvider';
import { db } from '@/lib/firebase/client';
import { saveReportToFirestore } from '@/lib/firebase/firestore-service';
import type { SpaceSlug } from '@/lib/types';

type Service = 'github' | 'gmail' | 'calendar' | 'drive' | 'docs' | 'notes' | 'reports' | 'mission' | 'money';
type LiveResult = { status: 'disconnected' | 'loading' | 'ready' | 'error'; error?: string; items?: Record<string, unknown>[] };
type Repo = { source: string; fetchedAt: string; repository: { fullName: string; description: string | null; url: string; stars: number; forks: number; openIssues: number; updatedAt: string }; commits: { sha: string; url: string; message: string; date: string | null }[] };
type ChatItem = { role: 'user' | 'model'; content: string; sources?: { uri: string; title: string }[] };
const LIVE_APPS: { name: string; symbol: string; url: string; service?: Service }[] = [
  { name: 'Gmail', symbol: '✉️', url: 'https://mail.google.com/', service: 'gmail' },
  { name: 'Calendar', symbol: '📅', url: 'https://calendar.google.com/', service: 'calendar' },
  { name: 'Drive', symbol: '📁', url: 'https://drive.google.com/', service: 'drive' },
  { name: 'Docs', symbol: '📄', url: 'https://docs.google.com/', service: 'docs' },
  { name: 'Sheets', symbol: '📊', url: 'https://sheets.google.com/' },
  { name: 'Meet', symbol: '📹', url: 'https://meet.google.com/' },
  { name: 'Maps', symbol: '📍', url: 'https://maps.google.com/' },
  { name: 'YouTube', symbol: '▶️', url: 'https://www.youtube.com/' },
  { name: 'Photos', symbol: '🌈', url: 'https://photos.google.com/' },
  { name: 'Keep', symbol: '💡', url: 'https://keep.google.com/' },
  { name: 'Translate', symbol: '🌐', url: 'https://translate.google.com/' },
  { name: 'Search', symbol: '🔎', url: 'https://www.google.com/' },
];
const SPACES: { slug: SpaceSlug; label: string; icon: string }[] = [
  { slug: 'work', label: 'Work', icon: '🏠' },
  { slug: 'money', label: 'Money', icon: '💳' },
  { slug: 'personal', label: 'Personal', icon: '🌸' },
  { slug: 'research', label: 'Research', icon: '🔬' },
  { slug: 'focus', label: 'Focus', icon: '🎯' },
];
const panel = 'rounded-[22px] border border-white/10 bg-[#10182c]/85 p-4 shadow-xl shadow-black/10';
const button = 'rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-40';

function asText(value: unknown): string { return typeof value === 'string' ? value : ''; }
function errorMessage(e: unknown): string { return e instanceof Error ? e.message : 'The live request failed.'; }
function StateBadge({ status }: { status: LiveResult['status'] }) {
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${status === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : status === 'error' ? 'bg-rose-500/15 text-rose-300' : 'bg-white/10 text-slate-400'}`}>{status === 'ready' ? 'Live' : status === 'loading' ? 'Loading' : status === 'error' ? 'Error' : 'Disconnected'}</span>;
}

export function LiveWorkspace() {
  const { activeSpaceSlug, activeSpace, switchSpace, user, authReady, workspaceToken, handleSignIn, handleConnectWorkspace, handleDisconnectWorkspace, authedFetch, settings } = useBrowserState();
  const [selected, setSelected] = useState<Service>('github');
  const [repo, setRepo] = useState<Repo | null>(null);
  const [repoError, setRepoError] = useState('');
  const [repoLoading, setRepoLoading] = useState(true);
  const [google, setGoogle] = useState<Record<'gmail' | 'calendar' | 'drive', LiveResult>>({
    gmail: { status: 'disconnected' }, calendar: { status: 'disconnected' }, drive: { status: 'disconnected' },
  });
  const [busyAuth, setBusyAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [docId, setDocId] = useState('');
  const [documentData, setDocumentData] = useState<{ title: string; text: string } | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [notes, setNotes] = useState('');
  const [notesStatus, setNotesStatus] = useState('Sign in to load saved notes.');
  const [savingNotes, setSavingNotes] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [prompt, setPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [includeContext, setIncludeContext] = useState(false);
  const [report, setReport] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [objective, setObjective] = useState('');
  const [plan, setPlan] = useState<{ title: string; instruction?: string }[]>([]);
  const [planError, setPlanError] = useState('');
  const [planBusy, setPlanBusy] = useState(false);

  const refreshGithub = useCallback(async () => {
    setRepoLoading(true); setRepoError('');
    try {
      const res = await fetch('/api/live/github', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'GitHub request failed.');
      setRepo(data as Repo);
    } catch (err) { setRepo(null); setRepoError(errorMessage(err)); }
    finally { setRepoLoading(false); }
  }, []);

  useEffect(() => {
    void refreshGithub();
    const interval = window.setInterval(() => { void refreshGithub(); }, 90_000);
    return () => window.clearInterval(interval);
  }, [refreshGithub]);

  const refreshGoogle = useCallback(async () => {
    if (!workspaceToken) {
      setGoogle({ gmail: { status: 'disconnected' }, calendar: { status: 'disconnected' }, drive: { status: 'disconnected' } });
      return;
    }
    setGoogle({ gmail: { status: 'loading' }, calendar: { status: 'loading' }, drive: { status: 'loading' } });
    await Promise.all((['gmail', 'calendar', 'drive'] as const).map(async (service) => {
      try {
        const res = await fetch(`/api/workspace/${service}`, { headers: { Authorization: `Bearer ${workspaceToken}` }, cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Google ${service} request failed.`);
        const items = service === 'gmail' ? data.messages : service === 'calendar' ? data.events : data.files;
        if (!Array.isArray(items)) throw new Error('Unexpected Google Workspace response.');
        setGoogle((old) => ({ ...old, [service]: { status: 'ready', items } }));
      } catch (err) {
        setGoogle((old) => ({ ...old, [service]: { status: 'error', error: errorMessage(err) } }));
      }
    }));
  }, [workspaceToken]);

  useEffect(() => { void refreshGoogle(); }, [refreshGoogle]);

  useEffect(() => {
    let cancelled = false;
    setNotes('');
    if (!user?.emailVerified) { setNotesStatus('Verified Google sign-in is required for cloud notes.'); return; }
    setNotesStatus('Loading Firestore notes…');
    const id = `${user.uid}_${activeSpace.id}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    getDocFromServer(doc(db, 'spaces', id)).then((snap) => {
      if (cancelled) return;
      setNotes(snap.exists() ? asText(snap.data().notes) : '');
      setNotesStatus(snap.exists() ? 'Loaded from Firestore.' : 'No saved notes yet.');
    }).catch((err) => { if (!cancelled) setNotesStatus(`Firestore unavailable: ${errorMessage(err)}`); });
    return () => { cancelled = true; };
  }, [user?.uid, user?.emailVerified, activeSpace.id]);

  const saveNotes = async () => {
    if (!user?.emailVerified) { setNotesStatus('Sign in with a verified account to save.'); return; }
    setSavingNotes(true); setNotesStatus('Saving to Firestore…');
    const id = `${user.uid}_${activeSpace.id}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const ref = doc(db, 'spaces', id);
    try {
      const existing = await getDocFromServer(ref);
      if (existing.exists()) await updateDoc(ref, { notes: notes.slice(0, 20000), updatedAt: serverTimestamp() });
      else await setDoc(ref, { id, ownerId: user.uid, name: activeSpace.name.slice(0, 60), slug: activeSpaceSlug, splitLayout: activeSpace.splitLayout, notes: notes.slice(0, 20000), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setNotesStatus('Saved to Firestore successfully.');
    } catch (err) { setNotesStatus(`Save failed: ${errorMessage(err)}`); }
    finally { setSavingNotes(false); }
  };

  const connect = async (kind: 'sign-in' | 'workspace') => {
    setBusyAuth(true); setAuthError('');
    try { if (kind === 'sign-in') await handleSignIn(); else await handleConnectWorkspace(); }
    catch (err) { setAuthError(errorMessage(err)); }
    finally { setBusyAuth(false); }
  };

  const loadDocument = async () => {
    setDocumentError(''); setDocumentData(null);
    if (!workspaceToken) { setDocumentError('Connect Google Workspace first.'); return; }
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(docId.trim())) { setDocumentError('Enter a valid Google Docs document ID.'); return; }
    try {
      const res = await fetch(`/api/workspace/docs?documentId=${encodeURIComponent(docId.trim())}`, { headers: { Authorization: `Bearer ${workspaceToken}` }, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Docs read failed.');
      setDocumentData({ title: data.title, text: data.text });
    } catch (err) { setDocumentError(errorMessage(err)); }
  };

  const contextText = () => {
    if (selected === 'github' && repo) return JSON.stringify({ repository: repo.repository, commits: repo.commits });
    if (selected === 'docs' && documentData) return documentData.text.slice(0, 9000);
    if (selected === 'notes') return notes.slice(0, 9000);
    if (selected === 'gmail' || selected === 'calendar' || selected === 'drive') return JSON.stringify(google[selected].items || []).slice(0, 9000);
    return '';
  };

  const askGemini = async (text: string) => {
    if (!text.trim() || aiBusy) return;
    const next = [...chat, { role: 'user' as const, content: text.trim() }];
    setChat(next); setPrompt(''); setAiError(''); setAiBusy(true);
    try {
      const res = await authedFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text.trim(),
          history: chat.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          model: settings.defaultModel,
          stream: false,
          useSearchGrounding: true,
          ...(includeContext ? { paneContext: contextText() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gemini request failed.');
      if (!asText(data.text).trim()) throw new Error('Gemini returned no text.');
      setChat((items) => [...items, { role: 'model', content: data.text, sources: data.groundingUrls || [] }]);
    } catch (err) { setAiError(errorMessage(err)); }
    finally { setAiBusy(false); }
  };

  const generateReport = async () => {
    setReport(''); setReportStatus('');
    if (!user?.emailVerified) { setReportStatus('Verified sign-in required.'); return; }
    setAiBusy(true);
    try {
      const res = await authedFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify({
        message: `Write a factual Markdown report for this objective: ${objective.trim() || 'Summarize my connected workspace'}. Only use supplied evidence, identify missing sources, and do not claim any external action was executed.`,
        paneContext: contextText(),
        useSearchGrounding: true,
        stream: false,
        model: settings.defaultModel,
      }) });
      const data = await res.json();
      if (!res.ok || !asText(data.text).trim()) throw new Error(data.error || 'No report generated.');
      setReport(data.text);
      setReportStatus('Generated by Gemini. Review before saving; not yet saved.');
    } catch (err) { setReportStatus(`Report failed: ${errorMessage(err)}`); }
    finally { setAiBusy(false); }
  };

  const saveReport = async () => {
    if (!user?.emailVerified || !report.trim()) { setReportStatus('Sign in and generate a report first.'); return; }
    setReportStatus('Saving to Firestore…');
    try {
      await saveReportToFirestore(user.uid, { id: `rep_live_${Date.now()}`, title: (objective.trim() || 'Live workspace report').slice(0, 180), content: report, createdAtMs: Date.now() });
      setReportStatus('Report saved to Firestore successfully.');
    } catch (err) { setReportStatus(`Save failed: ${errorMessage(err)}`); }
  };

  const makePlan = async () => {
    setPlan([]); setPlanError('');
    if (!objective.trim()) { setPlanError('Enter a mission objective.'); return; }
    setPlanBusy(true);
    try {
      const res = await authedFetch('/api/ai/plan', { method: 'POST', body: JSON.stringify({ objective: objective.trim(), model: settings.defaultModel }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gemini planning failed.');
      if (!Array.isArray(data.steps)) throw new Error('No valid plan returned.');
      setPlan(data.steps);
    } catch (err) { setPlanError(errorMessage(err)); }
    finally { setPlanBusy(false); }
  };

  const dataCard = (service: 'gmail' | 'calendar' | 'drive', label: string) => {
    const data = google[service];
    return <button type="button" onClick={() => setSelected(service)} className={`${panel} text-left transition hover:border-blue-400/40`}>
      <div className="flex items-center justify-between"><span className="text-sm font-semibold">{label}</span><StateBadge status={data.status}/></div>
      <div className="mt-4 text-3xl font-bold tabular-nums">{data.status === 'ready' ? data.items?.length : '—'}</div>
      <p className="mt-1 text-[11px] text-slate-400">{data.status === 'ready' ? 'Recent items returned by Google' : data.error || 'Connect Google Workspace to load live data'}</p>
    </button>;
  };

  return <div className="flex min-h-dvh flex-col bg-[#050816] text-slate-100">
    <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#090f20] px-4 py-3">
      <div><div className="font-bold tracking-tight">✦ Agentic Browser <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-300">LIVE ONLY</span></div><p className="text-[10px] text-slate-400">Provider-backed data · no simulation · approval before external writes</p></div>
      <div className="flex items-center gap-2"><Link href="/" className={button}>Classic workspace</Link><button type="button" onClick={() => { void refreshGithub(); void refreshGoogle(); }} className={button} aria-label="Refresh live data"><RefreshCw size={15}/></button></div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-[216px] shrink-0 flex-col gap-3 border-r border-white/10 bg-[#0b1224] p-3 lg:flex">
        <div className="text-[10px] font-bold tracking-widest text-slate-500">SPACES</div>
        <nav className="space-y-1" aria-label="Spaces">{SPACES.map((item) => <button key={item.slug} onClick={() => switchSpace(item.slug)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs ${activeSpaceSlug === item.slug ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <div className="border-t border-white/10 pt-3 text-[10px] font-bold tracking-widest text-slate-500">LIVE SERVICES</div>
        <nav className="space-y-1" aria-label="Live services">{(['github','gmail','calendar','drive','docs','notes','reports','mission','money'] as Service[]).map((item) => <button key={item} onClick={() => setSelected(item)} className={`w-full rounded-xl px-3 py-2 text-left text-xs capitalize ${selected === item ? 'bg-blue-600/25 text-blue-200' : 'text-slate-300 hover:bg-white/10'}`}>{item === 'mission' ? 'Gemini planning' : item === 'money' ? 'Payments (not connected)' : item}</button>)}</nav>
      </aside>
      <main className="min-w-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-5">
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-blue-700 via-teal-600 to-rose-500 p-5 sm:p-7">
          <div className="absolute right-5 top-3 text-3xl opacity-70">✦</div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Your real connected workspace.</h1>
          <p className="mt-2 max-w-xl text-sm text-white/90">Actual provider responses only. Unconnected services stay disconnected; Gemini never pretends to browse, pay, or send.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!user && <button disabled={busyAuth || !authReady} onClick={() => { void connect('sign-in'); }} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-950">Sign in with Google</button>}
            <button disabled={busyAuth} onClick={() => { void connect('workspace'); }} className="rounded-full bg-[#08142b] px-4 py-2 text-xs font-bold text-white">{workspaceToken ? 'Reconnect Google Workspace' : 'Connect Google Workspace'}</button>
            {workspaceToken && <button onClick={handleDisconnectWorkspace} className="rounded-full border border-white/60 px-4 py-2 text-xs font-bold">Disconnect</button>}
          </div>
          {authError && <p role="alert" className="mt-2 text-xs font-semibold text-white">{authError}</p>}
          <div className="mt-3 text-[11px] text-white/85">Firebase: {user ? `Signed in as ${user.email || user.uid}` : 'Not signed in'} · Workspace: {workspaceToken ? 'OAuth token active' : 'Not connected'}</div>
        </section>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <button onClick={() => setSelected('github')} className={`${panel} text-left hover:border-blue-400/40`}><div className="flex justify-between"><span className="text-sm font-semibold">GitHub stars</span><StateBadge status={repo ? 'ready' : repoLoading ? 'loading' : 'error'}/></div><div className="mt-4 text-3xl font-bold">{repo ? repo.repository.stars.toLocaleString() : '—'}</div><p className="mt-1 text-[11px] text-slate-400">{repo ? 'Public repository · live API' : repoError || 'Loading GitHub'}</p></button>
          {dataCard('gmail','Recent Gmail')}
          {dataCard('calendar','Upcoming events')}
          {dataCard('drive','Recent Drive files')}
        </div>
        <section className={panel}><div className="flex items-center justify-between gap-3"><h2 className="font-bold">Your Apps</h2><span className="text-[11px] text-slate-400">Google apps open real services; only authorized data is displayed here</span></div><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">{LIVE_APPS.map((app) => app.service ? <button key={app.name} onClick={() => setSelected(app.service!)} className="rounded-xl border border-white/5 p-3 text-center text-xs hover:bg-white/10"><span className="mb-2 block text-2xl">{app.symbol}</span>{app.name}</button> : <a key={app.name} href={app.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/5 p-3 text-center text-xs hover:bg-white/10" title="Opens the real Google service in a new tab"><span className="mb-2 block text-2xl">{app.symbol}</span>{app.name} <ArrowUpRight className="inline h-3 w-3"/></a>)}</div></section>
        <section className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold capitalize">{selected === 'mission' ? 'Gemini mission planning' : selected === 'money' ? 'Payments' : selected}</h2><span className="text-[11px] text-slate-400">No sample results or fabricated transactions</span></div>
          {selected === 'github' && <div className="mt-3">{repo ? <><a href={repo.repository.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-300 hover:underline">{repo.repository.fullName} ↗</a><p className="mt-1 text-xs text-slate-400">{repo.repository.description || 'No description'}</p><p className="mt-2 text-xs">Stars: {repo.repository.stars.toLocaleString()} · Forks: {repo.repository.forks.toLocaleString()} · Open issues and PRs: {repo.repository.openIssues.toLocaleString()}</p><p className="mt-1 text-[11px] text-slate-500">Fetched {new Date(repo.fetchedAt).toLocaleString()} from {repo.source}</p><div className="mt-3 space-y-2">{repo.commits.map((c) => <a key={c.sha} href={c.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-white/5 p-3 text-xs hover:bg-white/10"><span className="font-mono text-blue-300">{c.sha.slice(0,8)}</span> · {c.message}</a>)}</div></> : <p className="text-sm text-rose-300">{repoLoading ? 'Loading live GitHub data…' : repoError}</p>}</div>}
          {(selected === 'gmail' || selected === 'calendar' || selected === 'drive') && <div className="mt-3 space-y-2">{google[selected].status === 'ready' ? (google[selected].items?.length ? google[selected].items!.map((item, i) => <div key={asText(item.id) || i} className="rounded-xl border border-white/5 bg-white/[.03] p-3 text-xs"><div className="font-semibold">{selected === 'gmail' ? asText(item.subject) : selected === 'calendar' ? asText(item.summary) || '(Untitled event)' : asText(item.name)}</div><div className="mt-1 text-slate-400">{selected === 'gmail' ? asText(item.from) : selected === 'calendar' ? asText((item.start as {dateTime?:string;date?:string} | undefined)?.dateTime || (item.start as {date?:string} | undefined)?.date) : asText(item.mimeType)}</div>{selected === 'gmail' && <p className="mt-1 text-slate-400">{asText(item.snippet)}</p>}{selected === 'drive' && asText(item.webViewLink) && <a href={asText(item.webViewLink)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-blue-300">Open file ↗</a>}</div>) : <p className="text-xs text-slate-400">Google returned no items.</p>) : <p className="text-xs text-slate-400">{google[selected].error || (workspaceToken ? 'Loading live Google data…' : 'Connect Google Workspace to view this service.')}</p>}</div>}
          {selected === 'docs' && <div className="mt-3 space-y-3"><p className="text-xs text-slate-400">Read an authorized Google Doc by its real document ID.</p><div className="flex gap-2"><input value={docId} onChange={(e) => setDocId(e.target.value)} placeholder="Google Docs document ID" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 p-2 text-xs"/><button onClick={() => { void loadDocument(); }} className={button}>Load</button></div>{documentError && <p role="alert" className="text-xs text-rose-300">{documentError}</p>}{documentData && <div><h3 className="font-semibold">{documentData.title}</h3><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs">{documentData.text}</pre></div>}</div>}
          {selected === 'notes' && <div className="mt-3 space-y-2"><p className="text-xs text-slate-400">Firestore-backed notes for {activeSpace.name}. Empty until you save your own content.</p><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={20000} rows={8} className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm" placeholder="Write real workspace notes…"/><div className="flex items-center gap-3"><button disabled={savingNotes || !user?.emailVerified} onClick={() => { void saveNotes(); }} className={button}>Save to Firestore</button><span role="status" className="text-xs text-slate-400">{notesStatus}</span></div></div>}
          {(selected === 'reports' || selected === 'mission') && <div className="mt-3 space-y-3"><textarea rows={3} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Enter your real research objective…" className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"/>{selected === 'mission' ? <><button disabled={planBusy} onClick={() => { void makePlan(); }} className={button}>{planBusy ? 'Asking Gemini…' : 'Generate real Gemini plan (does not execute)'}</button><p className="text-[11px] text-amber-300">Planning is not browser execution. No purchases, emails, or writes are performed.</p>{planError && <p role="alert" className="text-xs text-rose-300">{planError}</p>}{plan.map((s,i) => <div key={i} className="rounded-xl bg-white/5 p-3 text-xs"><b>{i+1}. {s.title}</b><p className="mt-1 text-slate-400">{s.instruction || ''}</p></div>)}</> : <><div className="flex gap-2"><button disabled={aiBusy || !user?.emailVerified} onClick={() => { void generateReport(); }} className={button}>Generate with Gemini</button><button disabled={!report.trim() || !user?.emailVerified} onClick={() => { void saveReport(); }} className={button}>Save verified report to Firestore</button></div><p role="status" className="text-xs text-slate-400">{reportStatus}</p>{report && <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs">{report}</pre>}</>}</div>}
          {selected === 'money' && <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm"><div className="flex items-center gap-2 font-bold text-amber-200"><Wallet size={16}/>Payment provider not connected</div><p className="mt-2 text-xs text-slate-300">No wallet balance, spend totals, payment execution, or agent checkout is shown without a verified provider, authenticated owner, transaction records, and a server-enforced approval flow. Nothing has been charged.</p></div>}
        </section>
      </main>
      <aside className="hidden w-[310px] shrink-0 flex-col border-l border-white/10 bg-[#0b1224] p-4 xl:flex">
        <div className="flex items-center gap-2 font-bold"><Sparkles className="text-blue-300"/> Gemini · Live API</div>
        <p className="mt-2 text-[11px] text-slate-400">Uses the existing authenticated Gemini endpoint. Responses are not canned.</p>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={includeContext} onChange={(e) => setIncludeContext(e.target.checked)}/> Include selected live data as context</label>
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto">{chat.map((m,i) => <div key={i} className={`rounded-xl p-3 text-xs whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-700/40' : 'bg-white/5'}`}><b>{m.role === 'user' ? 'You' : 'Gemini'}</b><p className="mt-1">{m.content}</p>{m.sources?.map((s) => <a key={s.uri} href={s.uri} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-blue-300">{s.title} ↗</a>)}</div>)}</div>
        {aiError && <p role="alert" className="mt-2 text-xs text-rose-300">{aiError}</p>}
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void askGemini(prompt); }}><input value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={16000} placeholder="Ask live Gemini…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 p-2 text-xs"/><button disabled={aiBusy || !prompt.trim()} type="submit" className="rounded-xl bg-blue-600 p-2 disabled:opacity-50" aria-label="Send Gemini request">{aiBusy ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}</button></form>
        <div className="mt-3 border-t border-white/10 pt-3 text-[11px] text-slate-400"><ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-300"/> No payment execution or fake approval.</div>
      </aside>
    </div>
    <footer className="border-t border-white/10 bg-[#070d1a] px-4 py-2 text-[11px] text-slate-400">Live workspace · Firebase authentication · Google OAuth · Gemini API · Firestore · GitHub REST API · Independent product, not affiliated with Google</footer>
  </div>;
}
