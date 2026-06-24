const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Nettoie les entrées expirées toutes les 60 secondes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60_000);

interface RateLimitOptions {
  windowMs?: number;   // durée de la fenêtre en ms (défaut 10s)
  max?: number;        // nombre max de requêtes dans la fenêtre
}

export function rateLimit({ windowMs = 10_000, max = 10 }: RateLimitOptions = {}) {
  return function (ip: string): { success: boolean; remaining: number } {
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: max - 1 };
    }

    if (record.count >= max) {
      return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: max - record.count };
  };
}
