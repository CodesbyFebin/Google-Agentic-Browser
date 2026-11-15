export interface GeminiModelInfo {
  id: string;
  label: string;
  category: 'text' | 'image' | 'video';
  tier: 'standard' | 'paid';
  description: string;
  supportsThinking: boolean;
  inputCostPer1MTokensUsd: number;
  outputCostPer1MTokensUsd: number;
}

// A documented stable Gemini API model. Hydrogen is available only if an
// account explicitly has access to the experimental model ID in AI Studio.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Hydrogen (access-dependent preview)',
    category: 'text',
    tier: 'standard',
    description: 'Experimental AI Studio identifier. May be unavailable through the public Gemini API.',
    supportsThinking: true,
    inputCostPer1MTokensUsd: 0.15,
    outputCostPer1MTokensUsd: 0.6,
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    category: 'text',
    tier: 'standard',
    description: 'Ultra-low-latency model for quick tab summaries and classifications.',
    supportsThinking: true,
    inputCostPer1MTokensUsd: 0.075,
    outputCostPer1MTokensUsd: 0.3,
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    category: 'text',
    tier: 'paid',
    description: 'Advanced reasoning and coding model (requires paid API key).',
    supportsThinking: true,
    inputCostPer1MTokensUsd: 1.25,
    outputCostPer1MTokensUsd: 5.0,
  },
  {
    id: 'gemini-4-carbon',
    label: 'Gemini 4 Carbon',
    category: 'text',
    tier: 'paid',
    description: 'Deep architectural & security auditing model (requires paid API key).',
    supportsThinking: true,
    inputCostPer1MTokensUsd: 2.5,
    outputCostPer1MTokensUsd: 10.0,
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    label: 'Nano Banana 2 Lite (Image)',
    category: 'image',
    tier: 'paid',
    description: 'Image generation model (requires paid API key; shows honest status if unavailable).',
    supportsThinking: false,
    inputCostPer1MTokensUsd: 0.3,
    outputCostPer1MTokensUsd: 1.2,
  },
  {
    id: 'gemini-omni-1.2-flash',
    label: 'Gemini Omni 1.2 Flash (Video)',
    category: 'video',
    tier: 'paid',
    description: 'Video generation via Interactions API (requires paid API key).',
    supportsThinking: false,
    inputCostPer1MTokensUsd: 1.0,
    outputCostPer1MTokensUsd: 4.0,
  },
];

export const ALLOWED_TEXT_MODEL_IDS = new Set(
  GEMINI_MODELS.filter((m) => m.category === 'text').map((m) => m.id)
);

export function resolveSupportedModel(requested?: string): string {
  if (requested && ALLOWED_TEXT_MODEL_IDS.has(requested)) {
    return requested;
  }
  const envDefault =
    typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined;
  if (envDefault && ALLOWED_TEXT_MODEL_IDS.has(envDefault)) {
    return envDefault;
  }
  return DEFAULT_GEMINI_MODEL;
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateCostUsd(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const info =
    GEMINI_MODELS.find((m) => m.id === modelId) ?? GEMINI_MODELS[0];
  const cost =
    (inputTokens / 1_000_000) * info.inputCostPer1MTokensUsd +
    (outputTokens / 1_000_000) * info.outputCostPer1MTokensUsd;
  return Number(cost.toFixed(6));
}
