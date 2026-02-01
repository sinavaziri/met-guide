'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

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

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

function TourCardSkeleton() {
  return (
    <div className="animate-pulse flex gap-4 p-4 bg-stone-50 rounded-xl">
      <div className="w-20 h-20 bg-stone-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-5 bg-stone-200 rounded w-4/5" />
        <div className="h-4 bg-stone-200 rounded w-3/5" />
        <div className="h-3 bg-stone-200 rounded w-2/5" />
      </div>
    </div>
  );
}

function ObjectCard({ object, index }: { object: TourObject; index: number }) {
  return (
    <Link
      href={`/objects/${object.objectID}`}
      className="flex gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl 
                 transition-all duration-200 group border border-stone-100
                 hover:border-stone-200"
    >
      {/* Index number */}
      <div className="w-7 h-7 bg-stone-200 text-stone-600 rounded-full text-xs font-bold 
                      flex items-center justify-center flex-shrink-0 self-center">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
        <Image
          src={object.primaryImageSmall}
          alt={object.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="80px"
        />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-medium text-stone-900 line-clamp-2 leading-tight 
                       group-hover:text-stone-700 transition-colors">
          {object.title}
        </h3>
        
        {object.artistDisplayName && (
          <p className="text-sm text-stone-500 mt-1 truncate">
            {object.artistDisplayName}
          </p>
        )}
        
        {object.objectDate && (
          <p className="text-xs text-stone-400 mt-0.5">
            {object.objectDate}
          </p>
        )}
      </div>
      
      {/* Arrow */}
      <div className="flex items-center">
        <svg 
          className="w-5 h-5 text-stone-300 group-hover:text-stone-500 
                     group-hover:translate-x-1 transition-all" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function TourHeader({ tour }: { tour: Tour }) {
  return (
    <div className="bg-gradient-to-b from-stone-100 to-white px-4 py-8 -mx-4 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center
                        text-3xl shadow-lg shadow-stone-200/50">
          {tour.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{tour.name}</h1>
          <p className="text-stone-500">{tour.objectCount} artworks</p>
        </div>
      </div>
      <p className="text-stone-600">{tour.description}</p>
    </div>
  );
}

function NotFound() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-4">🗺️</div>
      <h2 className="text-2xl font-semibold text-stone-800 mb-2">
        Tour Not Found
      </h2>
      <p className="text-stone-500 mb-6 max-w-sm">
        This tour may have been moved or is no longer available.
      </p>
      <button
        onClick={() => router.push('/tours')}
        className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium 
                   hover:bg-stone-800 active:scale-95 transition-all"
      >
        View All Tours
      </button>
    </div>
  );
}

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;
  const [visibleCount, setVisibleCount] = useState(10);

  const { data: tour, error, isLoading } = useSWR<Tour>(
    tourId ? `/api/tours?id=${tourId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const is404 = error?.message?.includes('404');

  return (
    <main className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 active:scale-95 
                       transition-all text-stone-600"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="h-5 bg-stone-200 rounded w-32 animate-pulse" />
            ) : tour ? (
              <h1 className="text-sm font-medium text-stone-600 truncate">
                {tour.name}
              </h1>
            ) : null}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-200 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-7 bg-stone-200 rounded w-40" />
                  <div className="h-4 bg-stone-200 rounded w-24" />
                </div>
              </div>
              <div className="h-4 bg-stone-200 rounded w-full" />
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        ) : is404 || !tour ? (
          <NotFound />
        ) : (
          <>
            <TourHeader tour={tour} />
            
            <div className="space-y-3">
              {tour.objects.slice(0, visibleCount).map((object, index) => (
                <div key={object.objectID} className="relative">
                  <ObjectCard object={object} index={index} />
                </div>
              ))}
            </div>
            
            {/* Load More button */}
            {visibleCount < tour.objects.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + 10, tour.objects.length))}
                  className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium 
                             hover:bg-stone-800 active:scale-95 transition-all"
                >
                  Load More ({tour.objects.length - visibleCount} remaining)
                </button>
              </div>
            )}
            
            {/* End of tour message */}
            {visibleCount >= tour.objects.length && (
              <div className="text-center py-8 mt-4">
                <div className="text-3xl mb-2">🎨</div>
                <p className="text-stone-400 text-sm">
                  End of tour • {tour.objectCount} artworks
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}


