import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

// In-memory cache for development (file-based cache for production persistence)
const memoryCache = new Map<string, { narration: string; timestamp: number }>();

// Cache directory for file-based persistence
const CACHE_DIR = path.join(process.cwd(), 'cache', 'narrations');

// Cache duration: 30 days
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  objectDate: string;
  medium: string;
  department: string;
  culture: string;
  period: string;
  classification: string;
  creditLine: string;
  isHighlight: boolean;
}

interface NarrationCache {
  narration: string;
  timestamp: number;
  objectId: number;
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheFilePath(objectId: string): string {
  return path.join(CACHE_DIR, `${objectId}.json`);
}

function getFromFileCache(objectId: string): string | null {
  try {
    const filePath = getCacheFilePath(objectId);
    if (!fs.existsSync(filePath)) return null;
    
    const data: NarrationCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_DURATION_MS) {
      fs.unlinkSync(filePath); // Delete expired cache
      return null;
    }
    
    return data.narration;
  } catch {
    return null;
  }
}

function saveToFileCache(objectId: string, narration: string) {
  try {
    ensureCacheDir();
    const data: NarrationCache = {
      narration,
      timestamp: Date.now(),
      objectId: parseInt(objectId),
    };
    fs.writeFileSync(getCacheFilePath(objectId), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save narration to cache:', error);
  }
}

function getFromMemoryCache(objectId: string): string | null {
  const cached = memoryCache.get(objectId);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
    memoryCache.delete(objectId);
    return null;
  }
  
  return cached.narration;
}

function saveToMemoryCache(objectId: string, narration: string) {
  memoryCache.set(objectId, {
    narration,
    timestamp: Date.now(),
  });
}

function getCachedNarration(objectId: string): string | null {
  // Check memory cache first (fastest)
  const memCached = getFromMemoryCache(objectId);
  if (memCached) return memCached;
  
  // Check file cache
  const fileCached = getFromFileCache(objectId);
  if (fileCached) {
    // Warm up memory cache
    saveToMemoryCache(objectId, fileCached);
    return fileCached;
  }
  
  return null;
}

function cacheNarration(objectId: string, narration: string) {
  saveToMemoryCache(objectId, narration);
  saveToFileCache(objectId, narration);
}

async function fetchMetObject(objectId: string): Promise<MetObject | null> {
  try {
    const response = await fetch(`${MET_API_BASE}/objects/${objectId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function buildPrompt(object: MetObject): string {
  const details = [
    object.title && `Title: "${object.title}"`,
    object.artistDisplayName && `Artist: ${object.artistDisplayName}`,
    object.artistDisplayBio && `Artist Bio: ${object.artistDisplayBio}`,
    object.objectDate && `Date: ${object.objectDate}`,
    object.medium && `Medium: ${object.medium}`,
    object.culture && `Culture: ${object.culture}`,
    object.period && `Period: ${object.period}`,
    object.classification && `Classification: ${object.classification}`,
    object.department && `Department: ${object.department}`,
    object.isHighlight && `This is a highlight piece in the Met's collection.`,
  ].filter(Boolean).join('\n');

  return `You are an enthusiastic and knowledgeable museum guide at The Metropolitan Museum of Art. 
You're speaking directly to a visitor standing in front of this artwork. Do not mention the fact that you are standing in front of the artwork.

Here are the details about the artwork:
${details}

Write a compelling 45-second narration (about 100-120 words) that:
1. Opens with something captivating about this piece - a fascinating detail, surprising fact, or emotional hook
2. Explains WHY this work matters - its historical significance, artistic innovation, or cultural impact
3. Points out one or two specific visual details the visitor should look for
4. Ends with a memorable thought that stays with them

Speak naturally and warmly, like a friend who happens to be an art expert.
Avoid: dry facts, dimensions, inventory numbers, or academic jargon.
Do NOT use phrases like "Let me tell you" or "Did you know" or "Standing in front of" - just dive right in.`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const objectId = searchParams.get('id');

  if (!objectId) {
    return NextResponse.json(
      { error: 'Object ID is required' },
      { status: 400 }
    );
  }

  // Check cache first
  const cachedNarration = getCachedNarration(objectId);
  if (cachedNarration) {
    return NextResponse.json({
      narration: cachedNarration,
      cached: true,
    });
  }

  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 503 }
    );
  }

  // Fetch object details from Met API
  const object = await fetchMetObject(objectId);
  if (!object) {
    return NextResponse.json(
      { error: 'Object not found' },
      { status: 404 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: buildPrompt(object),
        },
      ],
      temperature: 0.3, // Low temperature to reduce hallucination
      max_tokens: 300,
    });

    const narration = completion.choices[0]?.message?.content?.trim();

    if (!narration) {
      return NextResponse.json(
        { error: 'Failed to generate narration' },
        { status: 500 }
      );
    }

    // Cache the result
    cacheNarration(objectId, narration);

    // Track token usage for cost monitoring
    const usage = completion.usage;
    console.log(`Narration generated for object ${objectId}:`, {
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
    });

    return NextResponse.json({
      narration,
      cached: false,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate narration' },
      { status: 500 }
    );
  }
}

