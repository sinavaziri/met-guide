import { NextResponse } from 'next/server';
import toursData from '@/data/tours.json';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tourId = searchParams.get('id');
  
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

