import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyRequestSession } from '@/lib/server/auth';
import { checkRateLimit, evaluateActionPolicy } from '@/lib/security';
import { validateAndConsumeApproval } from '@/lib/server/approval-store';
import { DEFAULT_SPENDING_POLICY } from '@/lib/default-workspace';
import type { ApprovalRequest } from '@/lib/types';

const DecideSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  approval: z.object({
    id: z.string().min(1),
    missionId: z.string().min(1),
    stepId: z.string().min(1),
    agentId: z.string().min(1),
    actionType: z.enum([
      'SPEND_MONEY_SIMULATED',
      'SEND_EMAIL',
      'CREATE_CALENDAR_EVENT',
      'WRITE_DRIVE_FILE',
      'UPDATE_GOOGLE_DOC',
      'DELETE_CONTENT',
      'PUBLISH_CONTENT',
      'SHARE_FILE',
    ]),
    title: z.string(),
    reason: z.string(),
    targetService: z.string(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimatedCostUsd: z.number().optional(),
    requiredScopes: z.array(z.string()).optional(),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED']),
    serverToken: z.string().min(1),
    payloadHash: z.string().min(1),
    expiresAtMs: z.number(),
    createdAtMs: z.number(),
  }),
  editedParameters: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  policy: z
    .object({
      monthlyBudgetUsd: z.number(),
      perTxLimitUsd: z.number(),
      dailyLimitUsd: z.number(),
      simulatedBalanceUsd: z.number(),
      requireApprovalAboveUsd: z.number(),
      realPaymentsEnabled: z.literal(false),
    })
    .optional(),
  dailySpentUsd: z.number().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const session = await verifyRequestSession(req);
  const rate = checkRateLimit(`approvals-decide:${session.uid}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = DecideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid approval decision payload.' },
      { status: 400 }
    );
  }

  const { decision, approval, editedParameters, policy, dailySpentUsd = 0 } = parsed.data;
  const effectivePolicy = policy ?? DEFAULT_SPENDING_POLICY;

  // A valid approval signature is necessary but not sufficient for a live
  // third-party account change. Deployment operators must opt in separately.
  // Keep the demonstration usable for guests with simulated payments only.
  if (decision === 'APPROVE' && approval.actionType !== 'SPEND_MONEY_SIMULATED') {
    if (!session.authenticated) {
      return NextResponse.json(
        { error: 'Sign in with Google is required for account-writing actions.', executed: false },
        { status: 401 }
      );
    }
    if (process.env.ENABLE_APPROVED_GOOGLE_WRITES !== 'true') {
      return NextResponse.json(
        { error: 'Live Google Workspace writes are disabled for this deployment.', executed: false },
        { status: 403 }
      );
    }
  }

  if (decision === 'APPROVE') {
    const aegis = evaluateActionPolicy(
      {
        actionType: approval.actionType,
        title: approval.title,
        reason: approval.reason,
        targetService: approval.targetService as
          | 'money_os'
          | 'gmail'
          | 'calendar'
          | 'drive'
          | 'docs'
          | 'chronicle',
        riskLevel: approval.riskLevel,
        estimatedCostUsd: approval.estimatedCostUsd,
        parameters: editedParameters ?? approval.parameters,
      },
      effectivePolicy,
      dailySpentUsd
    );

    if (!aegis.allowedToProceed) {
      return NextResponse.json(
        { error: aegis.policyReasons.join(' '), executed: false },
        { status: 403 }
      );
    }
  }

  const validation = validateAndConsumeApproval({
    approval: approval as ApprovalRequest,
    ownerId: session.uid,
    decision,
    editedParameters,
  });

  if (!validation.ok || !validation.approval) {
    return NextResponse.json(
      { error: validation.reason || 'Approval validation failed.', executed: false },
      { status: 403 }
    );
  }

  if (decision === 'REJECT') {
    return NextResponse.json({
      executed: false,
      approval: validation.approval,
      message: 'Action rejected by human reviewer. No side effects were executed.',
    });
  }

  // Execute ONLY the exact approved action
  const workspaceToken = req.headers.get('x-workspace-token');
  const approved = validation.approval;
  let executionResult = '';
  let simulatedTransaction = null;

  if (approved.actionType === 'SPEND_MONEY_SIMULATED') {
    const amount = Number(
      approved.parameters.amountUsd ?? approved.estimatedCostUsd ?? 0
    );
    simulatedTransaction = {
      id: `simtx_${Date.now()}`,
      approvalId: approved.id,
      missionId: approved.missionId,
      merchant: String(approved.parameters.merchant || 'Simulated Vendor'),
      description: String(approved.parameters.description || approved.title),
      amountUsd: amount,
      isSimulated: true as const,
      createdAtMs: Date.now(),
    };
    executionResult = `Recorded SIMULATED transaction of $${amount.toFixed(2)} for ${simulatedTransaction.merchant}. (Simulation Mode — no real funds settled.)`;
  } else if (approved.actionType === 'WRITE_DRIVE_FILE' && workspaceToken) {
    const fileName = String(approved.parameters.fileName || 'Agentic_Browser_Report.md');
    const content = String(approved.parameters.contentPreview || approved.title);
    const metadata = { name: fileName, mimeType: 'text/plain' };
    const boundary = 'gab_multipart_boundary';
    const multipartBody =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n` +
      content +
      `\r\n--${boundary}--`;

    const driveRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${workspaceToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      return NextResponse.json(
        {
          error: `Google Drive upload failed (HTTP ${driveRes.status}): ${errText.slice(0, 200)}`,
          executed: false,
        },
        { status: driveRes.status }
      );
    }
    const driveData = (await driveRes.json()) as { id?: string; name?: string };
    executionResult = `Saved file "${driveData.name || fileName}" to Google Drive (ID: ${driveData.id}).`;
  } else if (approved.actionType === 'CREATE_CALENDAR_EVENT' && workspaceToken) {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${workspaceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: String(approved.parameters.summary || approved.title),
          description: String(approved.parameters.description || approved.reason),
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        }),
      }
    );
    if (!calRes.ok) {
      const errText = await calRes.text();
      return NextResponse.json(
        {
          error: `Google Calendar write failed (HTTP ${calRes.status}): ${errText.slice(0, 200)}`,
          executed: false,
        },
        { status: calRes.status }
      );
    }
    const calData = (await calRes.json()) as { id?: string; htmlLink?: string };
    executionResult = `Created Google Calendar event (ID: ${calData.id}).`;
  } else if (approved.actionType === 'SEND_EMAIL' && workspaceToken) {
    const to = String(approved.parameters.to || '');
    const subject = String(approved.parameters.subject || approved.title);
    const msgBody = String(approved.parameters.body || approved.reason);
    const rawMime = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${msgBody}`;
    const encoded = Buffer.from(rawMime, 'utf8').toString('base64url');
    const gmailRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${workspaceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encoded }),
      }
    );
    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      return NextResponse.json(
        {
          error: `Gmail send failed (HTTP ${gmailRes.status}): ${errText.slice(0, 200)}`,
          executed: false,
        },
        { status: gmailRes.status }
      );
    }
    const gmailData = (await gmailRes.json()) as { id?: string };
    executionResult = `Sent email to ${to} via Gmail (Message ID: ${gmailData.id}).`;
  } else {
    // Chronicle local report archive or Workspace disconnected honest note
    const needsWorkspace =
      approved.targetService === 'drive' ||
      approved.targetService === 'docs' ||
      approved.targetService === 'calendar' ||
      approved.targetService === 'gmail';

    if (needsWorkspace && !workspaceToken) {
      executionResult = `Approved locally and archived to Chronicle Reports. External ${approved.targetService} sync skipped because Google Workspace is disconnected — connect Workspace in the Connect tab to push externally.`;
    } else {
      executionResult = `Approved and archived locally by Chronicle (${approved.actionType}).`;
    }
  }

  return NextResponse.json({
    executed: true,
    approval: {
      ...approved,
      executionResult,
    },
    simulatedTransaction,
    message: executionResult,
  });
}
