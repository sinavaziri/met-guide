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

function DepartmentCardSkeleton() {
  return (
    <div className="animate-pulse bg-stone-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-stone-200 rounded w-3/4" />
          <div className="h-3 bg-stone-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({ tour }: { tour: TourListItem }) {
  return (
    <Link
      href={`/tours/${tour.id}`}
      className="flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 
                 rounded-xl transition-all duration-200 group border border-stone-100
                 hover:border-stone-200"
    >
      {/* Icon */}
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center
                      text-2xl shadow-sm group-hover:scale-110 transition-transform
                      border border-stone-100">
        {tour.icon}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-stone-900 group-hover:text-stone-700 truncate">
          {tour.name}
        </h2>
        <p className="text-sm text-stone-500">
          {tour.objectCount} artworks
        </p>
      </div>
      
      {/* Preview thumbnails (mini) */}
      {tour.previewObjects.length > 0 && (
        <div className="flex -space-x-2">
          {tour.previewObjects.slice(0, 3).map((obj) => (
            <div 
              key={obj.objectID} 
              className="w-8 h-8 relative rounded-full overflow-hidden bg-stone-200
                         border-2 border-white shadow-sm"
            >
              <Image
                src={obj.primaryImageSmall}
                alt=""
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Arrow */}
      <svg 
        className="w-5 h-5 text-stone-300 group-hover:text-stone-500 
                   group-hover:translate-x-1 transition-all flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<ToursResponse>('/api/tours', fetcher);

  // Filter to only department tours (exclude highlights)
  const departmentTours = data?.tours.filter(tour => tour.id.startsWith('dept-')) || [];

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
          <h1 className="text-lg font-semibold text-stone-900">Departments</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Intro */}
        <div className="mb-6">
          <p className="text-stone-500">
            Explore art by department. Each collection features highlights from that area of the museum.
          </p>
        </div>

        {/* Departments List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <DepartmentCardSkeleton key={i} />
              ))}
            </>
          ) : error ? (
            <div className="text-center py-12 text-stone-500">
              <p>Unable to load departments.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-full text-sm"
              >
                Try Again
              </button>
            </div>
          ) : departmentTours.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <div className="text-4xl mb-3">🏛️</div>
              <p>No department tours available yet.</p>
              <p className="text-sm mt-2">Run the tour generation script to create them.</p>
            </div>
          ) : (
            departmentTours.map(tour => (
              <DepartmentCard key={tour.id} tour={tour} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

