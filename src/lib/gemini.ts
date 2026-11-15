/** Server-only Gemini integration using Google's official @google/genai SDK. */
import 'server-only';
import { ApiError, GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.8-flash';

export class GeminiError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = 'GeminiError';
  }
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

export function geminiModel(): string {
  const candidate = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  if (!/^[a-zA-Z0-9_.-]{2,80}$/.test(candidate)) {
    throw new GeminiError('Invalid GEMINI_MODEL configuration', 500);
  }
  return candidate;
}

export type GeminiTurn = { role: 'user' | 'model'; text: string };

export async function generateGemini(
  system: string,
  turns: GeminiTurn[],
  options: { json?: boolean } = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new GeminiError('Gemini is not configured. Set GEMINI_API_KEY on the server.', 503);
  if (!turns.length || turns.some(t => !t.text.trim())) {
    throw new GeminiError('A nonempty prompt is required.', 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: geminiModel(),
      contents: turns.slice(-15).map(t => ({ role: t.role, parts: [{ text: t.text.slice(0, 12000) }] })),
      config: {
        systemInstruction: system,
        abortSignal: controller.signal,
          temperature: options.json ? 0.25 : 0.6,
          maxOutputTokens: options.json ? 2600 : 1100,
          ...(options.json ? { responseMimeType: 'application/json' } : {}),
      },
    });
    const text = response.text?.trim();
    if (!text) throw new GeminiError('Gemini returned no text. Check content filters or try another prompt.', 502);
    return text;
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    if (controller.signal.aborted) throw new GeminiError('Gemini timed out. Please retry.', 504);
    if (error instanceof ApiError) {
      // Never forward upstream messages: they may include credentials or provider details.
      if ([400, 404].includes(error.status)) throw new GeminiError('The configured Gemini model or request was rejected. Check GEMINI_MODEL.', 502);
      if ([401, 403].includes(error.status)) throw new GeminiError('The Gemini API key is not authorized for this model.', 502);
      if (error.status === 429) throw new GeminiError('Gemini quota exceeded. Try again later.', 429);
    }
    throw new GeminiError('Could not reach the Gemini API.', 502);
  } finally {
    clearTimeout(timeout);
  }
}

export function geminiResponseError(error: unknown): { message: string; status: number } {
  if (error instanceof GeminiError) return { message: error.message, status: error.status };
  return { message: 'An unexpected AI service error occurred.', status: 500 };
}
