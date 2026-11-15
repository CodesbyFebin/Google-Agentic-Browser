import firebaseConfig from '../../firebase-applet-config.json';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface FirestoreRestDoc {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

const configWithDb = firebaseConfig as typeof firebaseConfig & {
  firestoreDatabaseId?: string;
};

export function getFirestoreBaseUrl(): string {
  const projectId = firebaseConfig.projectId;
  const dbId = configWithDb.firestoreDatabaseId || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(dbId)}/documents`;
}

export function getFirestoreDocumentResourceName(
  collectionPath: string,
  docId: string
): string {
  const projectId = firebaseConfig.projectId;
  const dbId = configWithDb.firestoreDatabaseId || '(default)';
  const clean = sanitizeDocId(docId);
  return `projects/${projectId}/databases/${dbId}/documents/${collectionPath}/${clean}`;
}

export function sanitizeDocId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128) || 'default';
}

export function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => encodeFirestoreValue(item)),
      },
    };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = encodeFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

export function decodeFirestoreValue(val: FirestoreValue | undefined): unknown {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values ?? []).map((v) => decodeFirestoreValue(v));
  }
  if ('mapValue' in val) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields ?? {})) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return null;
}

export function decodeFirestoreDocument(
  doc: FirestoreRestDoc
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) {
    out[k] = decodeFirestoreValue(v);
  }
  return out;
}

export async function serverGetDoc(
  idToken: string,
  collectionPath: string,
  docId: string
): Promise<Record<string, unknown> | null> {
  const url = `${getFirestoreBaseUrl()}/${collectionPath}/${encodeURIComponent(
    sanitizeDocId(docId)
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore read failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const json = (await res.json()) as FirestoreRestDoc;
  return decodeFirestoreDocument(json);
}

export async function serverRunOwnerQuery(
  idToken: string,
  collectionId: string,
  ownerUid: string,
  limit = 25
): Promise<Record<string, unknown>[]> {
  const url = `${getFirestoreBaseUrl()}:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'ownerId' },
            op: 'EQUAL',
            value: { stringValue: ownerUid },
          },
        },
        limit,
      },
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore query failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const rows = (await res.json()) as Array<{ document?: FirestoreRestDoc }>;
  return rows
    .filter((r): r is { document: FirestoreRestDoc } => Boolean(r.document))
    .map((r) => decodeFirestoreDocument(r.document));
}

export async function serverUpsertWorkspace(
  idToken: string,
  ownerUid: string,
  input: {
    name?: string;
    activeSpaceSlug: 'work' | 'money' | 'personal' | 'research' | 'focus';
    defaultModel: string;
    sidebarOpen: boolean;
  }
): Promise<Record<string, unknown>> {
  const workspaceId = sanitizeDocId(`${ownerUid}_default`);
  const existing = await serverGetDoc(idToken, 'workspaces', workspaceId);
  const resourceName = getFirestoreDocumentResourceName('workspaces', workspaceId);
  const commitUrl = `${getFirestoreBaseUrl().replace(/\/documents$/, '')}/documents:commit`;

  const fields: Record<string, FirestoreValue> = {
    id: { stringValue: workspaceId },
    ownerId: { stringValue: ownerUid },
    name: { stringValue: (input.name || 'Primary Workspace').slice(0, 80) },
    activeSpaceSlug: { stringValue: input.activeSpaceSlug },
    defaultModel: { stringValue: input.defaultModel.slice(0, 64) },
    sidebarOpen: { booleanValue: Boolean(input.sidebarOpen) },
  };

  if (existing && typeof existing.createdAt === 'string') {
    fields.createdAt = { timestampValue: existing.createdAt };
  }

  const fieldTransforms: Array<{
    fieldPath: string;
    setToServerValue: 'REQUEST_TIME';
  }> = [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }];

  if (!existing) {
    fieldTransforms.push({ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' });
  }

  const writes: Record<string, unknown>[] = [
    {
      update: {
        name: resourceName,
        fields,
      },
      ...(existing
        ? {
            updateMask: {
              fieldPaths: ['name', 'activeSpaceSlug', 'defaultModel', 'sidebarOpen'],
            },
            currentDocument: { exists: true },
          }
        : {
            currentDocument: { exists: false },
          }),
      updateTransforms: fieldTransforms,
    },
  ];

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore workspace write failed (${res.status}): ${errText.slice(0, 240)}`);
  }

  return (await serverGetDoc(idToken, 'workspaces', workspaceId)) ?? {
    id: workspaceId,
    ownerId: ownerUid,
    ...input,
  };
}

export async function serverAppendActivityLog(
  idToken: string,
  ownerUid: string,
  event: {
    id: string;
    missionId?: string;
    agentId?: string;
    eventType: string;
    summary: string;
    status: string;
  }
): Promise<void> {
  const logId = sanitizeDocId(event.id);
  const resourceName = getFirestoreDocumentResourceName('activityLogs', logId);
  const commitUrl = `${getFirestoreBaseUrl().replace(/\/documents$/, '')}/documents:commit`;

  const fields: Record<string, FirestoreValue> = {
    id: { stringValue: logId },
    ownerId: { stringValue: ownerUid },
    eventType: { stringValue: event.eventType.slice(0, 64) },
    summary: { stringValue: event.summary.slice(0, 2000) },
    status: { stringValue: event.status.slice(0, 32) },
  };
  if (event.missionId) {
    fields.missionId = { stringValue: sanitizeDocId(`${ownerUid}_${event.missionId}`) };
  }
  if (event.agentId) {
    fields.agentId = { stringValue: event.agentId.slice(0, 64) };
  }

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: resourceName,
            fields,
          },
          currentDocument: { exists: false },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore activityLog write failed (${res.status}): ${errText.slice(0, 240)}`);
  }
}

export async function serverGetUserWorkspaceSnapshot(
  idToken: string,
  ownerUid: string
): Promise<{
  user: Record<string, unknown> | null;
  workspace: Record<string, unknown> | null;
  agents: Record<string, unknown>[];
  missions: Record<string, unknown>[];
  activityLogs: Record<string, unknown>[];
}> {
  const workspaceId = sanitizeDocId(`${ownerUid}_default`);
  const [user, workspace, agents, missions, activityLogs] = await Promise.all([
    serverGetDoc(idToken, 'users', ownerUid).catch(() => null),
    serverGetDoc(idToken, 'workspaces', workspaceId).catch(() => null),
    serverRunOwnerQuery(idToken, 'agents', ownerUid, 25).catch(() => []),
    serverRunOwnerQuery(idToken, 'missions', ownerUid, 25).catch(() => []),
    serverRunOwnerQuery(idToken, 'activityLogs', ownerUid, 50).catch(() => []),
  ]);

  return { user, workspace, agents, missions, activityLogs };
}
