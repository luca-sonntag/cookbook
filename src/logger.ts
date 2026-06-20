import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.resolve('logs', 'gemini');

/** Ensure the log directory exists (created once at startup or on first use). */
async function ensureLogDir(): Promise<void> {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Pricing table (Google AI Studio / Gemini API, approximate as of June 2026)
// Prices are in USD per 1,000,000 tokens.
// Sources: https://aistudio.google.com/pricing
// ---------------------------------------------------------------------------
interface ModelPricing {
  /** USD per 1M input tokens  (≤128K context window) */
  inputShort: number;
  /** USD per 1M input tokens  (>128K context window) */
  inputLong: number;
  /** USD per 1M output tokens (≤128K context window) */
  outputShort: number;
  /** USD per 1M output tokens (>128K context window) */
  outputLong: number;
}

const PRICING: Record<string, ModelPricing> = {
  'gemini-1.5-flash': {
    inputShort: 0.075,
    inputLong:  0.15,
    outputShort: 0.30,
    outputLong:  0.60,
  },
  'gemini-1.5-flash-8b': {
    inputShort: 0.0375,
    inputLong:  0.075,
    outputShort: 0.15,
    outputLong:  0.30,
  },
  'gemini-1.5-pro': {
    inputShort: 1.25,
    inputLong:  2.50,
    outputShort: 5.00,
    outputLong:  10.00,
  },
  'gemini-2.0-flash': {
    inputShort: 0.10,
    inputLong:  0.10,
    outputShort: 0.40,
    outputLong:  0.40,
  },
  'gemini-2.0-flash-lite': {
    inputShort: 0.075,
    inputLong:  0.075,
    outputShort: 0.30,
    outputLong:  0.30,
  },
  'gemini-2.5-flash': {
    inputShort: 0.15,
    inputLong:  0.15,
    outputShort: 0.60,
    outputLong:  2.50, // thinking tokens are more expensive
  },
  'gemini-2.5-pro': {
    inputShort: 1.25,
    inputLong:  2.50,
    outputShort: 10.00,
    outputLong:  15.00,
  },
};

/** 128K token boundary used for short vs. long pricing */
const LONG_CONTEXT_THRESHOLD = 128_000;

export interface TokenUsage {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  /** USD cost for input tokens */
  inputCostUsd: number;
  /** USD cost for output tokens */
  outputCostUsd: number;
  /** Total USD cost */
  totalCostUsd: number;
  /** Human-readable string, e.g. "$0.0042" */
  totalCostFormatted: string;
  /** Pricing tier used ("short" | "long") */
  pricingTier: 'short' | 'long';
  /** Whether the model was found in the pricing table */
  pricingKnown: boolean;
}

/**
 * Compute an approximate cost for a Gemini request given token usage and model name.
 * Falls back to gemini-1.5-flash pricing if the model is unknown.
 */
export function estimateCost(model: string, usage: TokenUsage): CostEstimate {
  // Normalise model name: strip version suffixes like "-latest", "-preview-*"
  const normalisedModel = model.replace(/-latest$/, '').replace(/-preview.*$/, '');
  const pricing = PRICING[normalisedModel];
  const pricingKnown = !!pricing;
  const p = pricing ?? PRICING['gemini-1.5-flash'];

  const tier = usage.promptTokens > LONG_CONTEXT_THRESHOLD ? 'long' : 'short';
  const inputRate  = tier === 'long' ? p.inputLong  : p.inputShort;
  const outputRate = tier === 'long' ? p.outputLong : p.outputShort;

  const inputCostUsd  = (usage.promptTokens    / 1_000_000) * inputRate;
  const outputCostUsd = (usage.candidateTokens / 1_000_000) * outputRate;
  const totalCostUsd  = inputCostUsd + outputCostUsd;

  return {
    inputCostUsd:       parseFloat(inputCostUsd.toFixed(6)),
    outputCostUsd:      parseFloat(outputCostUsd.toFixed(6)),
    totalCostUsd:       parseFloat(totalCostUsd.toFixed(6)),
    totalCostFormatted: `$${totalCostUsd.toFixed(4)}`,
    pricingTier:        tier,
    pricingKnown,
  };
}

// ---------------------------------------------------------------------------

export type GeminiRequestType = 'extract_recipe' | 'select_best_frame';

export interface GeminiLogEntry {
  /** ISO timestamp of when the request was initiated */
  timestamp: string;
  /** Which Gemini function was called */
  requestType: GeminiRequestType;
  /** Model used for this request */
  model: string;
  /** Duration of the entire Gemini call in milliseconds */
  durationMs: number;
  /** Whether the request succeeded */
  success: boolean;
  /** Human-readable error message when success is false */
  error?: string;
  /** Inputs sent to Gemini */
  input: Record<string, unknown>;
  /** Raw text response from Gemini (before parsing) */
  rawOutput?: string;
  /** Parsed JSON output (when available) */
  parsedOutput?: unknown;
  /** Token counts from usageMetadata */
  tokenUsage?: TokenUsage;
  /** Approximate cost breakdown */
  costEstimate?: CostEstimate;
}

/**
 * Write a single Gemini request/response log as a JSON file.
 *
 * Filename pattern:
 *   <ISO-timestamp>_<requestType>_<random-4-hex>.json
 *   e.g. 2026-06-20T13-45-00-123Z_extract_recipe_a3f1.json
 */
export async function writeGeminiLog(entry: GeminiLogEntry): Promise<void> {
  try {
    await ensureLogDir();

    // Replace colons and periods with dashes so the filename is Windows-safe
    const safeTimestamp = entry.timestamp.replace(/[:.]/g, '-');
    const suffix = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0');
    const filename = `${safeTimestamp}_${entry.requestType}_${suffix}.json`;
    const filepath = path.join(LOG_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(entry, null, 2), 'utf-8');

    const costStr = entry.costEstimate
      ? ` | cost≈${entry.costEstimate.totalCostFormatted}`
      : '';
    const tokenStr = entry.tokenUsage
      ? ` | tokens: ${entry.tokenUsage.totalTokens} (in ${entry.tokenUsage.promptTokens} / out ${entry.tokenUsage.candidateTokens})`
      : '';
    console.log(`[GeminiLogger] ${entry.requestType} ${entry.success ? '✓' : '✗'}${tokenStr}${costStr} → ${filepath}`);
  } catch (err: any) {
    // Never let logging failures crash the main flow
    console.error('[GeminiLogger] Failed to write log:', err.message);
  }
}
