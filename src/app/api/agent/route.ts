import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateGemini, geminiResponseError, isGeminiConfigured } from "@/lib/gemini";
import { isAiRuntimeAllowed } from "@/lib/ai-access";

type Step = { title: string; detail: string };

const AGENT_SYSTEM = `You are the Agentic Browser task planner, not an executing browser. Given a user goal, propose 3-6 concrete steps that a browser agent could take. Do not claim you visited websites, performed actions, or verified real-world results. Each step should have:
- title: a short imperative (max 6 words), e.g. "Open Wikipedia article", "Extract key facts"
- detail: one sentence describing what the agent finds or does in that step.

Return ONLY a compact JSON object:
{"steps":[{"title":"","detail":""}, ...], "result": "<2-3 sentence summary of the proposed work, explicitly marked unexecuted>"}

No prose outside JSON. No markdown fences. Steps should describe future actions such as opening tabs, reading pages, taking notes, drafting, and summarizing. Make the steps specific to the goal while acknowledging that no actions have yet run.`;

export async function POST(req: NextRequest) {
  if (!isAiRuntimeAllowed()) return NextResponse.json({ error: 'Live AI is disabled on public deployments until Firebase Auth and durable quotas are enabled.' }, { status: 503 });
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = (body?.prompt || "").toString().trim();
    const space = (body?.space || "Work").toString();
    if (!prompt || prompt.length > 4000) {
      return NextResponse.json({ error: "prompt must contain 1–4000 characters" }, { status: 400 });
    }
    if (!isGeminiConfigured()) return NextResponse.json({ error: "Set GEMINI_API_KEY on the server to enable real AI planning." }, { status: 503 });

    // 1) Create a queued task row
    const task = await db.agentTask.create({
      data: {
        prompt,
        space,
        status: "running",
        steps: JSON.stringify([
          { title: "Planning the mission", detail: "Decomposing your goal into steps." },
        ]),
      },
    });

    // 2) Ask the LLM to produce a structured plan + result
    let steps: Step[] = [];
    let result = "";
    try {
      const raw = await generateGemini(AGENT_SYSTEM, [{ role: "user", text: prompt }], { json: true });
      const parsed = parseAgentJson(raw);
      if (parsed?.steps?.length) steps = parsed.steps.slice(0, 6);
      if (parsed?.result) result = parsed.result;
    } catch (error) {
      await db.agentTask.update({ where: { id: task.id }, data: { status: "failed", result: "AI planning request failed." } });
      const mapped = geminiResponseError(error);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    if (!steps.length) {
      await db.agentTask.update({ where: { id: task.id }, data: { status: "failed", result: "No valid plan produced." } });
      return NextResponse.json({ error: "Gemini did not produce a valid plan." }, { status: 502 });
    }
    if (!result) {
      result = `Agentic Browser prepared ${steps.length} illustrative steps for your goal. No live browsing or external actions were executed. Open the task drawer to review the plan.`;
    }

    const updated = await db.agentTask.update({
      where: { id: task.id },
      data: {
        status: "done",
        steps: JSON.stringify(steps),
        result,
      },
    });

    return NextResponse.json({ task: updated, live: true, executed: false });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Agent task failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const space = req.nextUrl.searchParams.get("space");
    const where = space ? { space } : undefined;
    const tasks = await db.agentTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ tasks });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to list tasks" },
      { status: 500 }
    );
  }
}

function parseAgentJson(raw: string): { steps?: Step[]; result?: string } | null {
  if (!raw) return null;
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract the first JSON object from the text
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
