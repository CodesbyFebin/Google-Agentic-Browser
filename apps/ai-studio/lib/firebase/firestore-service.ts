'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  OperationType,
} from './client';
import type {
  ActivityEvent,
  ApprovalRequest,
  BrowserSettings,
  BrowserTab,
  CustomAgentConfig,
  Mission,
  SavedReport,
  SimulatedTransaction,
  SpaceSlug,
  SpaceState,
  SpendingPolicy,
} from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SPENDING_POLICY } from '../default-workspace';

function cleanId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
}

export async function ensureUserProfileInFirestore(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: (user.displayName || 'Workspace User').slice(0, 120),
        photoURL: (user.photoURL || '').slice(0, 512),
        defaultModel: DEFAULT_SETTINGS.defaultModel,
        defaultSplit: DEFAULT_SETTINGS.defaultSplit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    if (user.email) {
      const piiRef = doc(db, 'users', user.uid, 'private', 'info');
      const piiSnap = await getDoc(piiRef);
      if (!piiSnap.exists()) {
        await setDoc(piiRef, {
          uid: user.uid,
          email: user.email.slice(0, 254),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function saveSettingsToFirestore(
  uid: string,
  settings: BrowserSettings
): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      defaultModel: settings.defaultModel.slice(0, 64),
      defaultSplit: settings.defaultSplit,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function syncWorkspaceToFirestore(
  uid: string,
  input: {
    name?: string;
    activeSpaceSlug: SpaceSlug;
    defaultModel: string;
    sidebarOpen: boolean;
  }
): Promise<void> {
  const workspaceDocId = cleanId(`${uid}_default`);
  const path = `workspaces/${workspaceDocId}`;
  try {
    const ref = doc(db, 'workspaces', workspaceDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: workspaceDocId,
        ownerId: uid,
        name: (input.name || 'Primary Workspace').slice(0, 80),
        activeSpaceSlug: input.activeSpaceSlug,
        defaultModel: input.defaultModel.slice(0, 64),
        sidebarOpen: Boolean(input.sidebarOpen),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: (input.name || 'Primary Workspace').slice(0, 80),
        activeSpaceSlug: input.activeSpaceSlug,
        defaultModel: input.defaultModel.slice(0, 64),
        sidebarOpen: Boolean(input.sidebarOpen),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSpacesToFirestore(
  uid: string,
  spaces: Record<SpaceSlug, SpaceState>
): Promise<void> {
  for (const space of Object.values(spaces)) {
    const spaceDocId = cleanId(`${uid}_${space.id}`);
    const path = `spaces/${spaceDocId}`;
    try {
      const ref = doc(db, 'spaces', spaceDocId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          id: spaceDocId,
          ownerId: uid,
          name: space.name.slice(0, 60),
          slug: space.slug,
          splitLayout: space.splitLayout,
          notes: space.notes.slice(0, 20000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          name: space.name.slice(0, 60),
          splitLayout: space.splitLayout,
          notes: space.notes.slice(0, 20000),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function syncTabToFirestore(
  uid: string,
  tab: BrowserTab
): Promise<void> {
  const spaceDocId = cleanId(`${uid}_${tab.spaceId}`);
  const tabDocId = cleanId(`${uid}_${tab.id}`);
  const path = `tabs/${tabDocId}`;
  try {
    const ref = doc(db, 'tabs', tabDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: tabDocId,
        ownerId: uid,
        spaceId: spaceDocId,
        title: tab.title.slice(0, 160),
        url: tab.url.slice(0, 2048),
        kind: tab.kind,
        pinned: Boolean(tab.pinned),
        paneIndex: Math.min(3, Math.max(0, tab.paneIndex)),
        ...(tab.summary ? { summary: tab.summary.slice(0, 8000) } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        title: tab.title.slice(0, 160),
        url: tab.url.slice(0, 2048),
        kind: tab.kind,
        pinned: Boolean(tab.pinned),
        paneIndex: Math.min(3, Math.max(0, tab.paneIndex)),
        ...(tab.summary ? { summary: tab.summary.slice(0, 8000) } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTabFromFirestore(
  uid: string,
  tabId: string
): Promise<void> {
  const tabDocId = cleanId(`${uid}_${tabId}`);
  const path = `tabs/${tabDocId}`;
  try {
    await deleteDoc(doc(db, 'tabs', tabDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCustomAgentToFirestore(
  uid: string,
  agent: CustomAgentConfig
): Promise<void> {
  const agentDocId = cleanId(`${uid}_${agent.id}`);
  const path = `agents/${agentDocId}`;
  try {
    const ref = doc(db, 'agents', agentDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: agentDocId,
        ownerId: uid,
        name: agent.name.slice(0, 80),
        template: agent.template,
        description: agent.description.slice(0, 500),
        systemInstruction: agent.systemInstruction.slice(0, 8000),
        model: agent.model.slice(0, 64),
        tools: agent.tools.slice(0, 20),
        requireApproval: Boolean(agent.requireApproval),
        maxSteps: Math.min(20, Math.max(1, agent.maxSteps)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name: agent.name.slice(0, 80),
        template: agent.template,
        description: agent.description.slice(0, 500),
        systemInstruction: agent.systemInstruction.slice(0, 8000),
        model: agent.model.slice(0, 64),
        tools: agent.tools.slice(0, 20),
        requireApproval: Boolean(agent.requireApproval),
        maxSteps: Math.min(20, Math.max(1, agent.maxSteps)),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomAgentFromFirestore(
  uid: string,
  agentId: string
): Promise<void> {
  const agentDocId = cleanId(`${uid}_${agentId}`);
  const path = `agents/${agentDocId}`;
  try {
    await deleteDoc(doc(db, 'agents', agentDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMissionToFirestore(
  uid: string,
  mission: Mission
): Promise<void> {
  const missionDocId = cleanId(`${uid}_${mission.id}`);
  const path = `missions/${missionDocId}`;
  try {
    const ref = doc(db, 'missions', missionDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: missionDocId,
        ownerId: uid,
        spaceId: cleanId(`${uid}_${mission.spaceId}`),
        title: mission.title.slice(0, 180),
        objective: mission.objective.slice(0, 4000),
        status: mission.status === 'CREATED' || mission.status === 'PLANNING' ? mission.status : 'PLANNING',
        activeAgentId: mission.activeAgentId,
        planSummary: (mission.planSummary || '').slice(0, 4000),
        finalReport: (mission.finalReport || '').slice(0, 32000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingStatus = snap.data().status;
      if (existingStatus === 'COMPLETED' || existingStatus === 'CANCELLED') {
        return;
      }
      await updateDoc(ref, {
        title: mission.title.slice(0, 180),
        status: mission.status,
        activeAgentId: mission.activeAgentId,
        planSummary: (mission.planSummary || '').slice(0, 4000),
        finalReport: (mission.finalReport || '').slice(0, 32000),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveApprovalToFirestore(
  uid: string,
  approval: ApprovalRequest
): Promise<void> {
  const approvalDocId = cleanId(approval.id);
  const missionDocId = cleanId(`${uid}_${approval.missionId}`);
  const path = `approvals/${approvalDocId}`;
  try {
    const ref = doc(db, 'approvals', approvalDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: approvalDocId,
        ownerId: uid,
        missionId: missionDocId,
        agentId: approval.agentId.slice(0, 64),
        actionType: approval.actionType.slice(0, 64),
        title: approval.title.slice(0, 180),
        reason: approval.reason.slice(0, 1000),
        targetService: approval.targetService.slice(0, 64),
        riskLevel: approval.riskLevel,
        ...(typeof approval.estimatedCostUsd === 'number'
          ? { estimatedCostUsd: approval.estimatedCostUsd }
          : {}),
        status: 'PENDING',
        expiresAtMs: approval.expiresAtMs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (snap.data().status === 'PENDING' && approval.status !== 'PENDING') {
      await updateDoc(ref, {
        status: approval.status,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function appendActivityLogToFirestore(
  uid: string,
  event: ActivityEvent
): Promise<void> {
  const logDocId = cleanId(event.id);
  const path = `activityLogs/${logDocId}`;
  try {
    await setDoc(doc(db, 'activityLogs', logDocId), {
      id: logDocId,
      ownerId: uid,
      ...(event.missionId ? { missionId: cleanId(`${uid}_${event.missionId}`) } : {}),
      ...(event.agentId ? { agentId: event.agentId.slice(0, 64) } : {}),
      eventType: event.eventType.slice(0, 64),
      summary: event.summary.slice(0, 2000),
      status: event.status.slice(0, 32),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveReportToFirestore(
  uid: string,
  report: SavedReport
): Promise<void> {
  const reportDocId = cleanId(report.id);
  const path = `reports/${reportDocId}`;
  try {
    const ref = doc(db, 'reports', reportDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: reportDocId,
        ownerId: uid,
        ...(report.missionId ? { missionId: cleanId(`${uid}_${report.missionId}`) } : {}),
        title: report.title.slice(0, 180),
        content: report.content.slice(0, 50000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        title: report.title.slice(0, 180),
        content: report.content.slice(0, 50000),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSpendingPolicyToFirestore(
  uid: string,
  policy: SpendingPolicy
): Promise<void> {
  const policyDocId = cleanId(`policy_${uid}`);
  const path = `spendingPolicies/${policyDocId}`;
  try {
    const ref = doc(db, 'spendingPolicies', policyDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: policyDocId,
        ownerId: uid,
        monthlyBudgetUsd: policy.monthlyBudgetUsd,
        perTxLimitUsd: policy.perTxLimitUsd,
        dailyLimitUsd: policy.dailyLimitUsd,
        simulatedBalanceUsd: policy.simulatedBalanceUsd,
        realPaymentsEnabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        monthlyBudgetUsd: policy.monthlyBudgetUsd,
        perTxLimitUsd: policy.perTxLimitUsd,
        dailyLimitUsd: policy.dailyLimitUsd,
        simulatedBalanceUsd: policy.simulatedBalanceUsd,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordSimulatedTransactionInFirestore(
  uid: string,
  tx: SimulatedTransaction
): Promise<void> {
  const txDocId = cleanId(tx.id);
  const path = `simulatedTransactions/${txDocId}`;
  try {
    await setDoc(doc(db, 'simulatedTransactions', txDocId), {
      id: txDocId,
      ownerId: uid,
      approvalId: cleanId(tx.approvalId),
      ...(tx.missionId ? { missionId: cleanId(`${uid}_${tx.missionId}`) } : {}),
      merchant: tx.merchant.slice(0, 120),
      description: tx.description.slice(0, 300),
      amountUsd: tx.amountUsd,
      isSimulated: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadUserCloudState(uid: string): Promise<{
  agents: CustomAgentConfig[];
  reports: SavedReport[];
  policy: SpendingPolicy | null;
}> {
  try {
    const agentsSnap = await getDocs(
      query(collection(db, 'agents'), where('ownerId', '==', uid))
    );
    const agents: CustomAgentConfig[] = agentsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id).replace(`${uid}_`, ''),
        name: String(data.name),
        template: data.template,
        description: String(data.description || ''),
        systemInstruction: String(data.systemInstruction),
        model: String(data.model),
        tools: Array.isArray(data.tools) ? data.tools.map(String) : [],
        inputSchemaDescription: '{ "input": string }',
        outputSchemaDescription: '{ "output": string }',
        requireApproval: Boolean(data.requireApproval),
        maxSteps: Number(data.maxSteps || 4),
        updatedAtMs: Date.now(),
      };
    });

    const reportsSnap = await getDocs(
      query(collection(db, 'reports'), where('ownerId', '==', uid))
    );
    const reports: SavedReport[] = reportsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id),
        missionId: data.missionId ? String(data.missionId) : undefined,
        title: String(data.title),
        content: String(data.content),
        createdAtMs: Date.now(),
      };
    });

    const policySnap = await getDoc(doc(db, 'spendingPolicies', cleanId(`policy_${uid}`)));
    const policy = policySnap.exists()
      ? {
          monthlyBudgetUsd: Number(policySnap.data().monthlyBudgetUsd ?? DEFAULT_SPENDING_POLICY.monthlyBudgetUsd),
          perTxLimitUsd: Number(policySnap.data().perTxLimitUsd ?? DEFAULT_SPENDING_POLICY.perTxLimitUsd),
          dailyLimitUsd: Number(policySnap.data().dailyLimitUsd ?? DEFAULT_SPENDING_POLICY.dailyLimitUsd),
          simulatedBalanceUsd: Number(policySnap.data().simulatedBalanceUsd ?? DEFAULT_SPENDING_POLICY.simulatedBalanceUsd),
          requireApprovalAboveUsd: 0,
          realPaymentsEnabled: false as const,
        }
      : null;

    return { agents, reports, policy };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'user-cloud-state');
  }
}
