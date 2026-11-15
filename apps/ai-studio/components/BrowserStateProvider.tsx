'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { User } from 'firebase/auth';
import {
  connectGoogleWorkspaceScopes,
  getCachedWorkspaceAccessToken,
  getFreshIdToken,
  getGrantedWorkspaceScopes,
  signInWithGoogleIdentity,
  signOutFirebase,
  subscribeAuthState,
  testFirestoreConnection,
} from '@/lib/firebase/client';
import {
  appendActivityLogToFirestore,
  deleteCustomAgentFromFirestore,
  deleteTabFromFirestore,
  ensureUserProfileInFirestore,
  loadUserCloudState,
  recordSimulatedTransactionInFirestore,
  saveApprovalToFirestore,
  saveCustomAgentToFirestore,
  saveMissionToFirestore,
  saveReportToFirestore,
  saveSettingsToFirestore,
  saveSpendingPolicyToFirestore,
  syncSpacesToFirestore,
  syncTabToFirestore,
  syncWorkspaceToFirestore,
} from '@/lib/firebase/firestore-service';
import {
  DEFAULT_CONNECTIONS,
  DEFAULT_SETTINGS,
  DEFAULT_SPACES,
  DEFAULT_SPENDING_POLICY,
  DEFAULT_TABS,
} from '@/lib/default-workspace';
import { createAgentFromTemplate } from '@/lib/agents/registry';
import { canTransitionMissionStatus } from '@/lib/mission-logic';
import { redactSecrets } from '@/lib/security';
import type {
  ActivityEvent,
  AgentStudioExecutionLog,
  ApprovalRequest,
  BrowserSettings,
  BrowserTab,
  ChatMessage,
  CustomAgentConfig,
  Mission,
  SavedReport,
  SidebarTabId,
  SimulatedTransaction,
  SpaceSlug,
  SpaceState,
  SpendingPolicy,
  SplitLayout,
  WorkspaceConnectionState,
} from '@/lib/types';

const STORAGE_KEY = 'gab_workspace_state_v1';

interface PersistedWorkspaceState {
  activeSpaceSlug: SpaceSlug;
  spaces: Record<SpaceSlug, SpaceState>;
  tabs: BrowserTab[];
  sidebarOpen: boolean;
  sidebarTab: SidebarTabId;
  focusMode: boolean;
  zenMode: boolean;
  chatMessages: ChatMessage[];
  customAgents: CustomAgentConfig[];
  studioLogs: AgentStudioExecutionLog[];
  missions: Mission[];
  activeMissionId: string | null;
  approvals: ApprovalRequest[];
  activityLogs: ActivityEvent[];
  reports: SavedReport[];
  spendingPolicy: SpendingPolicy;
  simulatedTransactions: SimulatedTransaction[];
  settings: BrowserSettings;
}

const INITIAL_CUSTOM_AGENTS: CustomAgentConfig[] = [
  createAgentFromTemplate('research', 'studio-research-1'),
  createAgentFromTemplate('code', 'studio-code-1'),
];

const INITIAL_REPORTS: SavedReport[] = [
  {
    id: 'rep-welcome',
    title: 'Google Agentic Browser · Prototype Safety Architecture',
    content: `# Google Agentic Browser — Architecture Brief\n\n**Status:** Independent Concept Prototype\n\n## Core Guardrails\n- **Human-in-the-Loop Approvals:** Spending money, sending emails, creating calendar events, and writing to Drive/Docs are server-gated behind signed, time-limited, single-use approvals.\n- **SSRF & Prompt-Injection Protection:** External URL fetches block private/loopback networks and wrap retrieved text inside untrusted-data delimiters.\n- **Simulation Mode:** Money OS operates strictly in Simulation Mode with real payment settlement disabled.`,
    createdAtMs: 1731670000000,
  },
];

function getInitialState(): PersistedWorkspaceState {
  return {
    activeSpaceSlug: 'work',
    spaces: DEFAULT_SPACES,
    tabs: DEFAULT_TABS,
    sidebarOpen: true,
    sidebarTab: 'gemini',
    focusMode: false,
    zenMode: false,
    chatMessages: [],
    customAgents: INITIAL_CUSTOM_AGENTS,
    studioLogs: [],
    missions: [],
    activeMissionId: null,
    approvals: [],
    activityLogs: [
      {
        id: 'evt-init-1',
        eventType: 'COMMAND',
        summary: 'Workspace initialized in Work Space (4-pane layout).',
        status: 'INFO',
        createdAtMs: 1731670000000,
      },
    ],
    reports: INITIAL_REPORTS,
    spendingPolicy: DEFAULT_SPENDING_POLICY,
    simulatedTransactions: [],
    settings: DEFAULT_SETTINGS,
  };
}

interface BrowserContextValue extends PersistedWorkspaceState {
  user: User | null;
  authReady: boolean;
  workspaceToken: string | null;
  connections: WorkspaceConnectionState[];
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  discoveryOpen: boolean;
  setDiscoveryOpen: (open: boolean) => void;
  firestoreStatus: string | null;
  activeSpace: SpaceState;
  spaceTabs: BrowserTab[];
  activeTab: BrowserTab | null;
  // Space & Tab actions
  switchSpace: (slug: SpaceSlug) => void;
  setSplitLayout: (layout: SplitLayout) => void;
  setPaneSplitRatio: (ratio: number) => void;
  setActivePane: (paneIndex: number) => void;
  swapPaneTabs: (paneA: number, paneB: number) => void;
  updateSpaceNotes: (notes: string) => void;
  openTab: (params: {
    title: string;
    url: string;
    kind: BrowserTab['kind'];
    paneIndex?: number;
    pinned?: boolean;
  }) => Promise<void>;
  closeTab: (tabId: string) => void;
  togglePinTab: (tabId: string) => void;
  focusTabInPane: (tabId: string, paneIndex?: number) => void;
  navigateAddressBar: (rawInput: string) => Promise<void>;
  refreshWebTab: (tabId: string) => Promise<void>;
  // UI toggles
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTabId) => void;
  toggleFocusMode: () => void;
  toggleZenMode: () => void;
  // Chat
  addChatMessage: (msg: ChatMessage) => void;
  updateLastModelMessage: (id: string, content: string, groundingUrls?: ChatMessage['groundingUrls']) => void;
  clearChat: () => void;
  // Agent Studio
  saveCustomAgent: (agent: CustomAgentConfig) => void;
  deleteCustomAgent: (agentId: string) => void;
  addStudioLog: (log: AgentStudioExecutionLog) => void;
  // Missions & Approvals
  startMission: (objective: string) => Promise<void>;
  pauseMission: (missionId: string) => void;
  resumeMission: (missionId: string) => Promise<void>;
  cancelMission: (missionId: string) => void;
  selectMission: (missionId: string) => void;
  createManualApproval: (input: {
    missionId: string;
    stepId: string;
    agentId: string;
    action: {
      actionType: ApprovalRequest['actionType'];
      title: string;
      reason: string;
      targetService: 'money_os' | 'gmail' | 'calendar' | 'drive' | 'docs' | 'chronicle';
      riskLevel: ApprovalRequest['riskLevel'];
      estimatedCostUsd?: number;
      parameters: Record<string, string | number | boolean>;
    };
  }) => Promise<ApprovalRequest | null>;
  decideApproval: (
    approvalId: string,
    decision: 'APPROVE' | 'REJECT',
    editedParameters?: Record<string, string | number | boolean>
  ) => Promise<{ ok: boolean; message: string }>;
  // Money OS & Reports & Settings
  updateSpendingPolicy: (patch: Partial<SpendingPolicy>) => void;
  saveReport: (title: string, content: string, missionId?: string) => void;
  updateSettings: (patch: Partial<BrowserSettings>) => void;
  resetLocalWorkspace: () => void;
  logActivity: (event: Omit<ActivityEvent, 'id' | 'createdAtMs'>) => void;
  // Auth & Workspace
  handleSignIn: () => Promise<void>;
  handleConnectWorkspace: (scopes?: string[]) => Promise<void>;
  handleDisconnectWorkspace: () => void;
  handleSignOut: () => Promise<void>;
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const BrowserStateContext = createContext<BrowserContextValue | null>(null);

export function useBrowserState(): BrowserContextValue {
  const ctx = useContext(BrowserStateContext);
  if (!ctx) {
    throw new Error('useBrowserState must be used inside BrowserStateProvider');
  }
  return ctx;
}

export function BrowserStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PersistedWorkspaceState>(getInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [workspaceToken, setWorkspaceToken] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<string | null>(null);

  const clientSessionRef = useRef<string>('session-local');
  const missionsRef = useRef<Mission[]>(state.missions);
  const approvalsRef = useRef<ApprovalRequest[]>(state.approvals);
  const policyRef = useRef<SpendingPolicy>(state.spendingPolicy);
  const transactionsRef = useRef<SimulatedTransaction[]>(state.simulatedTransactions);

  useEffect(() => {
    missionsRef.current = state.missions;
    approvalsRef.current = state.approvals;
    policyRef.current = state.spendingPolicy;
    transactionsRef.current = state.simulatedTransactions;
  }, [state.missions, state.approvals, state.spendingPolicy, state.simulatedTransactions]);

  // Hydrate persisted state from localStorage once on mount
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<PersistedWorkspaceState>;
          setState((prev) => ({
            ...prev,
            ...parsed,
            spaces: { ...DEFAULT_SPACES, ...(parsed.spaces || {}) },
            spendingPolicy: {
              ...DEFAULT_SPENDING_POLICY,
              ...(parsed.spendingPolicy || {}),
              realPaymentsEnabled: false,
            },
            settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          }));
        }
        let sid = window.sessionStorage.getItem('gab_client_sid');
        if (!sid) {
          sid = `sid_${Math.random().toString(36).slice(2, 10)}`;
          window.sessionStorage.setItem('gab_client_sid', sid);
        }
        clientSessionRef.current = sid;
      } catch {
        // Ignore malformed storage
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  // Persist local workspace state on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state, hydrated]);

  // Boot Firestore check + Firebase Auth listener
  useEffect(() => {
    testFirestoreConnection().then((res) => {
      if (!res.ok && res.error) setFirestoreStatus(res.error);
    });

    const unsubscribe = subscribeAuthState(async (firebaseUser, token) => {
      setUser(firebaseUser);
      setWorkspaceToken(token ?? getCachedWorkspaceAccessToken());
      setAuthReady(true);

      if (firebaseUser) {
        try {
          await ensureUserProfileInFirestore(firebaseUser);
          const idToken = await firebaseUser.getIdToken();
          const [cloud, serverRes] = await Promise.all([
            loadUserCloudState(firebaseUser.uid),
            fetch('/api/firestore/workspace', {
              headers: { 'x-firebase-token': idToken },
            })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ]);
          const serverSpace = serverRes?.workspace?.activeSpaceSlug as
            | SpaceSlug
            | undefined;
          const serverModel =
            typeof serverRes?.workspace?.defaultModel === 'string'
              ? serverRes.workspace.defaultModel
              : undefined;
          setState((prev) => ({
            ...prev,
            activeSpaceSlug:
              serverSpace && prev.spaces[serverSpace]
                ? serverSpace
                : prev.activeSpaceSlug,
            customAgents:
              cloud.agents.length > 0 ? cloud.agents : prev.customAgents,
            reports: cloud.reports.length > 0 ? cloud.reports : prev.reports,
            spendingPolicy: cloud.policy ?? prev.spendingPolicy,
            settings: serverModel
              ? { ...prev.settings, defaultModel: serverModel }
              : prev.settings,
          }));
          if (!serverRes?.workspace) {
            await syncWorkspaceToFirestore(firebaseUser.uid, {
              activeSpaceSlug: 'work',
              defaultModel: DEFAULT_SETTINGS.defaultModel,
              sidebarOpen: true,
            }).catch(() => {});
          }
        } catch (err) {
          console.error('Cloud bootstrap error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Derive Workspace connection flags cleanly from current in-memory token
  const connections = useMemo<WorkspaceConnectionState[]>(() => {
    if (!workspaceToken) {
      return DEFAULT_CONNECTIONS;
    }
    const granted = getGrantedWorkspaceScopes();
    return DEFAULT_CONNECTIONS.map((c) => ({
      ...c,
      connected: c.scopes.some((s) => granted.includes(s)),
    }));
  }, [workspaceToken]);

  // Keyboard shortcuts (Cmd/Ctrl+K Command Palette, Cmd/Ctrl+J Gemini)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          sidebarOpen: !prev.sidebarOpen,
          sidebarTab: 'gemini',
        }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const authedFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      const idToken = await getFreshIdToken();
      if (idToken) {
        headers.set('x-firebase-token', idToken);
      }
      const wsToken = getCachedWorkspaceAccessToken();
      if (wsToken) {
        headers.set('x-workspace-token', wsToken);
      }
      headers.set('x-client-session', clientSessionRef.current);
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...init, headers });
    },
    []
  );

  const logActivity = useCallback(
    (event: Omit<ActivityEvent, 'id' | 'createdAtMs'>) => {
      const entry: ActivityEvent = {
        ...event,
        summary: redactSecrets(event.summary),
        detail: event.detail ? redactSecrets(event.detail) : undefined,
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAtMs: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        activityLogs: [entry, ...prev.activityLogs].slice(0, 250),
      }));
      if (user?.emailVerified) {
        appendActivityLogToFirestore(user.uid, entry).catch(() => {});
      }
    },
    [user]
  );

  const activeSpace = state.spaces[state.activeSpaceSlug];
  const spaceTabs = useMemo(
    () => state.tabs.filter((t) => t.spaceId === activeSpace.id),
    [state.tabs, activeSpace.id]
  );
  const activeTab = useMemo(
    () =>
      spaceTabs.find((t) => t.paneIndex === activeSpace.activePaneIndex) ??
      spaceTabs[0] ??
      null,
    [spaceTabs, activeSpace.activePaneIndex]
  );

  const switchSpace = useCallback(
    (slug: SpaceSlug) => {
      setState((prev) => ({
        ...prev,
        activeSpaceSlug: slug,
      }));
      if (user?.emailVerified) {
        authedFetch('/api/firestore/workspace', {
          method: 'POST',
          body: JSON.stringify({
            activeSpaceSlug: slug,
            defaultModel: state.settings.defaultModel,
            sidebarOpen: state.sidebarOpen,
          }),
        }).catch(() => {});
      }
      logActivity({
        eventType: 'COMMAND',
        summary: `Switched workspace to ${DEFAULT_SPACES[slug].name} Space.`,
        status: 'INFO',
      });
    },
    [authedFetch, logActivity, state.settings.defaultModel, state.sidebarOpen, user]
  );

  const setSplitLayout = useCallback(
    (layout: SplitLayout) => {
      setState((prev) => {
        const current = prev.spaces[prev.activeSpaceSlug];
        const nextSpace: SpaceState = {
          ...current,
          splitLayout: layout,
          activePaneIndex: Math.min(current.activePaneIndex, layout - 1),
        };
        const updatedSpaces = { ...prev.spaces, [prev.activeSpaceSlug]: nextSpace };
        if (user?.emailVerified) {
          syncSpacesToFirestore(user.uid, updatedSpaces).catch(() => {});
        }
        return { ...prev, spaces: updatedSpaces };
      });
    },
    [user]
  );

  const setPaneSplitRatio = useCallback((ratio: number) => {
    const clamped = Math.min(75, Math.max(25, ratio));
    setState((prev) => {
      const current = prev.spaces[prev.activeSpaceSlug];
      return {
        ...prev,
        spaces: {
          ...prev.spaces,
          [prev.activeSpaceSlug]: { ...current, paneSplitRatio: clamped },
        },
      };
    });
  }, []);

  const setActivePane = useCallback((paneIndex: number) => {
    setState((prev) => {
      const current = prev.spaces[prev.activeSpaceSlug];
      return {
        ...prev,
        spaces: {
          ...prev.spaces,
          [prev.activeSpaceSlug]: { ...current, activePaneIndex: paneIndex },
        },
      };
    });
  }, []);

  const swapPaneTabs = useCallback((paneA: number, paneB: number) => {
    if (paneA === paneB) return;
    setState((prev) => {
      const spaceId = prev.spaces[prev.activeSpaceSlug].id;
      const tabA = prev.tabs.find((t) => t.spaceId === spaceId && t.paneIndex === paneA);
      const tabB = prev.tabs.find((t) => t.spaceId === spaceId && t.paneIndex === paneB);
      const nextTabs = prev.tabs.map((t) => {
        if (tabA && t.id === tabA.id) return { ...t, paneIndex: paneB };
        if (tabB && t.id === tabB.id) return { ...t, paneIndex: paneA };
        return t;
      });
      return { ...prev, tabs: nextTabs };
    });
  }, []);

  const updateSpaceNotes = useCallback(
    (notes: string) => {
      setState((prev) => {
        const current = prev.spaces[prev.activeSpaceSlug];
        const updatedSpaces = {
          ...prev.spaces,
          [prev.activeSpaceSlug]: { ...current, notes },
        };
        return { ...prev, spaces: updatedSpaces };
      });
    },
    []
  );

  const refreshWebTab = useCallback(
    async (tabId: string) => {
      let targetUrl = '';
      setState((prev) => {
        const found = prev.tabs.find((t) => t.id === tabId);
        if (found) targetUrl = found.url;
        return {
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === tabId ? { ...t, isLoading: true, error: null } : t
          ),
        };
      });
      if (!targetUrl || !targetUrl.startsWith('http')) return;

      try {
        const res = await authedFetch('/api/fetch-page', {
          method: 'POST',
          body: JSON.stringify({ url: targetUrl }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to inspect URL.');
        }
        setState((prev) => ({
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  title: data.title || t.title,
                  summary: data.description || t.summary,
                  extractedText: data.readableText,
                  isLoading: false,
                  error: data.injectionWarning || null,
                  updatedAtMs: Date.now(),
                }
              : t
          ),
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to load URL preview.';
        setState((prev) => ({
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === tabId ? { ...t, isLoading: false, error: msg } : t
          ),
        }));
      }
    },
    [authedFetch]
  );

  const openTab = useCallback(
    async (params: {
      title: string;
      url: string;
      kind: BrowserTab['kind'];
      paneIndex?: number;
      pinned?: boolean;
    }) => {
      const targetPane =
        params.paneIndex ?? state.spaces[state.activeSpaceSlug].activePaneIndex;
      const newTab: BrowserTab = {
        id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        spaceId: state.spaces[state.activeSpaceSlug].id,
        title: params.title,
        url: params.url,
        kind: params.kind,
        pinned: Boolean(params.pinned),
        paneIndex: targetPane,
        isLoading: params.kind === 'web',
        updatedAtMs: Date.now(),
      };

      setState((prev) => {
        const space = prev.spaces[prev.activeSpaceSlug];
        const demotedTabs = prev.tabs.map((t) =>
          t.spaceId === space.id && t.paneIndex === targetPane
            ? { ...t, paneIndex: -1 }
            : t
        );
        const nextHistory = [params.url, ...space.history.filter((u) => u !== params.url)].slice(
          0,
          20
        );
        return {
          ...prev,
          tabs: [...demotedTabs, newTab],
          spaces: {
            ...prev.spaces,
            [prev.activeSpaceSlug]: {
              ...space,
              history: nextHistory,
              activePaneIndex: targetPane,
            },
          },
        };
      });

      if (user?.emailVerified) {
        syncTabToFirestore(user.uid, newTab).catch(() => {});
      }

      if (params.kind === 'web') {
        await refreshWebTab(newTab.id);
      }
    },
    [state.activeSpaceSlug, state.spaces, user, refreshWebTab]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setState((prev) => {
        const target = prev.tabs.find((t) => t.id === tabId);
        const remaining = prev.tabs.filter((t) => t.id !== tabId);
        if (!target) return prev;
        // If closed tab occupied a pane, promote another tab from the same space into that pane
        const replacement = remaining.find(
          (t) => t.spaceId === target.spaceId && t.paneIndex < 0
        );
        const finalTabs =
          target.paneIndex >= 0 && replacement
            ? remaining.map((t) =>
                t.id === replacement.id ? { ...t, paneIndex: target.paneIndex } : t
              )
            : remaining;
        return { ...prev, tabs: finalTabs };
      });
      if (user?.emailVerified) {
        deleteTabFromFirestore(user.uid, tabId).catch(() => {});
      }
    },
    [user]
  );

  const togglePinTab = useCallback((tabId: string) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) =>
        t.id === tabId ? { ...t, pinned: !t.pinned } : t
      ),
    }));
  }, []);

  const focusTabInPane = useCallback((tabId: string, paneIndex?: number) => {
    setState((prev) => {
      const space = prev.spaces[prev.activeSpaceSlug];
      const targetPane = paneIndex ?? space.activePaneIndex;
      const nextTabs = prev.tabs.map((t) => {
        if (t.spaceId !== space.id) return t;
        if (t.id === tabId) return { ...t, paneIndex: targetPane };
        if (t.paneIndex === targetPane) return { ...t, paneIndex: -1 };
        return t;
      });
      return {
        ...prev,
        tabs: nextTabs,
        spaces: {
          ...prev.spaces,
          [prev.activeSpaceSlug]: { ...space, activePaneIndex: targetPane },
        },
      };
    });
  }, []);

  const navigateAddressBar = useCallback(
    async (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('gab://')) {
        const route = trimmed.replace('gab://', '').toLowerCase();
        const kindMap: Record<string, BrowserTab['kind']> = {
          mission: 'app',
          money: 'app',
          workspace: 'workspace',
          notes: 'note',
          report: 'report',
        };
        const titleMap: Record<string, string> = {
          mission: 'Mission Control · Orion',
          money: 'Money OS · Simulation',
          workspace: 'Google Workspace Hub',
          notes: 'Workspace Scratchpad',
          report: 'Chronicle Reports',
        };
        await openTab({
          title: titleMap[route] || `App · ${route}`,
          url: trimmed,
          kind: kindMap[route] || 'app',
        });
        return;
      }

      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        let hostTitle = trimmed;
        try {
          hostTitle = new URL(trimmed).hostname;
        } catch {}
        await openTab({
          title: hostTitle,
          url: trimmed,
          kind: 'web',
        });
        return;
      }

      // Otherwise treat as a domain if it looks like one, or a Gemini query in the sidebar
      if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
        const url = `https://${trimmed}`;
        await openTab({
          title: trimmed,
          url,
          kind: 'web',
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        sidebarOpen: true,
        sidebarTab: 'gemini',
      }));
    },
    [openTab]
  );

  const setSidebarOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, sidebarOpen: open }));
  }, []);

  const setSidebarTab = useCallback((tab: SidebarTabId) => {
    setState((prev) => ({ ...prev, sidebarOpen: true, sidebarTab: tab }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    setState((prev) => ({ ...prev, focusMode: !prev.focusMode }));
  }, []);

  const toggleZenMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      zenMode: !prev.zenMode,
      sidebarOpen: prev.zenMode ? true : false,
    }));
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, msg],
    }));
  }, []);

  const updateLastModelMessage = useCallback(
    (id: string, content: string, groundingUrls?: ChatMessage['groundingUrls']) => {
      setState((prev) => ({
        ...prev,
        chatMessages: prev.chatMessages.map((m) =>
          m.id === id
            ? {
                ...m,
                content,
                ...(groundingUrls ? { groundingUrls } : {}),
              }
            : m
        ),
      }));
    },
    []
  );

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, chatMessages: [] }));
  }, []);

  const saveCustomAgent = useCallback(
    (agent: CustomAgentConfig) => {
      const updated = { ...agent, updatedAtMs: Date.now() };
      setState((prev) => {
        const exists = prev.customAgents.some((a) => a.id === updated.id);
        return {
          ...prev,
          customAgents: exists
            ? prev.customAgents.map((a) => (a.id === updated.id ? updated : a))
            : [updated, ...prev.customAgents],
        };
      });
      if (user?.emailVerified) {
        saveCustomAgentToFirestore(user.uid, updated).catch(() => {});
      }
      logActivity({
        agentId: updated.id,
        eventType: 'COMMAND',
        summary: `Saved custom agent "${updated.name}" (${updated.model}).`,
        status: 'SUCCESS',
      });
    },
    [user, logActivity]
  );

  const deleteCustomAgent = useCallback(
    (agentId: string) => {
      setState((prev) => ({
        ...prev,
        customAgents: prev.customAgents.filter((a) => a.id !== agentId),
      }));
      if (user?.emailVerified) {
        deleteCustomAgentFromFirestore(user.uid, agentId).catch(() => {});
      }
    },
    [user]
  );

  const addStudioLog = useCallback((log: AgentStudioExecutionLog) => {
    setState((prev) => ({
      ...prev,
      studioLogs: [log, ...prev.studioLogs].slice(0, 50),
    }));
  }, []);

  const executeMissionFromStep = useCallback(
    async (missionId: string, startIndex: number) => {
      let currentMission = missionsRef.current.find((m) => m.id === missionId);
      if (!currentMission) return;

      for (let i = startIndex; i < currentMission.steps.length; i++) {
        // Re-check latest mission state in case user paused or cancelled
        const latest = missionsRef.current.find((m) => m.id === missionId);
        if (
          !latest ||
          latest.status === 'PAUSED' ||
          latest.status === 'CANCELLED' ||
          latest.status === 'FAILED'
        ) {
          return;
        }
        currentMission = latest;
        const step = currentMission.steps[i];
        if (step.status === 'COMPLETED' || step.status === 'REJECTED') {
          continue;
        }

        setState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === missionId
              ? {
                  ...m,
                  status: 'RUNNING',
                  activeAgentId: step.agentId,
                  steps: m.steps.map((s) =>
                    s.id === step.id
                      ? { ...s, status: 'RUNNING', startedAtMs: Date.now() }
                      : s
                  ),
                  updatedAtMs: Date.now(),
                }
              : m
          ),
        }));

        const priorOutputs = currentMission.steps
          .slice(0, i)
          .filter((s) => s.output)
          .map((s) => ({
            agentId: s.agentId,
            title: s.title,
            output: s.output || '',
          }));

        try {
          const res = await authedFetch('/api/missions/step', {
            method: 'POST',
            body: JSON.stringify({
              missionId,
              objective: currentMission.objective,
              step,
              priorOutputs,
              model: state.settings.defaultModel,
              policy: policyRef.current,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `Step "${step.title}" failed.`);
          }

          const stepOutput: string = data.output || '';
          const approval: ApprovalRequest | null = data.approval ?? null;

          if (approval) {
            setState((prev) => ({
              ...prev,
              approvals: [approval, ...prev.approvals],
              missions: prev.missions.map((m) =>
                m.id === missionId
                  ? {
                      ...m,
                      status: 'AWAITING_APPROVAL',
                      activeAgentId: step.agentId,
                      steps: m.steps.map((s) =>
                        s.id === step.id
                          ? {
                              ...s,
                              status: 'AWAITING_APPROVAL',
                              output: stepOutput,
                            }
                          : s
                      ),
                      updatedAtMs: Date.now(),
                    }
                  : m
              ),
            }));

            if (user?.emailVerified) {
              saveApprovalToFirestore(user.uid, approval).catch(() => {});
            }

            logActivity({
              missionId,
              agentId: step.agentId,
              eventType: 'APPROVAL_REQUESTED',
              summary: `Awaiting human approval: ${approval.title}`,
              detail: approval.reason,
              status: 'WARNING',
            });
            return;
          }

          const isFinalStep = i === currentMission.steps.length - 1;
          setState((prev) => ({
            ...prev,
            missions: prev.missions.map((m) =>
              m.id === missionId
                ? {
                    ...m,
                    status: isFinalStep ? 'COMPLETED' : 'RUNNING',
                    finalReport: isFinalStep ? stepOutput : m.finalReport,
                    steps: m.steps.map((s) =>
                      s.id === step.id
                        ? {
                            ...s,
                            status: 'COMPLETED',
                            output: stepOutput,
                            completedAtMs: Date.now(),
                          }
                        : s
                    ),
                    updatedAtMs: Date.now(),
                  }
                : m
            ),
          }));

          logActivity({
            missionId,
            agentId: step.agentId,
            eventType: 'AGENT_STEP',
            summary: `${step.agentId.toUpperCase()} completed "${step.title}".`,
            detail: stepOutput.slice(0, 600),
            status: 'SUCCESS',
          });

          if (isFinalStep) {
            const report: SavedReport = {
              id: `rep_${missionId}`,
              missionId,
              title: currentMission.title,
              content: stepOutput,
              createdAtMs: Date.now(),
            };
            setState((prev) => ({
              ...prev,
              reports: [report, ...prev.reports],
            }));
            if (user?.emailVerified) {
              saveReportToFirestore(user.uid, report).catch(() => {});
            }
            logActivity({
              missionId,
              agentId: 'chronicle',
              eventType: 'MISSION_COMPLETED',
              summary: `Mission "${currentMission.title}" completed and archived by Chronicle.`,
              status: 'SUCCESS',
            });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Mission step failed.';
          setState((prev) => ({
            ...prev,
            missions: prev.missions.map((m) =>
              m.id === missionId
                ? {
                    ...m,
                    status: 'FAILED',
                    error: msg,
                    steps: m.steps.map((s) =>
                      s.id === step.id ? { ...s, status: 'FAILED', output: msg } : s
                    ),
                    updatedAtMs: Date.now(),
                  }
                : m
            ),
          }));
          logActivity({
            missionId,
            agentId: step.agentId,
            eventType: 'ERROR',
            summary: `Step "${step.title}" failed: ${msg}`,
            status: 'ERROR',
          });
          return;
        }
      }
    },
    [authedFetch, logActivity, state.settings.defaultModel, user]
  );

  const startMission = useCallback(
    async (objective: string) => {
      const cleanObjective = objective.trim();
      if (!cleanObjective) return;

      const missionId = `msn_${Date.now()}`;
      const spaceId = state.spaces[state.activeSpaceSlug].id;

      const draftMission: Mission = {
        id: missionId,
        spaceId,
        title: cleanObjective.slice(0, 72),
        objective: cleanObjective,
        status: 'PLANNING',
        activeAgentId: 'orion',
        planSummary: 'Orion is decomposing the objective into specialist steps...',
        steps: [],
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        missions: [draftMission, ...prev.missions],
        activeMissionId: missionId,
        sidebarOpen: true,
        sidebarTab: 'agents',
      }));

      logActivity({
        missionId,
        agentId: 'orion',
        eventType: 'MISSION_CREATED',
        summary: `Created mission: "${cleanObjective.slice(0, 120)}"`,
        status: 'INFO',
      });

      try {
        const res = await authedFetch('/api/ai/plan', {
          method: 'POST',
          body: JSON.stringify({
            objective: cleanObjective,
            model: state.settings.defaultModel,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Orion failed to build mission plan.');
        }

        const plannedMission: Mission = {
          ...draftMission,
          title: data.title || draftMission.title,
          planSummary: data.planSummary || draftMission.planSummary,
          status: 'RUNNING',
          steps: data.steps,
          updatedAtMs: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === missionId ? plannedMission : m
          ),
        }));

        if (user?.emailVerified) {
          saveMissionToFirestore(user.uid, plannedMission).catch(() => {});
        }

        logActivity({
          missionId,
          agentId: 'orion',
          eventType: 'MISSION_PLANNED',
          summary: `Orion validated a ${plannedMission.steps.length}-step plan: ${plannedMission.planSummary}`,
          status: 'INFO',
        });

        await executeMissionFromStep(missionId, 0);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Mission planning failed.';
        setState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === missionId
              ? { ...m, status: 'FAILED', error: msg, updatedAtMs: Date.now() }
              : m
          ),
        }));
        logActivity({
          missionId,
          agentId: 'orion',
          eventType: 'ERROR',
          summary: `Planning failed: ${msg}`,
          status: 'ERROR',
        });
      }
    },
    [
      authedFetch,
      executeMissionFromStep,
      logActivity,
      state.activeSpaceSlug,
      state.settings.defaultModel,
      state.spaces,
      user,
    ]
  );

  const pauseMission = useCallback(
    (missionId: string) => {
      setState((prev) => ({
        ...prev,
        missions: prev.missions.map((m) =>
          m.id === missionId && canTransitionMissionStatus(m.status, 'PAUSED')
            ? { ...m, status: 'PAUSED', updatedAtMs: Date.now() }
            : m
        ),
      }));
      logActivity({
        missionId,
        eventType: 'COMMAND',
        summary: 'Mission paused by user.',
        status: 'WARNING',
      });
    },
    [logActivity]
  );

  const resumeMission = useCallback(
    async (missionId: string) => {
      const m = missionsRef.current.find((x) => x.id === missionId);
      if (!m) return;
      const pendingApproval = approvalsRef.current.find(
        (a) => a.missionId === missionId && a.status === 'PENDING'
      );
      if (pendingApproval) {
        logActivity({
          missionId,
          eventType: 'APPROVAL_REQUESTED',
          summary: 'Mission cannot resume until pending human approval is decided.',
          status: 'WARNING',
        });
        return;
      }

      const nextIndex = m.steps.findIndex(
        (s) => s.status === 'PENDING' || s.status === 'FAILED'
      );
      if (nextIndex === -1) return;

      setState((prev) => ({
        ...prev,
        missions: prev.missions.map((item) =>
          item.id === missionId
            ? { ...item, status: 'RUNNING', error: undefined, updatedAtMs: Date.now() }
            : item
        ),
      }));
      await executeMissionFromStep(missionId, nextIndex);
    },
    [executeMissionFromStep, logActivity]
  );

  const cancelMission = useCallback(
    (missionId: string) => {
      setState((prev) => ({
        ...prev,
        missions: prev.missions.map((m) =>
          m.id === missionId && canTransitionMissionStatus(m.status, 'CANCELLED')
            ? { ...m, status: 'CANCELLED', updatedAtMs: Date.now() }
            : m
        ),
        approvals: prev.approvals.map((a) =>
          a.missionId === missionId && a.status === 'PENDING'
            ? { ...a, status: 'REJECTED', decidedAtMs: Date.now() }
            : a
        ),
      }));
      logActivity({
        missionId,
        eventType: 'COMMAND',
        summary: 'Mission cancelled by user. Any pending approvals were aborted.',
        status: 'WARNING',
      });
    },
    [logActivity]
  );

  const selectMission = useCallback((missionId: string) => {
    setState((prev) => ({ ...prev, activeMissionId: missionId }));
  }, []);

  const createManualApproval: BrowserContextValue['createManualApproval'] =
    useCallback(
      async (input) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const dailySpentUsd = transactionsRef.current
          .filter((tx) => tx.createdAtMs >= todayStart.getTime())
          .reduce((sum, tx) => sum + tx.amountUsd, 0);

        const res = await authedFetch('/api/approvals/create', {
          method: 'POST',
          body: JSON.stringify({
            ...input,
            policy: policyRef.current,
            dailySpentUsd,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          logActivity({
            missionId: input.missionId,
            agentId: input.agentId,
            eventType: 'ERROR',
            summary: `Aegis blocked request: ${data.error}`,
            status: 'ERROR',
          });
          return null;
        }
        const approval: ApprovalRequest = data.approval;
        setState((prev) => ({
          ...prev,
          approvals: [approval, ...prev.approvals],
        }));
        if (user?.emailVerified) {
          saveApprovalToFirestore(user.uid, approval).catch(() => {});
        }
        logActivity({
          missionId: input.missionId,
          agentId: input.agentId,
          eventType: 'APPROVAL_REQUESTED',
          summary: `Approval requested: ${approval.title}`,
          status: 'WARNING',
        });
        return approval;
      },
      [authedFetch, logActivity, user]
    );

  const decideApproval = useCallback(
    async (
      approvalId: string,
      decision: 'APPROVE' | 'REJECT',
      editedParameters?: Record<string, string | number | boolean>
    ): Promise<{ ok: boolean; message: string }> => {
      const target = approvalsRef.current.find((a) => a.id === approvalId);
      if (!target) {
        return { ok: false, message: 'Approval record not found.' };
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const dailySpentUsd = transactionsRef.current
        .filter((tx) => tx.createdAtMs >= todayStart.getTime())
        .reduce((sum, tx) => sum + tx.amountUsd, 0);

      const res = await authedFetch('/api/approvals/decide', {
        method: 'POST',
        body: JSON.stringify({
          decision,
          approval: target,
          editedParameters,
          policy: policyRef.current,
          dailySpentUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        logActivity({
          missionId: target.missionId,
          agentId: target.agentId,
          eventType: 'ERROR',
          summary: `Approval decision blocked: ${data.error}`,
          status: 'ERROR',
        });
        return { ok: false, message: data.error || 'Approval validation failed.' };
      }

      const updatedApproval: ApprovalRequest = data.approval;
      const simTx: SimulatedTransaction | null = data.simulatedTransaction ?? null;

      setState((prev) => {
        const nextPolicy = simTx
          ? {
              ...prev.spendingPolicy,
              simulatedBalanceUsd: Math.max(
                0,
                Number(
                  (prev.spendingPolicy.simulatedBalanceUsd - simTx.amountUsd).toFixed(2)
                )
              ),
            }
          : prev.spendingPolicy;

        const nextMissions = prev.missions.map((m) => {
          if (m.id !== target.missionId) return m;
          return {
            ...m,
            status: decision === 'REJECT' ? ('PAUSED' as const) : ('RUNNING' as const),
            steps: m.steps.map((s) =>
              s.id === target.stepId
                ? {
                    ...s,
                    status:
                      decision === 'REJECT'
                        ? ('REJECTED' as const)
                        : ('COMPLETED' as const),
                    output:
                      decision === 'REJECT'
                        ? `${s.output || ''}\n\n[Rejected by human reviewer — no external action executed.]`.trim()
                        : `${s.output || ''}\n\n[Approved & executed: ${data.message}]`.trim(),
                    completedAtMs: Date.now(),
                  }
                : s
            ),
            updatedAtMs: Date.now(),
          };
        });

        return {
          ...prev,
          approvals: prev.approvals.map((a) =>
            a.id === approvalId ? updatedApproval : a
          ),
          missions: nextMissions,
          spendingPolicy: nextPolicy,
          simulatedTransactions: simTx
            ? [simTx, ...prev.simulatedTransactions]
            : prev.simulatedTransactions,
        };
      });

      if (user?.emailVerified) {
        saveApprovalToFirestore(user.uid, updatedApproval).catch(() => {});
        if (simTx) {
          recordSimulatedTransactionInFirestore(user.uid, simTx).catch(() => {});
          saveSpendingPolicyToFirestore(user.uid, policyRef.current).catch(() => {});
        }
      }

      logActivity({
        missionId: target.missionId,
        agentId: target.agentId,
        eventType:
          decision === 'APPROVE' ? 'ACTION_EXECUTED' : 'APPROVAL_REJECTED',
        summary: data.message,
        status: decision === 'APPROVE' ? 'SUCCESS' : 'WARNING',
      });

      // If approved on a mission with remaining steps, continue execution automatically
      if (decision === 'APPROVE') {
        const mission = missionsRef.current.find((m) => m.id === target.missionId);
        if (mission) {
          const nextIdx = mission.steps.findIndex((s) => s.status === 'PENDING');
          if (nextIdx >= 0) {
            setTimeout(() => {
              executeMissionFromStep(mission.id, nextIdx);
            }, 250);
          } else {
            const finalStep = mission.steps[mission.steps.length - 1];
            const finalContent = finalStep?.output || data.message;
            setState((prev) => ({
              ...prev,
              missions: prev.missions.map((m) =>
                m.id === mission.id
                  ? { ...m, status: 'COMPLETED', finalReport: finalContent, updatedAtMs: Date.now() }
                  : m
              ),
              reports: [
                {
                  id: `rep_${mission.id}`,
                  missionId: mission.id,
                  title: mission.title,
                  content: finalContent,
                  createdAtMs: Date.now(),
                },
                ...prev.reports.filter((r) => r.id !== `rep_${mission.id}`),
              ],
            }));
          }
        }
      }

      return { ok: true, message: data.message };
    },
    [authedFetch, executeMissionFromStep, logActivity, user]
  );

  const updateSpendingPolicy = useCallback(
    (patch: Partial<SpendingPolicy>) => {
      setState((prev) => {
        const next: SpendingPolicy = {
          ...prev.spendingPolicy,
          ...patch,
          realPaymentsEnabled: false,
        };
        if (user?.emailVerified) {
          saveSpendingPolicyToFirestore(user.uid, next).catch(() => {});
        }
        return { ...prev, spendingPolicy: next };
      });
    },
    [user]
  );

  const saveReport = useCallback(
    (title: string, content: string, missionId?: string) => {
      const report: SavedReport = {
        id: `rep_${Date.now()}`,
        missionId,
        title: title.slice(0, 180),
        content,
        createdAtMs: Date.now(),
      };
      setState((prev) => ({ ...prev, reports: [report, ...prev.reports] }));
      if (user?.emailVerified) {
        saveReportToFirestore(user.uid, report).catch(() => {});
      }
      logActivity({
        missionId,
        agentId: 'chronicle',
        eventType: 'COMMAND',
        summary: `Saved report "${report.title}".`,
        status: 'SUCCESS',
      });
    },
    [logActivity, user]
  );

  const updateSettings = useCallback(
    (patch: Partial<BrowserSettings>) => {
      setState((prev) => {
        const next = { ...prev.settings, ...patch };
        if (user?.emailVerified) {
          saveSettingsToFirestore(user.uid, next).catch(() => {});
        }
        return { ...prev, settings: next };
      });
    },
    [user]
  );

  const resetLocalWorkspace = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(getInitialState());
  }, []);

  const handleSignIn = useCallback(async () => {
    const signedInUser = await signInWithGoogleIdentity();
    logActivity({
      eventType: 'COMMAND',
      summary: `Signed in via Firebase Google Auth (${signedInUser.displayName || 'User'}).`,
      status: 'SUCCESS',
    });
  }, [logActivity]);

  const handleConnectWorkspace = useCallback(
    async (scopes?: string[]) => {
      const res = await connectGoogleWorkspaceScopes(scopes);
      setUser(res.user);
      setWorkspaceToken(res.accessToken);
      logActivity({
        eventType: 'WORKSPACE_API',
        summary: `Connected Google Workspace with ${res.scopes.length} authorized scopes.`,
        status: 'SUCCESS',
      });
    },
    [logActivity]
  );

  const handleDisconnectWorkspace = useCallback(() => {
    import('@/lib/firebase/client').then((m) => m.clearWorkspaceToken());
    setWorkspaceToken(null);
    logActivity({
      eventType: 'WORKSPACE_API',
      summary: 'Disconnected Google Workspace session token from memory.',
      status: 'INFO',
    });
  }, [logActivity]);

  const handleSignOut = useCallback(async () => {
    await signOutFirebase();
    setUser(null);
    setWorkspaceToken(null);
    logActivity({
      eventType: 'COMMAND',
      summary: 'Signed out of Firebase Authentication.',
      status: 'INFO',
    });
  }, [logActivity]);

  const value: BrowserContextValue = {
    ...state,
    user,
    authReady,
    workspaceToken,
    connections,
    commandPaletteOpen,
    setCommandPaletteOpen,
    discoveryOpen,
    setDiscoveryOpen,
    firestoreStatus,
    activeSpace,
    spaceTabs,
    activeTab,
    switchSpace,
    setSplitLayout,
    setPaneSplitRatio,
    setActivePane,
    swapPaneTabs,
    updateSpaceNotes,
    openTab,
    closeTab,
    togglePinTab,
    focusTabInPane,
    navigateAddressBar,
    refreshWebTab,
    setSidebarOpen,
    setSidebarTab,
    toggleFocusMode,
    toggleZenMode,
    addChatMessage,
    updateLastModelMessage,
    clearChat,
    saveCustomAgent,
    deleteCustomAgent,
    addStudioLog,
    startMission,
    pauseMission,
    resumeMission,
    cancelMission,
    selectMission,
    createManualApproval,
    decideApproval,
    updateSpendingPolicy,
    saveReport,
    updateSettings,
    resetLocalWorkspace,
    logActivity,
    handleSignIn,
    handleConnectWorkspace,
    handleDisconnectWorkspace,
    handleSignOut,
    authedFetch,
  };

  return (
    <BrowserStateContext.Provider value={value}>
      {children}
    </BrowserStateContext.Provider>
  );
}
