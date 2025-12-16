/**
 * Redis Cache Utility
 * 
 * Uses Upstash Redis for distributed caching in production.
 * Falls back to in-memory cache for local development without Redis.
 */

import { Redis } from '@upstash/redis';

// Cache duration: 30 days in seconds
const CACHE_DURATION_SECONDS = 30 * 24 * 60 * 60;

// In-memory fallback for development
const memoryCache = new Map<string, { value: string; expiry: number }>();

// Initialize Redis client (lazy initialization)
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }
  
  return null;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return !!getRedisClient();
}

/**
 * Get a value from cache
 */
export async function getCached(key: string): Promise<string | null> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      const value = await redis.get<string>(key);
      return value;
    } catch (error) {
      console.error('Redis get error:', error);
      // Fall through to memory cache
    }
  }
  
  // Fallback to memory cache
  const cached = memoryCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.value;
  }
  
  if (cached) {
    memoryCache.delete(key);
  }
  
  return null;
}

/**
 * Set a value in cache with expiry
 */
export async function setCached(
  key: string, 
  value: string, 
  ttlSeconds: number = CACHE_DURATION_SECONDS
): Promise<void> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch (error) {
      console.error('Redis set error:', error);
      // Fall through to memory cache
    }
  }
  
  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000),
  });
}

/**
 * Get cached narration for an object
 */
export async function getCachedNarration(objectId: string): Promise<string | null> {
  return getCached(`narration:${objectId}`);
}

/**
 * Cache a narration for an object
 */
export async function cacheNarration(objectId: string, narration: string): Promise<void> {
  await setCached(`narration:${objectId}`, narration);
}

/**
 * Get cached audio for an object (stored as base64)
 */
export async function getCachedAudio(objectId: string): Promise<Buffer | null> {
  const base64 = await getCached(`audio:${objectId}`);
  if (base64) {
    return Buffer.from(base64, 'base64');
  }
  return null;
}

/**
 * Cache audio for an object (stored as base64)
 */
export async function cacheAudio(objectId: string, audioBuffer: Buffer): Promise<void> {
  const base64 = audioBuffer.toString('base64');
  await setCached(`audio:${objectId}`, base64);
}

/**
 * Clean up expired entries from memory cache (for development)
 */
export function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now >= entry.expiry) {
      memoryCache.delete(key);
    }
  }
}

// Clean up memory cache every minute (only in development)
if (typeof setInterval !== 'undefined' && !getRedisClient()) {
  setInterval(cleanupMemoryCache, 60 * 1000);
}

