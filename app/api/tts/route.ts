import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

// Cache directory for audio files
const AUDIO_CACHE_DIR = path.join(process.cwd(), 'cache', 'audio');

// Cache duration: 30 days
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

interface AudioCache {
  timestamp: number;
  objectId: string;
  filename: string;
}

function ensureAudioCacheDir() {
  if (!fs.existsSync(AUDIO_CACHE_DIR)) {
    fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
  }
}

function getAudioCachePath(objectId: string): string {
  return path.join(AUDIO_CACHE_DIR, `${objectId}.mp3`);
}

function getAudioMetaPath(objectId: string): string {
  return path.join(AUDIO_CACHE_DIR, `${objectId}.json`);
}

function getCachedAudio(objectId: string): Buffer | null {
  try {
    const audioPath = getAudioCachePath(objectId);
    const metaPath = getAudioMetaPath(objectId);
    
    if (!fs.existsSync(audioPath) || !fs.existsSync(metaPath)) {
      return null;
    }
    
    const meta: AudioCache = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    
    // Check if cache is expired
    if (Date.now() - meta.timestamp > CACHE_DURATION_MS) {
      fs.unlinkSync(audioPath);
      fs.unlinkSync(metaPath);
      return null;
    }
    
    return fs.readFileSync(audioPath);
  } catch {
    return null;
  }
}

function saveAudioToCache(objectId: string, audioBuffer: Buffer) {
  try {
    ensureAudioCacheDir();
    
    const audioPath = getAudioCachePath(objectId);
    const metaPath = getAudioMetaPath(objectId);
    
    fs.writeFileSync(audioPath, audioBuffer);
    
    const meta: AudioCache = {
      timestamp: Date.now(),
      objectId,
      filename: `${objectId}.mp3`,
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  } catch (error) {
    console.error('Failed to save audio to cache:', error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const objectId = searchParams.get('id');
  const text = searchParams.get('text');

  if (!objectId) {
    return NextResponse.json(
      { error: 'Object ID is required' },
      { status: 400 }
    );
  }

  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`tts:${clientId}`);
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.reset),
      }}
    );
  }

  // Check cache first
  const cachedAudio = getCachedAudio(objectId);
  if (cachedAudio) {
    return new NextResponse(cachedAudio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(cachedAudio.length),
        'Cache-Control': 'public, max-age=86400', // 1 day browser cache
        'X-Cache': 'HIT',
      },
    });
  }

  // Need to generate audio
  if (!text) {
    return NextResponse.json(
      { error: 'Text is required for audio generation' },
      { status: 400 }
    );
  }

  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 503 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Generate TTS audio
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Warm, friendly voice suitable for museum guide
      input: text,
      response_format: 'mp3',
    });

    // Get the audio buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Cache the audio
    saveAudioToCache(objectId, audioBuffer);

    console.log(`TTS generated for object ${objectId}: ${audioBuffer.length} bytes`);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
}

