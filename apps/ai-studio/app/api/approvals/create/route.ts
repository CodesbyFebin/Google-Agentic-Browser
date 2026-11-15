import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyRequestSession } from '@/lib/server/auth';
import { checkRateLimit, evaluateActionPolicy } from '@/lib/security';
import { createServerApproval } from '@/lib/server/approval-store';
import { DEFAULT_SPENDING_POLICY } from '@/lib/default-workspace';

const CreateApprovalSchema = z.object({
  missionId: z.string().min(1).max(128),
  stepId: z.string().min(1).max(128),
  agentId: z.string().min(1).max(64),
  action: z.object({
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
    title: z.string().min(1).max(180),
    reason: z.string().min(1).max(1000),
    targetService: z.enum(['money_os', 'gmail', 'calendar', 'drive', 'docs', 'chronicle']),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimatedCostUsd: z.number().min(0).max(100000).optional(),
    requiredScopes: z.array(z.string()).max(10).optional(),
    parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  }),
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
  const rate = checkRateLimit(`approvals-create:${session.uid}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = CreateApprovalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid approval creation payload.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { missionId, stepId, agentId, action, policy, dailySpentUsd = 0 } = parsed.data;
  const effectivePolicy = policy ?? DEFAULT_SPENDING_POLICY;
  const aegis = evaluateActionPolicy(action, effectivePolicy, dailySpentUsd);

  if (!aegis.allowedToProceed) {
    return NextResponse.json(
      {
        error: aegis.policyReasons.join(' '),
        blockedByAegis: true,
        riskLevel: aegis.riskLevel,
      },
      { status: 403 }
    );
  }

  const approval = createServerApproval({
    ownerId: session.uid,
    missionId,
    stepId,
    agentId,
    action,
    riskLevel: aegis.riskLevel,
  });

  return NextResponse.json({ approval, policyReasons: aegis.policyReasons });
}
