import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface TourObject {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  artistDisplayBio: string | null;
  objectDate: string | null;
  department: string;
  primaryImageSmall: string;
  isHighlight: boolean;
}

interface Tour {
  id: string;
  name: string;
  description: string;
  icon: string;
  objectCount: number;
  objects: TourObject[];
}

interface ToursData {
  generatedAt: string;
  tours: Tour[];
}

// Cache the tours data in memory (only in production)
let cachedTours: ToursData | null = null;

function loadTours(): ToursData | null {
  // Skip cache in development to allow hot reloading of tours.json
  if (process.env.NODE_ENV === 'production' && cachedTours) {
    return cachedTours;
  }
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'tours.json');
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const tours = JSON.parse(fileContents);
    
    // Only cache in production
    if (process.env.NODE_ENV === 'production') {
      cachedTours = tours;
    }
    
    return tours;
  } catch (error) {
    console.error('Error loading tours:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tourId = searchParams.get('id');
  
  const toursData = loadTours();
  
  if (!toursData) {
    return NextResponse.json(
      { error: 'Tours data not available. Run `npm run generate-tours` first.' },
      { status: 503 }
    );
  }
  
  // If a specific tour ID is requested
  if (tourId) {
    const tour = toursData.tours.find(t => t.id === tourId);
    
    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(tour);
  }
  
  // Return list of tours (without full objects for the list view)
  const tourList = toursData.tours.map(tour => ({
    id: tour.id,
    name: tour.name,
    description: tour.description,
    icon: tour.icon,
    objectCount: tour.objectCount,
    // Include first 4 objects for preview thumbnails
    previewObjects: tour.objects.slice(0, 4).map(obj => ({
      objectID: obj.objectID,
      primaryImageSmall: obj.primaryImageSmall,
    })),
  }));
  
  return NextResponse.json({
    generatedAt: toursData.generatedAt,
    tours: tourList,
  });
}

