'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { prefetchAudioGuide } from '@/lib/prefetch-audio';

interface Artwork {
  objectID: number;
  title: string | null;
  artistDisplayName: string | null;
  objectDate: string | null;
  primaryImage: string | null;
}

async function getRandomObject(): Promise<Artwork> {
  // Use relative URL for client-side fetches (works on any domain)
  const res = await fetch('/api/object/random', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch object');
  }

  return res.json();
}

function ObjectSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {/* Image skeleton with shimmer effect */}
      <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-stone-200 dark:from-neutral-800 to-stone-300 dark:to-neutral-700 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="space-y-3">
        <div className="h-7 bg-stone-200 dark:bg-neutral-800 rounded-lg w-3/4" />
        <div className="h-5 bg-stone-200 dark:bg-neutral-800 rounded-lg w-1/2" />
        <div className="h-4 bg-stone-200 dark:bg-neutral-800 rounded-lg w-1/3" />
      </div>
    </div>
  );
}

const STORAGE_KEY = 'met-guide-featured-artwork';

function FeaturedObject() {
  const [object, setObject] = useState<Artwork | null>(null);
  const [displayedObject, setDisplayedObject] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchObject = async (forceNew = false) => {
    try {
      setLoading(true);
      setError(false);
      
      // Check sessionStorage first (unless forcing new)
      if (!forceNew && typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setObject(parsed);
            setDisplayedObject(parsed);
            setLoading(false);
            return;
          } catch {
            // Invalid stored data, fetch new
          }
        }
      }
      
      const data = await getRandomObject();
      setObject(data);
      
      // For initial load, set displayed object immediately
      if (!displayedObject) {
        setDisplayedObject(data);
      }
      
      // Save to sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to fetch object:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObject(false);
  }, []);

  // Handle smooth transition when object changes during shuffle
  useEffect(() => {
    if (object && displayedObject && object.objectID !== displayedObject.objectID && shuffling) {
      setTransitioning(true);
      // Wait for fade out, then swap content
      const timer = setTimeout(() => {
        setDisplayedObject(object);
        // Wait a frame then fade in
        requestAnimationFrame(() => {
          setTransitioning(false);
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [object, displayedObject, shuffling]);

  // Prefetch audio guide when object is displayed
  // Delay slightly to prioritize visible content loading first
  useEffect(() => {
    if (!object?.objectID) return;

    // Clear any pending prefetch timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Delay prefetch to not compete with image loading
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchAudioGuide(object.objectID);
    }, 1500);

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [object?.objectID]);

  const handleShuffle = async () => {
    setShuffling(true);
    await fetchObject(true); // Force fetch new artwork
    // Keep shuffling state until transition completes
    setTimeout(() => setShuffling(false), 600);
  };

  if (loading && !displayedObject) {
    return <ObjectSkeleton />;
  }

  if (error || !displayedObject) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">🎨</div>
        <div className="space-y-2">
          <h3 className="font-semibold text-stone-900 dark:text-neutral-100">
            Unable to load artwork
          </h3>
          <p className="text-sm text-stone-500 dark:text-neutral-400">
            Please check your connection and try again
          </p>
        </div>
        <button
          onClick={() => fetchObject(true)}
          className="px-4 py-2 bg-stone-900 dark:bg-amber-600 text-white rounded-lg 
                     hover:bg-stone-800 dark:hover:bg-amber-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isAnimating = shuffling || transitioning;

  return (
    <div className="space-y-4">
      {/* Featured label with shuffle button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 museum-label">
          <span className="w-8 h-px gallery-divider" />
          <span>Today&apos;s Featured</span>
        </div>
        <button
          onClick={handleShuffle}
          disabled={shuffling || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-neutral-300
                     hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg 
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-95"
          aria-label="Shuffle featured artwork"
        >
          <span className={`transition-transform duration-500 ${shuffling ? 'rotate-[360deg]' : ''}`}>
            🔀
          </span>
          <span>Shuffle</span>
        </button>
      </div>

      <Link 
        href={`/objects/${displayedObject.objectID}`}
        className="block group"
      >
        <div 
          className={`space-y-4 transition-all duration-300 ease-out
                      ${transitioning ? 'opacity-0 scale-[0.98] blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}
        >
          {/* Image */}
          {displayedObject.primaryImage && (
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden 
                            bg-stone-100 dark:bg-neutral-900 shadow-lg shadow-met-red/10 dark:shadow-black/50
                            group-hover:shadow-xl group-hover:shadow-met-red/20 dark:group-hover:shadow-black/70
                            transition-shadow duration-300">
              <Image
                src={displayedObject.primaryImage}
                alt={displayedObject.title || 'Artwork'}
                fill
                className={`object-contain transition-transform duration-500
                            ${isAnimating ? '' : 'group-hover:scale-[1.02]'}`}
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
              
              {/* View overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                              flex items-end justify-center pb-6">
                <span className="px-5 py-2.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full 
                                 text-sm font-medium text-stone-800 dark:text-neutral-100 shadow-lg">
                  View Artwork →
                </span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="space-y-2 px-1">
            <h2 className="text-xl font-semibold text-stone-900 dark:text-neutral-100 leading-tight 
                           group-hover:text-stone-700 dark:group-hover:text-amber-400 transition-colors">
              {displayedObject.title || 'Untitled'}
            </h2>
            
            {displayedObject.artistDisplayName && (
              <p className="text-stone-600 dark:text-neutral-300">{displayedObject.artistDisplayName}</p>
            )}
            
            {displayedObject.objectDate && (
              <p className="text-sm text-stone-400 dark:text-neutral-500">{displayedObject.objectDate}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* Header with improved branding */}
        <header className="mb-10">
          <button 
            type="button"
            className="w-full text-left cursor-pointer"
            aria-label="Refresh Met Guide home"
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12 bg-gradient-to-br from-met-red via-[#A00E26] to-[#8A0B20]
                              dark:from-met-gold dark:via-met-gold-light dark:to-met-gold
                              rounded-2xl flex items-center justify-center 
                              text-white font-serif text-2xl shadow-lg shadow-met-red/30 dark:shadow-met-gold/40
                              group-hover:shadow-xl transition-shadow">
                <span className="font-fraunces font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-neutral-100 tracking-tight">
                  Met Guide
                </h1>
                <p className="text-sm text-stone-500 dark:text-neutral-400">
                  Discover masterpieces
                </p>
              </div>
            </div>
          </button>
        </header>

        {/* Featured Object */}
        <FeaturedObject />

        {/* Divider */}
        <div className="mt-10 mb-6 gallery-divider" />

        {/* My Collection Link */}
        <Link href="/favorites" className="flex items-center justify-between p-4 
                                          bg-stone-50 dark:bg-neutral-900 rounded-2xl 
                                          border border-met-gold/20 dark:border-neutral-800 
                                          hover:bg-stone-100 dark:hover:bg-neutral-800 hover:border-met-gold/40 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-xl">❤️</span>
            <span className="text-sm font-medium text-stone-700 dark:text-neutral-200">My Collection</span>
          </div>
          <svg className="w-5 h-5 text-stone-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Quick actions */}
        <nav className="mt-6 grid grid-cols-3 gap-3">
          <Link 
            href="/scan"
            className="p-4 bg-gradient-to-br from-met-red/5 to-met-red/10
                       dark:from-met-gold/10 dark:to-met-gold/20
                       hover:from-met-red/10 hover:to-met-red/15
                       dark:hover:from-met-gold/15 dark:hover:to-met-gold/25
                       rounded-2xl text-center transition-all hover:shadow-lg hover:shadow-met-red/20
                       dark:hover:shadow-met-gold/30
                       active:scale-95 border border-met-red/20 dark:border-met-gold/30"
          >
            <div className="text-2xl mb-2">📷</div>
            <span className="text-sm font-medium text-stone-700 dark:text-neutral-200">Scan</span>
            <p className="text-xs text-stone-500 dark:text-neutral-400 mt-1">Identify art</p>
          </Link>
          <Link 
            href="/search"
            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 
                       dark:from-blue-950 dark:to-indigo-950
                       hover:from-blue-100 hover:to-indigo-100 
                       dark:hover:from-blue-900 dark:hover:to-indigo-900
                       rounded-2xl text-center transition-all hover:shadow-lg hover:shadow-blue-200/50 
                       dark:hover:shadow-blue-900/30
                       active:scale-95 border border-blue-100 dark:border-blue-900"
          >
            <div className="text-2xl mb-2">🔍</div>
            <span className="text-sm font-medium text-stone-700 dark:text-neutral-200">Search</span>
            <p className="text-xs text-stone-500 dark:text-neutral-400 mt-1">Find artwork</p>
          </Link>
          <Link 
            href="/tours"
            className="p-4 bg-stone-100/80 dark:bg-neutral-900 
                       hover:bg-stone-200/80 dark:hover:bg-neutral-800 rounded-2xl text-center 
                       transition-all hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-black/30
                       active:scale-95 border border-stone-200 dark:border-neutral-800"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <span className="text-sm font-medium text-stone-600 dark:text-neutral-300">Tours</span>
            <p className="text-xs text-stone-400 dark:text-neutral-500 mt-1">Curated art</p>
          </Link>
        </nav>
      </div>
    </main>
  );
}
