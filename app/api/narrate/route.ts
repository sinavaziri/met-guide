import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCachedNarration, cacheNarration } from '@/lib/redis';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

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

  // Check cache first (Redis in production, memory in development)
  const cachedNarration = await getCachedNarration(objectId);
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

    // Cache the result (Redis in production, memory in development)
    await cacheNarration(objectId, narration);

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
