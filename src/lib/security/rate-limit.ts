type RateLimitOptions = {
  key: string;
  maxHits: number;
  windowMs: number;
};

type RateBucket = {
  startedAt: number;
  hits: number;
};

const buckets = new Map<string, RateBucket>();

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.startedAt > 5 * 60_000) {
      buckets.delete(key);
    }
  }
}

export function enforceRateLimit({ key, maxHits, windowMs }: RateLimitOptions) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const current = buckets.get(key);
  if (!current || now - current.startedAt > windowMs) {
    buckets.set(key, { startedAt: now, hits: 1 });
    return { allowed: true as const };
  }

  if (current.hits >= maxHits) {
    return { allowed: false as const };
  }

  current.hits += 1;
  buckets.set(key, current);
  return { allowed: true as const };
}
