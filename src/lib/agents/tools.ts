/** Server-side capability classification. Unknown tools are always denied. */
export type ToolClass = 'READ_ONLY' | 'INTERNAL_WRITE' | 'APPROVAL_REQUIRED_WRITE';
export type ToolDefinition = Readonly<{ classification: ToolClass; enabled: boolean; description: string }>;

export const TOOL_REGISTRY = {
  policy_check: { classification: 'READ_ONLY', enabled: true, description: 'Evaluate a proposed plan against safety policy.' },
  workspace_drive_search: { classification: 'READ_ONLY', enabled: true, description: 'List Google Drive metadata with read-only consent.' },
  workspace_docs_read: { classification: 'READ_ONLY', enabled: false, description: 'Future Docs read adapter; not connected.' },
  workspace_calendar_list: { classification: 'READ_ONLY', enabled: false, description: 'Future Calendar read adapter; not connected.' },
  workspace_gmail_read: { classification: 'READ_ONLY', enabled: false, description: 'Future Gmail read adapter; not connected.' },
  fetch_webpage: { classification: 'READ_ONLY', enabled: false, description: 'Disabled pending isolated browser runtime and authorization.' },
  save_note: { classification: 'INTERNAL_WRITE', enabled: false, description: 'Internal persistence requires authenticated user context.' },
  save_internal_report: { classification: 'INTERNAL_WRITE', enabled: false, description: 'Internal persistence requires authenticated user context.' },
  simulated_purchase: { classification: 'APPROVAL_REQUIRED_WRITE', enabled: false, description: 'Demo only; never transfers funds.' },
  workspace_drive_save: { classification: 'APPROVAL_REQUIRED_WRITE', enabled: false, description: 'External writes are not implemented.' },
  workspace_docs_create: { classification: 'APPROVAL_REQUIRED_WRITE', enabled: false, description: 'External writes are not implemented.' },
  workspace_calendar_create: { classification: 'APPROVAL_REQUIRED_WRITE', enabled: false, description: 'External writes are not implemented.' },
  workspace_gmail_send: { classification: 'APPROVAL_REQUIRED_WRITE', enabled: false, description: 'External writes are not implemented.' },
} as const satisfies Record<string, ToolDefinition>;

export function getToolClass(name: string): ToolClass | null {
  return Object.prototype.hasOwnProperty.call(TOOL_REGISTRY, name)
    ? TOOL_REGISTRY[name as keyof typeof TOOL_REGISTRY].classification : null;
}

export function isReadOnlyTool(name: string): boolean {
  return getToolClass(name) === 'READ_ONLY';
}

export function isProtectedActionTool(name: string): boolean {
  return getToolClass(name) === 'APPROVAL_REQUIRED_WRITE';
}

export function isToolEnabled(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(TOOL_REGISTRY, name)
    && TOOL_REGISTRY[name as keyof typeof TOOL_REGISTRY].enabled;
}
