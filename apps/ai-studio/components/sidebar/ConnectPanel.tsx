'use client';

import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  FolderOpen,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Unplug,
} from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';

type WorkspaceTab = 'drive' | 'docs' | 'calendar' | 'gmail';

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface CalendarEventItem {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

interface GmailMessageItem {
  id: string;
  subject: string;
  from: string;
  snippet: string;
}

export function ConnectPanel() {
  const {
    user,
    workspaceToken,
    connections,
    handleSignIn,
    handleConnectWorkspace,
    handleDisconnectWorkspace,
    handleSignOut,
    createManualApproval,
    authedFetch,
    settings,
  } = useBrowserState();

  const [activeService, setActiveService] = useState<WorkspaceTab>('drive');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [driveQuery, setDriveQuery] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [docIdInput, setDocIdInput] = useState('');
  const [docContent, setDocContent] = useState<{ title: string; text: string } | null>(null);
  const [docSummary, setDocSummary] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [emails, setEmails] = useState<GmailMessageItem[]>([]);

  // Confirmation modal state for mutating/draft actions
  const [confirmAction, setConfirmAction] = useState<{
    label: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const onGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await handleSignIn();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const onConnectWorkspace = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await handleConnectWorkspace();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google Workspace authorization was denied or failed.'
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const fetchDrive = async () => {
    if (!workspaceToken) return;
    setLoadingData(true);
    setApiError(null);
    try {
      const res = await fetch(
        `/api/workspace/drive?q=${encodeURIComponent(driveQuery)}`,
        { headers: { Authorization: `Bearer ${workspaceToken}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drive request failed.');
      setDriveFiles(data.files ?? []);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Drive error.');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchDoc = async () => {
    if (!workspaceToken || !docIdInput.trim()) return;
    setLoadingData(true);
    setApiError(null);
    setDocSummary(null);
    try {
      const res = await fetch(
        `/api/workspace/docs?documentId=${encodeURIComponent(docIdInput.trim())}`,
        { headers: { Authorization: `Bearer ${workspaceToken}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Docs request failed.');
      setDocContent({ title: data.title, text: data.text });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Docs error.');
    } finally {
      setLoadingData(false);
    }
  };

  const summarizeLoadedDoc = async () => {
    if (!docContent?.text) return;
    setLoadingData(true);
    setApiError(null);
    try {
      const res = await authedFetch('/api/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          title: docContent.title,
          content: docContent.text,
          model: settings.defaultModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summarization failed.');
      setDocSummary(data.summary);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Summarize error.');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCalendar = async () => {
    if (!workspaceToken) return;
    setLoadingData(true);
    setApiError(null);
    try {
      const res = await fetch('/api/workspace/calendar', {
        headers: { Authorization: `Bearer ${workspaceToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Calendar request failed.');
      setEvents(data.events ?? []);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Calendar error.');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchGmail = async () => {
    if (!workspaceToken) return;
    setLoadingData(true);
    setApiError(null);
    try {
      const res = await fetch('/api/workspace/gmail', {
        headers: { Authorization: `Bearer ${workspaceToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gmail request failed.');
      setEmails(data.messages ?? []);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gmail error.');
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-slate-100">
          Account & Google Workspace
        </h3>
        <p className="text-[11px] text-slate-400">
          Firebase Authentication is separate from Google Workspace data consent.
        </p>
      </div>

      {/* Firebase Auth Box */}
      <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2.5">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate">
                {user.displayName || 'Authenticated User'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-slate-300">
              Sign in with Google for Firestore cloud persistence.
            </div>
            <button
              type="button"
              disabled={authBusy}
              onClick={onGoogleSignIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-[#0B1220] px-4 py-2.5 text-xs font-semibold text-slate-100 hover:border-blue-500/50 hover:bg-slate-800/80 disabled:opacity-50 transition-colors"
            >
              <LogIn className="h-4 w-4 text-blue-400" />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Incremental Workspace OAuth Consent */}
      <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Workspace OAuth Status
          </span>
          <span
            className={`text-[11px] font-mono ${
              workspaceToken ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {workspaceToken ? 'Connected (In-Memory)' : 'Disconnected'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {connections.map((c) => (
            <div
              key={c.service}
              className="rounded-lg border border-slate-800 bg-[#080c14] px-2 py-1.5 flex items-center justify-between"
            >
              <span className="text-slate-300">{c.label}</span>
              <span
                className={
                  c.connected ? 'text-emerald-400 font-mono' : 'text-slate-500 font-mono'
                }
              >
                {c.connected ? 'On' : 'Off'}
              </span>
            </div>
          ))}
        </div>

        {workspaceToken ? (
          <button
            type="button"
            onClick={handleDisconnectWorkspace}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <Unplug className="h-3.5 w-3.5" />
            Disconnect Workspace
          </button>
        ) : (
          <button
            type="button"
            disabled={authBusy}
            onClick={onConnectWorkspace}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Connect Google Workspace
          </button>
        )}
      </div>

      {authError && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-200">
          {authError}
        </div>
      )}

      {actionNotice && (
        <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/20 p-2.5 text-xs text-emerald-200">
          {actionNotice}
        </div>
      )}

      {apiError && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-200">
          {apiError}
        </div>
      )}

      {/* Confirmation Dialog for Mutating Workspace Calls */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="rounded-xl border border-amber-500/50 bg-[#141a29] p-3 space-y-2.5"
        >
          <div className="text-xs font-semibold text-amber-200">
            Confirm Workspace Action
          </div>
          <p className="text-xs text-slate-300">{confirmAction.label}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const fn = confirmAction.onConfirm;
                setConfirmAction(null);
                await fn();
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workspace Service Explorer */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-[#080c14] p-1">
          {(
            [
              { id: 'drive', label: 'Drive', icon: FolderOpen },
              { id: 'docs', label: 'Docs', icon: FileText },
              { id: 'calendar', label: 'Cal', icon: Calendar },
              { id: 'gmail', label: 'Gmail', icon: Mail },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveService(item.id)}
                className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium ${
                  activeService === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {!workspaceToken ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
            Workspace is disconnected. Click &ldquo;Connect Google Workspace&rdquo; above to authorize read/write scopes.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2.5">
            {activeService === 'drive' && (
              <>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={driveQuery}
                    onChange={(e) => setDriveQuery(e.target.value)}
                    placeholder="Search Drive files..."
                    className="flex-1 rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    disabled={loadingData}
                    onClick={fetchDrive}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {loadingData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'List'}
                  </button>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {driveFiles.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-lg border border-slate-800 bg-[#080c14] p-2 text-xs"
                    >
                      <div className="font-medium text-slate-200 truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {f.id}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeService === 'docs' && (
              <>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={docIdInput}
                    onChange={(e) => setDocIdInput(e.target.value)}
                    placeholder="Paste Google Doc ID..."
                    className="flex-1 rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                  />
                  <button
                    type="button"
                    disabled={loadingData || !docIdInput.trim()}
                    onClick={fetchDoc}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    Read
                  </button>
                </div>
                {docContent && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-100">
                      {docContent.title}
                    </div>
                    <p className="text-[11px] text-slate-400 max-h-28 overflow-y-auto whitespace-pre-wrap">
                      {docContent.text.slice(0, 1200)}
                    </p>
                    <button
                      type="button"
                      onClick={summarizeLoadedDoc}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
                    >
                      <Sparkles className="h-3 w-3" />
                      Summarize with Gemini
                    </button>
                    {docSummary && (
                      <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-2 text-[11px] text-slate-200 whitespace-pre-wrap">
                        {docSummary}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeService === 'calendar' && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={loadingData}
                    onClick={fetchCalendar}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                  >
                    Load Upcoming Events
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        label:
                          'Propose creating a 30-minute "Agentic Browser Review" event on your primary Google Calendar? This creates an approval checkpoint first.',
                        onConfirm: async () => {
                          await createManualApproval({
                            missionId: `msn_cal_${Date.now()}`,
                            stepId: `step_cal_${Date.now()}`,
                            agentId: 'orion',
                            action: {
                              actionType: 'CREATE_CALENDAR_EVENT',
                              title: 'Create Calendar Event: Agentic Browser Review',
                              reason: 'User requested a new calendar event via Workspace Connect.',
                              targetService: 'calendar',
                              riskLevel: 'MEDIUM',
                              parameters: {
                                summary: 'Agentic Browser Review',
                                description: 'Scheduled via Google Agentic Browser',
                              },
                            },
                          });
                          setActionNotice(
                            'Approval checkpoint created in Agents tab before modifying Google Calendar.'
                          );
                        },
                      })
                    }
                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
                  >
                    Propose Event
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-slate-800 bg-[#080c14] p-2 text-xs"
                    >
                      <div className="font-medium text-slate-200">
                        {ev.summary || '(Untitled Event)'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ev.start?.dateTime || ev.start?.date || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeService === 'gmail' && (
              <>
                <button
                  type="button"
                  disabled={loadingData}
                  onClick={fetchGmail}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                >
                  Load Recent Messages
                </button>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {emails.map((em) => (
                    <div
                      key={em.id}
                      className="rounded-lg border border-slate-800 bg-[#080c14] p-2 text-xs"
                    >
                      <div className="font-medium text-slate-200 truncate">
                        {em.subject}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {em.from}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Prepare Outgoing Email (Requires Approval to Send)
                  </div>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Recipient email"
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1 text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1 text-xs text-slate-100"
                  />
                  <textarea
                    rows={2}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Message body"
                    className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    disabled={!emailTo.trim() || !emailSubject.trim()}
                    onClick={() =>
                      setConfirmAction({
                        label: `Create a human approval request to send an email to "${emailTo}"?`,
                        onConfirm: async () => {
                          await createManualApproval({
                            missionId: `msn_gmail_${Date.now()}`,
                            stepId: `step_gmail_${Date.now()}`,
                            agentId: 'orion',
                            action: {
                              actionType: 'SEND_EMAIL',
                              title: `Send Email to ${emailTo}`,
                              reason: 'Sending outgoing Gmail messages requires explicit human approval.',
                              targetService: 'gmail',
                              riskLevel: 'HIGH',
                              parameters: {
                                to: emailTo.trim(),
                                subject: emailSubject.trim(),
                                body: emailBody.trim(),
                              },
                            },
                          });
                          setActionNotice(
                            'Approval checkpoint created in Agents tab. Approve there to send.'
                          );
                        },
                      })
                    }
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-40"
                  >
                    Queue Email for Approval
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
