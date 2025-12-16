import { NextResponse } from 'next/server';
import { MET_HIGHLIGHT_IDS } from '@/data/met_highlights';
import { getFallbackImage } from '@/data/fallback_images';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

export async function GET() {
  try {
    // Randomly select an object ID from the highlights list
    const randomIndex = Math.floor(Math.random() * MET_HIGHLIGHT_IDS.length);
    const randomObjectId = MET_HIGHLIGHT_IDS[randomIndex];

    // Fetch object details
    const objectUrl = `${MET_API_BASE}/${randomObjectId}`;
    const response = await fetch(objectUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Met API returned ${response.status}`);
    }

    const object = await response.json();

    // Check for fallback image if API doesn't provide one
    const fallback = getFallbackImage(object.objectID);
    const primaryImage = object.primaryImage || fallback?.primaryImage || null;
    const primaryImageSmall = object.primaryImageSmall || fallback?.primaryImageSmall || null;

    // Return a normalized subset of the data (matching the [id] route format)
    return NextResponse.json({
      objectID: object.objectID,
      title: object.title || null,
      artistDisplayName: object.artistDisplayName || null,
      artistDisplayBio: object.artistDisplayBio || null,
      objectDate: object.objectDate || null,
      medium: object.medium || null,
      dimensions: object.dimensions || null,
      department: object.department || null,
      culture: object.culture || null,
      period: object.period || null,
      classification: object.classification || null,
      primaryImage,
      primaryImageSmall,
      additionalImages: object.additionalImages || [],
      objectURL: object.objectURL || null,
      isHighlight: object.isHighlight || false,
      accessionNumber: object.accessionNumber || null,
      accessionYear: object.accessionYear || null,
      creditLine: object.creditLine || null,
      geographyType: object.geographyType || null,
      city: object.city || null,
      country: object.country || null,
      repository: object.repository || null,
      imageSource: fallback ? fallback.source : 'Met Museum API',
    });
  } catch (error) {
    console.error('Error fetching random object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch object from Met API' },
      { status: 500 }
    );
  }
}

