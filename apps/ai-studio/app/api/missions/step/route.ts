import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGeminiClient, normalizeGeminiError, requireGeminiSession, withGeminiRetry } from '@/lib/server/gemini';
import { checkRateLimit, evaluateActionPolicy, wrapUntrustedContent } from '@/lib/security';
import { CORE_AGENTS } from '@/lib/agents/registry';
import { resolveSupportedModel } from '@/lib/models';
import { createServerApproval } from '@/lib/server/approval-store';
import type { ProposedActionPayload, SpendingPolicy } from '@/lib/types';
import { DEFAULT_SPENDING_POLICY } from '@/lib/default-workspace';

const StepSchema = z.object({
  missionId: z.string().min(1).max(128),
  objective: z.string().min(1).max(4000),
  step: z.object({
    id: z.string().min(1).max(128),
    agentId: z.enum(['orion', 'rover', 'atlas', 'aegis', 'mercury', 'chronicle']),
    title: z.string().min(1).max(200),
    instruction: z.string().min(1).max(2000),
    requiresApproval: z.boolean().optional(),
  }),
  priorOutputs: z
    .array(
      z.object({
        agentId: z.string(),
        title: z.string(),
        output: z.string(),
      })
    )
    .max(10)
    .optional(),
  model: z.string().max(64).optional(),
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
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireGeminiSession(req);
    const rate = checkRateLimit(`mission-step:${session.uid}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = StepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid mission step payload.' }, { status: 400 });
    }

    const { missionId, objective, step, priorOutputs = [], model, policy } = parsed.data;
    const agent = CORE_AGENTS[step.agentId];
    const activeModel = resolveSupportedModel(model);
    const ai = getGeminiClient();

    const priorContext = priorOutputs
      .map((p) => `[${p.agentId.toUpperCase()} — ${p.title}]\n${p.output.slice(0, 2500)}`)
      .join('\n\n');

    const prompt = [
      `Mission Objective: ${objective}`,
      `Current Step: ${step.title}`,
      `Instruction: ${step.instruction}`,
      priorContext ? wrapUntrustedContent('Prior Agent Outputs', priorContext) : '',
      step.agentId === 'mercury'
        ? 'Prepare a realistic simulated procurement recommendation with estimated monthly/one-time USD cost. Clearly note Simulation Mode.'
        : '',
      step.agentId === 'chronicle'
        ? 'Produce a clean, comprehensive Markdown final report synthesizing all findings and recommendations.'
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const useSearch = step.agentId === 'rover';

    const response = await withGeminiRetry(async () => {
      return ai.models.generateContent({
        model: activeModel,
        contents: prompt,
        config: {
          systemInstruction: agent.systemInstruction,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });
    });

    const output = response.text ?? 'Step completed with no text output.';

    // Determine if this step requires a server-enforced Human Approval checkpoint
    let approval = null;
    const effectivePolicy: SpendingPolicy = policy ?? DEFAULT_SPENDING_POLICY;
    const shouldGate =
      Boolean(step.requiresApproval) ||
      step.agentId === 'mercury' ||
      /save.*(drive|doc)|send.*email|calendar|purchase|buy|subscribe/i.test(
        `${step.title} ${step.instruction}`
      );

    if (shouldGate) {
      const isSpend = step.agentId === 'mercury' || /purchase|buy|subscribe|spend/i.test(step.title);
      const isDrive = /drive|doc|save.*report|export/i.test(`${step.title} ${step.instruction}`);
      const isEmail = /email|gmail|send/i.test(`${step.title} ${step.instruction}`);
      const isCalendar = /calendar|meeting|event/i.test(`${step.title} ${step.instruction}`);

      const action: ProposedActionPayload = isSpend
        ? {
            actionType: 'SPEND_MONEY_SIMULATED',
            title: `Simulated Procurement: ${step.title}`,
            reason: 'Mercury prepared a simulated purchase decision requiring human authorization.',
            targetService: 'money_os',
            riskLevel: 'HIGH',
            estimatedCostUsd: 49,
            parameters: {
              merchant: 'Selected SaaS Vendor (Simulation)',
              description: step.title.slice(0, 140),
              amountUsd: 49,
              isSimulated: true,
            },
          }
        : isEmail
        ? {
            actionType: 'SEND_EMAIL',
            title: `Send Email Draft: ${step.title}`,
            reason: 'Sending outgoing Gmail messages requires explicit human approval.',
            targetService: 'gmail',
            riskLevel: 'HIGH',
            requiredScopes: ['https://www.googleapis.com/auth/gmail.compose'],
            parameters: {
              to: 'recipient@example.com',
              subject: `Mission Update: ${objective.slice(0, 60)}`,
              body: output.slice(0, 1200),
            },
          }
        : isCalendar
        ? {
            actionType: 'CREATE_CALENDAR_EVENT',
            title: `Create Calendar Event: ${step.title}`,
            reason: 'Modifying Google Calendar requires explicit human approval.',
            targetService: 'calendar',
            riskLevel: 'MEDIUM',
            requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
            parameters: {
              summary: step.title.slice(0, 100),
              description: output.slice(0, 600),
            },
          }
        : {
            actionType: 'WRITE_DRIVE_FILE',
            title: isDrive ? `Save Report to Google Drive / Archive` : `Approve Action: ${step.title}`,
            reason: 'External write or publishing action gated by Aegis policy.',
            targetService: isDrive ? 'drive' : 'chronicle',
            riskLevel: 'MEDIUM',
            requiredScopes: isDrive
              ? ['https://www.googleapis.com/auth/drive.file']
              : undefined,
            parameters: {
              fileName: `${objective.slice(0, 40).replace(/[^a-zA-Z0-9 _-]/g, '') || 'Mission_Report'}.md`,
              contentPreview: output.slice(0, 800),
            },
          };

      const aegisCheck = evaluateActionPolicy(action, effectivePolicy, 0);
      if (aegisCheck.requiresHumanApproval) {
        approval = createServerApproval({
          ownerId: session.uid,
          missionId,
          stepId: step.id,
          agentId: step.agentId,
          action,
          riskLevel: aegisCheck.riskLevel,
        });
      }
    }

    return NextResponse.json({
      stepId: step.id,
      agentId: step.agentId,
      output,
      model: activeModel,
      approval,
      status: approval ? 'AWAITING_APPROVAL' : 'COMPLETED',
    });
  } catch (err) {
    const normalized = normalizeGeminiError(err);
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: normalized.status }
    );
  }
}
