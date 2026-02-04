'use client';

import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

interface PreviewObject {
  objectID: number;
  primaryImageSmall: string;
}

interface TourListItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  objectCount: number;
  previewObjects: PreviewObject[];
}

interface ToursResponse {
  generatedAt: string;
  tours: TourListItem[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function TourCardSkeleton() {
  return (
    <div className="animate-pulse bg-stone-100 dark:bg-neutral-900 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-stone-200 dark:bg-neutral-800 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-stone-200 dark:bg-neutral-800 rounded w-3/4" />
          <div className="h-4 bg-stone-200 dark:bg-neutral-800 rounded w-full" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-square bg-stone-200 dark:bg-neutral-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function TourCard({ tour }: { tour: TourListItem }) {
  return (
    <Link
      href={`/tours/${tour.id}`}
      className="block bg-stone-50 dark:bg-neutral-900/50 hover:bg-stone-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-2xl p-5 
                 transition-all duration-200 group border border-stone-100 dark:border-neutral-800
                 hover:border-met-gold hover:shadow-lg hover:shadow-met-gold/20 dark:hover:shadow-met-gold/10"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-stone-200 dark:bg-neutral-800 rounded-xl flex items-center justify-center
                        text-2xl group-hover:scale-110 transition-transform">
          {tour.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-neutral-100 group-hover:text-met-red dark:group-hover:text-met-gold transition-colors">
            {tour.name}
          </h2>
          <p className="text-sm text-stone-600 dark:text-neutral-400 line-clamp-2">
            {tour.description}
          </p>
          <p className="museum-label mt-1">
            {tour.objectCount} artworks
          </p>
        </div>
        <svg 
          className="w-5 h-5 text-stone-300 group-hover:text-stone-500 dark:text-neutral-400 
                     group-hover:translate-x-1 transition-all mt-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      {/* Preview thumbnails */}
      {tour.previewObjects.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {tour.previewObjects.map((obj) => (
            <div 
              key={obj.objectID} 
              className="aspect-square relative rounded-lg overflow-hidden bg-stone-200"
            >
              <Image
                src={obj.primaryImageSmall}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function ToursPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<ToursResponse>('/api/tours', fetcher);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-stone-100 dark:border-neutral-800 dark:border-neutral-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 active:scale-95 
                       transition-all text-stone-600 dark:text-neutral-300"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-stone-900 dark:text-neutral-100">Tours</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Intro */}
        <div className="mb-6">
          <p className="text-stone-600 dark:text-neutral-400">
            Explore curated collections of masterpieces from The Met.
          </p>
        </div>

        {/* Tours List */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <TourCardSkeleton />
              <TourCardSkeleton />
            </>
          ) : error ? (
            <div className="text-center py-12 text-stone-500">
              <p>Unable to load tours.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-full text-sm"
              >
                Try Again
              </button>
            </div>
          ) : data?.tours.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <div className="text-4xl mb-3">🗺️</div>
              <p>No tours available yet.</p>
            </div>
          ) : (
            data?.tours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}


