/**
 * Shared client for the third-party AI API used by this project.
 *
 * Endpoint: https://shawon-gpt-api.vercel.app
 *   - POST { "text": "<prompt>" } (preferred, supports long prompts)
 *   - GET  ?text=<prompt>          (fallback)
 * Response shape: { success: true, input: string, reply: string, credits: string }
 *
 * This module is used by the Vercel serverless functions in `api/` and by the
 * local Express dev server in `server.ts`, so the AI integration lives in one place.
 */

export const AI_ENDPOINT = 'https://shawon-gpt-api.vercel.app/';

const DEFAULT_TIMEOUT_MS = 50_000;
const MIN_ATTEMPT_TIME_MS = 6_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function askAiOnce(prompt: string, timeoutMs: number): Promise<string> {
  // POST keeps long prompts (e.g. full textbook passages) out of the URL length limit.
  let response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ text: prompt }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  // Older deployments of the endpoint only support the documented GET form.
  if (response.status === 404 || response.status === 405 || response.status === 415) {
    response = await fetch(`${AI_ENDPOINT}?text=${encodeURIComponent(prompt)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  const bodyText = await response.text();

  let data: unknown = bodyText;
  try {
    data = JSON.parse(bodyText);
  } catch {
    // The API occasionally answers with plain text; use it as-is.
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null
        ? JSON.stringify(data).slice(0, 300)
        : String(bodyText).slice(0, 300);
    throw new Error(`AI API responded with HTTP ${response.status}: ${detail}`);
  }

  if (typeof data === 'string') {
    if (data.trim()) return data.trim();
    throw new Error('AI API returned an empty response');
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const reply = record.reply ?? record.response ?? record.result ?? record.output ?? record.text;

    if (typeof reply === 'string' && reply.trim()) return reply.trim();
    if (reply && typeof reply === 'object') return JSON.stringify(reply);

    if (record.success === false) {
      throw new Error(
        typeof record.error === 'string'
          ? record.error
          : typeof record.message === 'string'
            ? record.message
            : 'AI API reported an unsuccessful response'
      );
    }

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim();
    }
  }

  throw new Error('AI API returned an unexpected response');
}

/**
 * Sends a prompt to the third-party AI API with a total time budget and retries.
 * Retries only while there is enough time left in the budget.
 */
export async function askAi(
  prompt: string,
  options: { timeoutMs?: number; attempts?: number } = {}
): Promise<string> {
  const totalBudget = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = Math.max(1, options.attempts ?? 2);
  const startedAt = Date.now();

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remaining = totalBudget - (Date.now() - startedAt);
    if (remaining < MIN_ATTEMPT_TIME_MS) break;

    try {
      return await askAiOnce(prompt, remaining);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const wait = Math.min(1_500, Math.max(0, remaining - MIN_ATTEMPT_TIME_MS));
        if (wait > 0) await sleep(wait);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'AI request failed';
  throw new Error(message);
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractBalanced(text: string, open: string, close: string): string | null {
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function stripCodeFences(text: string): string {
  return text
    .replace(/```(?:json|javascript|js)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * Extracts the first JSON object/array found in an AI reply.
 * Handles markdown fences, double-encoded JSON and escaped quotes.
 */
export function extractJson<T = unknown>(raw: unknown): T | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw !== 'string') return null;

  const cleaned = stripCodeFences(raw);
  if (!cleaned) return null;

  const candidates: string[] = [cleaned];

  if (cleaned.includes('\\"') || cleaned.includes('\\n') || cleaned.includes('\\\\')) {
    candidates.push(
      cleaned
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\\\/g, '\\')
    );
  }

  for (const candidate of candidates) {
    const direct = tryParseJson(candidate);
    if (direct !== undefined) {
      if (typeof direct === 'string') {
        const nested = extractJson<T>(direct);
        if (nested !== null) return nested;
        continue;
      }
      if (direct && typeof direct === 'object') return direct as T;
    }

    for (const [open, close] of [
      ['{', '}'],
      ['[', ']'],
    ] as const) {
      const segment = extractBalanced(candidate, open, close);
      if (!segment) continue;

      const parsed = tryParseJson(segment);
      if (parsed && typeof parsed === 'object') return parsed as T;

      const unescaped = tryParseJson(
        segment.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
      );
      if (unescaped && typeof unescaped === 'object') return unescaped as T;
    }
  }

  return null;
}
