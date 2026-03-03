type RateLimitRecord = {
    count: number;
    lastReset: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Simple in-memory rate limiter for Next.js API routes.
 * 
 * @param identifier Unique ID for the requester (usually IP or User ID)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(identifier: string, limit: number, windowMs: number) {
    const now = Date.now();
    const record = rateLimitMap.get(identifier) || { count: 0, lastReset: now };

    // Reset if window has passed
    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }

    if (record.count >= limit) {
        return {
            success: false,
            remaining: 0,
            reset: record.lastReset + windowMs
        };
    }

    record.count++;
    rateLimitMap.set(identifier, record);

    return {
        success: true,
        remaining: limit - record.count,
        reset: record.lastReset + windowMs
    };
}
