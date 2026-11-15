import { NextRequest, NextResponse } from 'next/server';
import { generateGemini, geminiModel, geminiResponseError } from '@/lib/gemini';
import { isAiRuntimeAllowed } from '@/lib/ai-access';

export const runtime = 'nodejs';

const AGENTS = [
  { id: 'orion', name: 'Orion', role: 'Orchestrator', description: 'Sequences a mission and delegates proposed work.' },
  { id: 'rover', name: 'Rover', role: 'Research', description: 'Proposes searches and source verification.' },
  { id: 'atlas', name: 'Atlas', role: 'Analysis', description: 'Compares evidence and explains tradeoffs.' },
  { id: 'aegis', name: 'Aegis', role: 'Safety / Policy', description: 'Identifies sensitive actions and human approval checkpoints.' },
  { id: 'mercury', name: 'Mercury', role: 'Procurement', description: 'Compares options and flags spending proposals, never purchases.' },
  { id: 'chronicle', name: 'Chronicle', role: 'Knowledge / Records', description: 'Drafts reports and proposed activity records.' },
] as const;

const SYSTEM = `You are the planning engine inside an independent Google Agentic Browser prototype.
Act as Agent Studio with six specialized planning personas: Orion, Rover, Atlas, Aegis, Mercury, Chronicle.
Create a realistic, specific 3-7 step PLAN, not an execution transcript.
NO external actions, browser visits, Google Workspace writes, purchases, sending messages,
publishing, or account permissions are executed by this endpoint.
Never invent retrieved citations, API outcomes, prices, addresses, or browsing results.
For actions involving sending, purchasing, deleting, publishing, sharing, granting access,
or changing external state, set requiresApproval true and explain the human checkpoint.
Return a single JSON object:
{"overview":"short goal-specific summary","steps":[{"agent":"orion|rover|atlas|aegis|mercury|chronicle","title":"imperative 2-7 words","detail":"specific proposed action, not past-tense execution","requiresApproval":false}],"nextAction":"specific safe next step for the human"}.
Do not include credentials or secrets. All steps are proposed and unexecuted.`;

const RISKY_ACTIONS = /\b(send|email|purchase|buy|pay|charge|refund|delete|remove|publish|post|share|grant|revoke|invite|transfer|submit|book|schedule|create|edit|modify|update|write|change permission)\b/i;

type StudioStep = {
  agent: string;
  title: string;
  detail: string;
  requiresApproval: boolean;
  status: 'proposed';
};

export async function POST(req: NextRequest) {
  if (!isAiRuntimeAllowed()) return NextResponse.json({ error: 'Live AI is disabled on public deployments until Firebase Auth and durable quotas are enabled.' }, { status: 503 });
  try {
    const payload = await req.json().catch(() => ({}));
    const goal = typeof payload.goal === 'string' ? payload.goal.trim() : '';
    if (!goal || goal.length > 4000) {
      return NextResponse.json({ error: 'Goal must contain 1–4000 characters.' }, { status: 400 });
    }
    const result = await generateGemini(SYSTEM, [{
      role: 'user',
      text: `Propose a safe agent workflow for this goal: ${goal}`,
    }], { json: true });
    let parsed: unknown;
    try { parsed = JSON.parse(result); } catch {
      throw new Error('Gemini did not return parseable JSON.');
    }
    const value = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    const rawSteps = Array.isArray(value.steps) ? value.steps.slice(0, 7) : [];
    const allowed = new Set(AGENTS.map(agent => agent.id));
    const steps: StudioStep[] = rawSteps.map((item: unknown) => {
      const raw = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const title = String(raw.title || 'Review the next action').slice(0, 110);
      const detail = String(raw.detail || 'Human review needed before any external operation.').slice(0, 900);
      const agent = String(raw.agent || 'orion').toLowerCase();
      return {
        agent: allowed.has(agent as typeof AGENTS[number]['id']) ? agent : 'orion',
        title,
        detail,
        requiresApproval: Boolean(raw.requiresApproval) || RISKY_ACTIONS.test(title + ' ' + detail),
        status: 'proposed' as const,
      };
    });
    if (steps.length < 2) {
      return NextResponse.json({ error: 'Gemini did not produce enough actionable plan steps. Try a more specific goal.' }, { status: 502 });
    }
    return NextResponse.json({
      goal,
      overview: String(value.overview || 'A proposed workflow for human review.').slice(0, 1200),
      nextAction: String(value.nextAction || 'Review the proposed plan.').slice(0, 350),
      steps,
      model: geminiModel(),
      live: true,
      executed: false,
      externalActionsPerformed: 0,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const result = geminiResponseError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}

export async function GET() {
  return NextResponse.json({
    agents: AGENTS,
    mode: 'propose-only',
    name: 'Agent Studio',
    note: 'Plans use Gemini when configured. The endpoint never executes browser or Workspace actions.',
  });
}
