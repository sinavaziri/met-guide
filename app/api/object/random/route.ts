import { NextResponse } from 'next/server';

// Hardcoded object ID for The Temple of Dendur (object ID: 547802)
// This is a well-known object that should always be available
const TEMPLE_OF_DENDUR_ID = 547802;

export async function GET() {
  const baseUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

  try {
    // Fetch object details
    const objectUrl = `${baseUrl}/${TEMPLE_OF_DENDUR_ID}`;
    const response = await fetch(objectUrl);

    if (!response.ok) {
      throw new Error(`Met API returned ${response.status}`);
    }

    const object = await response.json();

    return NextResponse.json(object);
  } catch (error) {
    console.error('Error fetching random object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch object from Met API' },
      { status: 500 }
    );
  }
}

