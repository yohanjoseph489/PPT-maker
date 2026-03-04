// Simple in-memory sliding window rate limiter
const requestLog = new Map<string, number[]>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

export function rateLimit(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = requestLog.get(identifier) || [];

    // Remove expired timestamps
    const valid = timestamps.filter((t) => now - t < WINDOW_MS);

    if (valid.length >= MAX_REQUESTS) {
        requestLog.set(identifier, valid);
        return { allowed: false, remaining: 0 };
    }

    valid.push(now);
    requestLog.set(identifier, valid);

    return { allowed: true, remaining: MAX_REQUESTS - valid.length };
}

export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return '127.0.0.1';
}
