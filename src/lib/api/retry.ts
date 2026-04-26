import { APIError } from './types';

/** HTTP status codes that are safe to retry (rate-limit / server overload). */
const RETRYABLE_STATUSES = new Set([429, 503, 529]);

/** Fallback delays (ms) for retry attempts 1 and 2 when no Retry-After header is present. */
const FALLBACK_DELAYS_MS = [5_000, 15_000];

/** Maximum number of ms we will honour from a Retry-After header. */
const MAX_RETRY_AFTER_MS = 60_000;

export interface RetryOptions {
  maxAttempts?: number;
  signal?: AbortSignal;
}

/**
 * Executes an async function with retry logic for retryable API errors.
 * Retries on 429 (rate limit), 503 (unavailable), 529 (overloaded).
 * Fails immediately on non-retryable errors (401, 400, etc.).
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (options.signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (attempt > 0) {
      let delayMs = FALLBACK_DELAYS_MS[attempt - 1] ?? 15_000;
      if (lastError instanceof APIError && lastError.retryAfter != null) {
        delayMs = Math.min(lastError.retryAfter * 1000, MAX_RETRY_AFTER_MS);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (error instanceof APIError && !RETRYABLE_STATUSES.has(error.status)) {
        throw lastError;
      }
    }
  }

  throw lastError;
}
