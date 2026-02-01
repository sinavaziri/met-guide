import { NextResponse } from 'next/server';
import { getCachedAudio, cacheAudio } from '@/lib/redis';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

const MAX_TTS_TEXT_LENGTH = 1500; // Max characters for TTS input
const TTS_VOICES = ['fable', 'nova'] as const;

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

  // Validate text length to prevent abuse
  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text exceeds maximum length of ${MAX_TTS_TEXT_LENGTH} characters` },
      { status: 400 }
    );
  }

  // Check for OpenAI API key
  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 503 }
    );
  }

  try {
    const openai = getOpenAIClient();

    // Pick a consistent voice per object (hash objectId to voice index)
    const voiceIndex = parseInt(objectId!, 10) % TTS_VOICES.length;
    const randomVoice = TTS_VOICES[voiceIndex];
    
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
