import { NextRequest, NextResponse } from 'next/server';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const objectId = params.id;

  // Validate that ID is a number
  if (!/^\d+$/.test(objectId)) {
    return NextResponse.json(
      { error: 'Invalid object ID format' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${MET_API_BASE}/${objectId}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Object not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      throw new Error(`Met API returned ${response.status}`);
    }

    const object = await response.json();

    // Return a normalized subset of the data
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
      primaryImage: object.primaryImage || null,
      primaryImageSmall: object.primaryImageSmall || null,
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
    });
  } catch (error) {
    console.error('Error fetching object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch object from Met API' },
      { status: 500 }
    );
  }
}

