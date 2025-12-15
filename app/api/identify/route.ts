import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

interface VisionAnalysis {
  is_artwork: boolean;
  probable_title: string | null;
  probable_artist: string | null;
  visual_keywords: string[];
  art_period: string | null;
  medium: string | null;
}

interface MetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  department: string;
  primaryImageSmall: string;
  primaryImage: string;
  isHighlight: boolean;
}

interface SearchResult {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  objectDate: string | null;
  department: string;
  primaryImageSmall: string;
  matchScore: number;
  matchReason: string;
}

async function analyzeImage(openai: OpenAI, imageBase64: string): Promise<VisionAnalysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image and determine if it's a photograph of an artwork (painting, sculpture, artifact, etc.) 
that might be found in a museum like The Metropolitan Museum of Art.

Return a JSON object with these fields:
- is_artwork: boolean - true if this appears to be a photo of an artwork
- probable_title: string or null - your best guess at the title
- probable_artist: string or null - your best guess at the artist
- visual_keywords: string[] - 3-5 descriptive keywords for searching (e.g., "portrait", "woman", "Dutch", "17th century", "oil painting")
- art_period: string or null - the likely period (e.g., "Renaissance", "Impressionist", "Ancient Egyptian")
- medium: string or null - the likely medium (e.g., "oil on canvas", "marble sculpture", "bronze")

Return ONLY the JSON object, no markdown formatting.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Parse JSON from response
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch {
    // Return a default response if parsing fails
    return {
      is_artwork: false,
      probable_title: null,
      probable_artist: null,
      visual_keywords: [],
      art_period: null,
      medium: null,
    };
  }
}

async function searchMet(query: string): Promise<number[]> {
  try {
    const url = `${MET_API_BASE}/search?hasImages=true&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data: MetSearchResponse = await response.json();
    return data.objectIDs?.slice(0, 20) || []; // Limit to 20 results
  } catch {
    return [];
  }
}

async function fetchMetObject(objectId: number): Promise<MetObject | null> {
  try {
    const response = await fetch(`${MET_API_BASE}/objects/${objectId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function calculateMatchScore(
  object: MetObject, 
  analysis: VisionAnalysis
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Artist match (highest weight)
  if (analysis.probable_artist && object.artistDisplayName) {
    const artistLower = object.artistDisplayName.toLowerCase();
    const guessLower = analysis.probable_artist.toLowerCase();
    
    if (artistLower.includes(guessLower) || guessLower.includes(artistLower)) {
      score += 50;
      reasons.push('Artist match');
    }
  }

  // Title match
  if (analysis.probable_title && object.title) {
    const titleLower = object.title.toLowerCase();
    const guessLower = analysis.probable_title.toLowerCase();
    
    // Check for word overlap
    const titleWords = titleLower.split(/\s+/);
    const guessWords = guessLower.split(/\s+/);
    const overlap = titleWords.filter(w => guessWords.includes(w)).length;
    
    if (overlap >= 2) {
      score += 30;
      reasons.push('Title match');
    } else if (overlap >= 1) {
      score += 15;
      reasons.push('Partial title match');
    }
  }

  // Keyword matches
  if (analysis.visual_keywords.length > 0) {
    const objectText = `${object.title} ${object.artistDisplayName} ${object.department}`.toLowerCase();
    const matchingKeywords = analysis.visual_keywords.filter(kw => 
      objectText.includes(kw.toLowerCase())
    );
    
    score += matchingKeywords.length * 5;
    if (matchingKeywords.length > 0) {
      reasons.push(`Keywords: ${matchingKeywords.join(', ')}`);
    }
  }

  // Highlight bonus
  if (object.isHighlight) {
    score += 5;
  }

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(' • ') : 'Visual similarity',
  };
}

export async function POST(request: Request) {
  try {
    // Rate limiting - protect AI endpoints from abuse
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`identify:${clientId}`);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          }
        }
      );
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
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

    const openai = new OpenAI({ apiKey });

    // Step 1: Analyze the image with Vision API
    console.log('Analyzing image with Vision API...');
    const analysis = await analyzeImage(openai, image);
    console.log('Vision analysis:', analysis);

    if (!analysis.is_artwork) {
      return NextResponse.json({
        isArtwork: false,
        message: 'This doesn\'t appear to be a photograph of an artwork. Try taking a photo of a painting, sculpture, or artifact.',
        analysis,
        results: [],
      });
    }

    // Step 2: Search Met collection
    const searchQueries: string[] = [];
    
    // Build search queries in order of specificity
    if (analysis.probable_artist && analysis.probable_title) {
      searchQueries.push(`${analysis.probable_artist} ${analysis.probable_title}`);
    }
    if (analysis.probable_artist) {
      searchQueries.push(analysis.probable_artist);
    }
    if (analysis.probable_title) {
      searchQueries.push(analysis.probable_title);
    }
    if (analysis.visual_keywords.length > 0) {
      searchQueries.push(analysis.visual_keywords.join(' '));
    }

    // Collect unique object IDs from all searches
    const allObjectIds = new Set<number>();
    
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries
      console.log(`Searching Met for: ${query}`);
      const ids = await searchMet(query);
      ids.forEach(id => allObjectIds.add(id));
      
      if (allObjectIds.size >= 15) break; // Stop if we have enough candidates
    }

    console.log(`Found ${allObjectIds.size} candidate objects`);

    // Step 3: Fetch object details and score them
    const objectIds = Array.from(allObjectIds).slice(0, 15); // Limit fetches
    const objects: MetObject[] = [];

    for (const id of objectIds) {
      const obj = await fetchMetObject(id);
      if (obj && (obj.primaryImageSmall || obj.primaryImage)) {
        objects.push(obj);
      }
    }

    // Step 4: Score and rank results
    const scoredResults: SearchResult[] = objects.map(obj => {
      const { score, reason } = calculateMatchScore(obj, analysis);
      return {
        objectID: obj.objectID,
        title: obj.title,
        artistDisplayName: obj.artistDisplayName || null,
        objectDate: obj.objectDate || null,
        department: obj.department,
        primaryImageSmall: obj.primaryImageSmall || obj.primaryImage,
        matchScore: score,
        matchReason: reason,
      };
    });

    // Sort by score (highest first) and take top 3
    scoredResults.sort((a, b) => b.matchScore - a.matchScore);
    const topResults = scoredResults.slice(0, 3);

    console.log('Top results:', topResults.map(r => ({ id: r.objectID, title: r.title, score: r.matchScore })));

    return NextResponse.json({
      isArtwork: true,
      analysis: {
        probableTitle: analysis.probable_title,
        probableArtist: analysis.probable_artist,
        keywords: analysis.visual_keywords,
        period: analysis.art_period,
        medium: analysis.medium,
      },
      results: topResults,
      totalCandidates: objects.length,
    });

  } catch (error) {
    console.error('Identify API error:', error);
    return NextResponse.json(
      { error: 'Failed to identify artwork' },
      { status: 500 }
    );
  }
}

