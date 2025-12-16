/**
 * Rate Limiter
 * 
 * Uses Upstash Ratelimit for distributed rate limiting in production.
 * Falls back to in-memory rate limiting for local development without Redis.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute for AI endpoints

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for development fallback
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const memoryStore = new Map<string, RateLimitEntry>();

// Initialize Upstash Ratelimit (lazy initialization)
let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (url && token) {
    const redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS_PER_WINDOW, '1 m'),
      analytics: true,
    });
    return ratelimit;
  }
  
  return null;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 * Uses Upstash Ratelimit in production, in-memory fallback for development
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const upstashRatelimit = getRatelimit();
  
  if (upstashRatelimit) {
    try {
      const result = await upstashRatelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error('Upstash Ratelimit error:', error);
      // Fall through to memory-based rate limiting
    }
  }
  
  // Fallback to in-memory rate limiting (for development or if Redis fails)
  return checkMemoryRateLimit(identifier);
}

/**
 * In-memory rate limiting fallback
 */
function checkMemoryRateLimit(identifier: string): RateLimitResult {
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
 * Clean up expired entries from memory store (for development)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, entry] of memoryStore.entries()) {
    if (now >= entry.resetTime) {
      memoryStore.delete(key);
    }
  }
}

// Clean up every minute (only for memory store in development)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 1000);
}
