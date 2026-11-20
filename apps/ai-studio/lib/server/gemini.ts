import { GoogleGenAI } from '@google/genai';
import type { NextRequest } from 'next/server';
import { verifyRequestSession } from './auth';
import { redactSecrets } from '../security';

let cachedClient: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.geminiapi)?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.geminiapi)?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new GeminiServiceError(
      'MISSING_API_KEY',
      'No Gemini API key is configured on the server. Set GEMINI_API_KEY as a deployment secret.',
      503
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

export type GeminiErrorCode =
  | 'AUTH_REQUIRED'
  | 'MISSING_API_KEY'
  | 'API_KEY_INVALID'
  | 'PERMISSION_DENIED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_NOT_FOUND'
  | 'TIMEOUT'
  | 'UPSTREAM_ERROR';

export class GeminiServiceError extends Error {
  code: GeminiErrorCode;
  status: number;

  constructor(code: GeminiErrorCode, message: string, status = 500) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Never spend a deployment's Gemini quota for anonymous visitors. For local
 * demos, the operator may explicitly opt in without relaxing production auth.
 */
export async function requireGeminiSession(req: NextRequest) {
  const session = await verifyRequestSession(req);
  const localDemoAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.GEMINI_ALLOW_GUEST_DEV === 'true';
  if (!session.authenticated && !localDemoAllowed) {
    throw new GeminiServiceError(
      'AUTH_REQUIRED',
      'Sign in with Google before using the live Gemini API.',
      401
    );
  }
  return session;
}

export function normalizeGeminiError(err: unknown): GeminiServiceError {
  if (err instanceof GeminiServiceError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return new GeminiServiceError(
      'API_KEY_INVALID',
      'The configured GEMINI_API_KEY is invalid. Please check Settings > Secrets.',
      400
    );
  }
  if (lower.includes('permission_denied') || lower.includes('403')) {
    return new GeminiServiceError(
      'PERMISSION_DENIED',
      'Permission denied for this model or API key. Paid models require a billing-enabled API key in Settings > Secrets.',
      403
    );
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return new GeminiServiceError(
      'QUOTA_EXCEEDED',
      'Gemini API rate limit or quota exceeded. Retry shortly or check your API key quota.',
      429
    );
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return new GeminiServiceError(
      'MODEL_NOT_FOUND',
      'Requested Gemini model was not found or is unsupported for this account.',
      404
    );
  }
  if (lower.includes('abort') || lower.includes('timeout')) {
    return new GeminiServiceError(
      'TIMEOUT',
      'Gemini request timed out before completing.',
      504
    );
  }

  // Provider exception messages may include request data or authentication
  // details. Do not forward them verbatim to the browser.
  const safeMessage = process.env.NODE_ENV === 'development'
    ? redactSecrets(msg).slice(0, 280)
    : 'Gemini API request failed. Please retry or check your server logs.';
  return new GeminiServiceError('UPSTREAM_ERROR', safeMessage, 502);
}

/**
 * Retries transient 429/503 errors with exponential backoff and a hard timeout.
 */
export async function withGeminiRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { maxAttempts?: number; timeoutMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 2;
  const timeoutMs = options.timeoutMs ?? 45_000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await operation(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const normalized = normalizeGeminiError(err);
      const retryable =
        normalized.code === 'QUOTA_EXCEEDED' || normalized.code === 'UPSTREAM_ERROR';
      if (!retryable || attempt === maxAttempts) {
        throw normalized;
      }
      await new Promise((r) => setTimeout(r, 450 * Math.pow(2, attempt - 1)));
    }
  }
  throw normalizeGeminiError(lastError);
}
