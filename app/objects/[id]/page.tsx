'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';

// Types for Met object data
interface MetObject {
  objectID: number;
  title: string | null;
  artistDisplayName: string | null;
  artistDisplayBio: string | null;
  objectDate: string | null;
  medium: string | null;
  dimensions: string | null;
  department: string | null;
  culture: string | null;
  period: string | null;
  classification: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  additionalImages: string[];
  objectURL: string | null;
  isHighlight: boolean;
  creditLine: string | null;
  country: string | null;
}

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 404) {
    const error = new Error('Object not found');
    (error as Error & { status: number }).status = 404;
    throw error;
  }
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

// Skeleton loader component
function ObjectSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Image skeleton */}
      <div className="w-full aspect-[4/5] bg-stone-200 rounded-2xl" />
      
      {/* Title skeleton */}
      <div className="space-y-3 px-1">
        <div className="h-8 bg-stone-200 rounded-lg w-4/5" />
        <div className="h-5 bg-stone-200 rounded-lg w-3/5" />
        <div className="h-4 bg-stone-200 rounded-lg w-2/5" />
      </div>
      
      {/* Details skeleton */}
      <div className="space-y-4 mt-8 px-1">
        <div className="h-4 bg-stone-200 rounded w-full" />
        <div className="h-4 bg-stone-200 rounded w-5/6" />
        <div className="h-4 bg-stone-200 rounded w-4/6" />
      </div>
    </div>
  );
}

// Not found component
function NotFound() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-4">🏛️</div>
      <h2 className="text-2xl font-semibold text-stone-800 mb-2">
        Artwork Not Found
      </h2>
      <p className="text-stone-500 mb-6 max-w-sm">
        This piece may have been moved or is currently not in our collection.
      </p>
      <button
        onClick={() => router.back()}
        className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium 
                   hover:bg-stone-800 active:scale-95 transition-all"
      >
        Go Back
      </button>
    </div>
  );
}

// Error component
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-semibold text-stone-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-stone-500 mb-6 max-w-sm">
        We couldn&apos;t load this artwork. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium 
                   hover:bg-stone-800 active:scale-95 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}

// Pinch-to-zoom image component
function ZoomableImage({ 
  src, 
  alt,
  onLoad 
}: { 
  src: string; 
  alt: string;
  onLoad?: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const lastDistance = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDistance.current = distance;
      lastPosition.current = position;
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistance.current !== null) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(scale * (distance / lastDistance.current), 1), 4);
      setScale(newScale);
      setIsZoomed(newScale > 1);
      lastDistance.current = distance;
    } else if (e.touches.length === 1 && isZoomed) {
      // Pan when zoomed
      const touch = e.touches[0];
      const deltaX = touch.clientX - (lastPosition.current.x || touch.clientX);
      const deltaY = touch.clientY - (lastPosition.current.y || touch.clientY);
      
      setPosition(prev => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5
      }));
      
      lastPosition.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [scale, isZoomed]);

  const handleTouchEnd = useCallback(() => {
    lastDistance.current = null;
    if (scale <= 1.1) {
      resetZoom();
    }
  }, [scale, resetZoom]);

  const handleDoubleClick = useCallback(() => {
    if (isZoomed) {
      resetZoom();
    } else {
      setScale(2.5);
      setIsZoomed(true);
    }
  }, [isZoomed, resetZoom]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100
                 touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
          onLoad={onLoad}
        />
      </div>
      
      {/* Zoom hint */}
      {!isZoomed && (
        <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/50 backdrop-blur-sm 
                        rounded-full text-white text-xs font-medium opacity-70">
          Pinch or double-tap to zoom
        </div>
      )}
      
      {/* Reset button when zoomed */}
      {isZoomed && (
        <button
          onClick={resetZoom}
          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm 
                     rounded-full text-white hover:bg-black/70 transition-colors"
          aria-label="Reset zoom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Detail row component
function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  
  return (
    <div className="py-3 border-b border-stone-100 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-stone-400 mb-1">{label}</dt>
      <dd className="text-stone-700">{value}</dd>
    </div>
  );
}

// Main object detail component
function ObjectDetail({ object }: { object: MetObject }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Image */}
      {object.primaryImage ? (
        <div className={`transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <ZoomableImage 
            src={object.primaryImage} 
            alt={object.title || 'Artwork'}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/5] bg-stone-100 rounded-2xl flex items-center justify-center">
          <div className="text-center text-stone-400">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm">No image available</p>
          </div>
        </div>
      )}
      
      {/* Title and Artist */}
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold text-stone-900 leading-tight">
          {object.title || 'Untitled'}
        </h1>
        
        {object.artistDisplayName && (
          <p className="text-lg text-stone-600">{object.artistDisplayName}</p>
        )}
        
        {object.artistDisplayBio && (
          <p className="text-sm text-stone-400">{object.artistDisplayBio}</p>
        )}
        
        {object.objectDate && (
          <p className="text-stone-500 font-medium">{object.objectDate}</p>
        )}
      </div>
      
      {/* Highlight badge */}
      {object.isHighlight && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 
                        text-amber-700 rounded-full text-sm font-medium mx-1">
          <span>⭐</span>
          <span>Museum Highlight</span>
        </div>
      )}
      
      {/* Details */}
      <div className="bg-stone-50 rounded-2xl p-5 mx-1">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Details</h2>
        <dl className="space-y-0">
          <DetailRow label="Medium" value={object.medium} />
          <DetailRow label="Dimensions" value={object.dimensions} />
          <DetailRow label="Classification" value={object.classification} />
          <DetailRow label="Department" value={object.department} />
          <DetailRow label="Culture" value={object.culture} />
          <DetailRow label="Period" value={object.period} />
          <DetailRow label="Country" value={object.country} />
          <DetailRow label="Credit Line" value={object.creditLine} />
        </dl>
      </div>
      
      {/* Met link */}
      {object.objectURL && (
        <a
          href={object.objectURL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mx-1 py-4 
                     text-stone-600 hover:text-stone-900 transition-colors"
        >
          <span>View on Met Museum website</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}

// Main page component
export default function ObjectPage() {
  const params = useParams();
  const router = useRouter();
  const objectId = params.id as string;

  const { data, error, isLoading, mutate } = useSWR<MetObject>(
    objectId ? `/api/object/${objectId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const is404 = error && (error as Error & { status?: number }).status === 404;

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="h-5 bg-stone-200 rounded w-32 animate-pulse" />
            ) : data?.title ? (
              <h1 className="text-sm font-medium text-stone-600 truncate">
                {data.title}
              </h1>
            ) : null}
          </div>
          
          {data?.department && (
            <span className="text-xs text-stone-400 truncate max-w-[100px]">
              {data.department}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {isLoading ? (
          <ObjectSkeleton />
        ) : is404 ? (
          <NotFound />
        ) : error ? (
          <ErrorState onRetry={() => mutate()} />
        ) : data ? (
          <ObjectDetail object={data} />
        ) : null}
      </div>
    </main>
  );
}

