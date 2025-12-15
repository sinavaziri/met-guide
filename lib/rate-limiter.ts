/**
 * Rate Limiter
 * 
 * Simple in-memory rate limiter for development.
 * In production, use Upstash Redis for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for development
const memoryStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute for AI endpoints

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = memoryStore.get(key);
  
  // Clean up old entry or create new one
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }
  
  // Increment count
  entry.count += 1;
  memoryStore.set(key, entry);
  
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count);
  const success = entry.count <= MAX_REQUESTS_PER_WINDOW;
  
  return {
    success,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Clean up expired entries (call periodically in production)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, entry] of memoryStore.entries()) {
    if (now >= entry.resetTime) {
      memoryStore.delete(key);
    }
  }
}

// Clean up every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 1000);
}

