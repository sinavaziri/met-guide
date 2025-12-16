import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCachedAudio, cacheAudio } from '@/lib/redis';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

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
  const rateLimit = await checkRateLimit(`tts:${clientId}`);
  
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

  // Check cache first (Redis in production, memory in development)
  const cachedAudio = await getCachedAudio(objectId);
  if (cachedAudio) {
    return new NextResponse(new Uint8Array(cachedAudio), {
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

    // Generate TTS audio with random voice selection
    const voices = ['fable', 'nova'] as const;
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: randomVoice,
      input: text,
      response_format: 'mp3',
    });

    // Get the audio buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Cache the audio (Redis in production, memory in development)
    await cacheAudio(objectId, audioBuffer);

    console.log(`TTS generated for object ${objectId}: ${audioBuffer.length} bytes`);

    return new NextResponse(new Uint8Array(audioBuffer), {
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
