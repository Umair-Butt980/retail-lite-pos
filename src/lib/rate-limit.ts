// In-memory rate limiter — suitable for single-instance deployments (Vercel serverless functions
// are not shared across instances, so this protects within one instance/warm-up cycle)
// For multi-instance production use, replace with Redis-backed solution.

interface Attempt {
  count: number;
  resetAt: number;
}

const store = new Map<string, Attempt>();

const MAX_ATTEMPTS = 10;       // allow 10 login attempts…
const WINDOW_MS = 15 * 60 * 1000; // …per 15-minute window
const LOCKOUT_MS = 15 * 60 * 1000; // lockout window after limit is hit

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

// Prune stale entries occasionally to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetAt + LOCKOUT_MS) store.delete(key);
  }
}, 5 * 60 * 1000);
