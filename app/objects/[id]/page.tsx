'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { useAudio } from '@/lib/audio-context';

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
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-sm 
                        rounded-full text-white text-xs font-medium opacity-70 text-center">
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

// Narration response type
interface NarrationResponse {
  narration: string;
  cached: boolean;
}

// Guide section component
function GuideSection({ objectId, title }: { objectId: number; title: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [narration, setNarration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audio = useAudio();

  const fetchNarration = async () => {
    if (narration) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/narrate?id=${objectId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load guide');
      }

      const data: NarrationResponse = await response.json();
      setNarration(data.narration);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guide');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (narration) {
      audio.play({
        objectId,
        title,
        text: narration,
      });
    }
  };

  return (
    <div className="mx-1">
      <button
        onClick={fetchNarration}
        disabled={isLoading}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r 
                   from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100
                   rounded-2xl transition-all duration-200 group border border-amber-100
                   disabled:opacity-70 disabled:cursor-wait"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center
                          shadow-sm group-hover:scale-110 transition-transform">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent 
                              rounded-full animate-spin" />
            ) : (
              <span className="text-xl">🎙️</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-stone-900">
              {isLoading ? 'Loading guide...' : 'Audio Guide'}
            </h3>
            <p className="text-sm text-stone-500">
              {narration ? 'Tap to read' : 'Learn the story behind this piece'}
            </p>
          </div>
        </div>
        
        <svg 
          className={`w-5 h-5 text-stone-400 transition-transform duration-200
                      ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error state */}
      {error && (
        <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchNarration}
            className="mt-2 text-sm text-red-700 font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Narration content */}
      {isExpanded && narration && (
        <div className="mt-3 p-5 bg-stone-50 rounded-2xl border border-stone-100
                        animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center
                              flex-shrink-0">
                <span className="text-sm">🎨</span>
              </div>
              <div>
                <h4 className="font-medium text-stone-900 text-sm">Your Guide</h4>
                <p className="text-xs text-stone-400">AI-generated narration</p>
              </div>
            </div>
            
            {/* Listen button */}
            <button
              onClick={handlePlayAudio}
              disabled={audio.isLoading && audio.currentTrack?.objectId === objectId}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white 
                         rounded-full text-sm font-medium hover:bg-stone-800 
                         active:scale-95 transition-all disabled:opacity-50"
            >
              {audio.isLoading && audio.currentTrack?.objectId === objectId ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white 
                                  rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : audio.isPlaying && audio.currentTrack?.objectId === objectId ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  <span>Playing</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-stone-700 leading-relaxed whitespace-pre-line">
            {narration}
          </p>
          
          <div className="mt-4 pt-4 border-t border-stone-200">
            <p className="text-xs text-stone-400 italic">
              💡 Tip: This narration is generated by AI based on museum records. 
              For verified information, check the Met&apos;s official website.
            </p>
          </div>
        </div>
      )}
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

      {/* Guide Section */}
      <GuideSection objectId={object.objectID} title={object.title || 'Untitled'} />
      
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

