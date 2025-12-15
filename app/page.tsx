'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Artwork {
  objectID: number;
  title: string | null;
  artistDisplayName: string | null;
  objectDate: string | null;
  primaryImage: string | null;
}

async function getRandomObject(): Promise<Artwork> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/object/random`, {
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
      <div className="w-full aspect-[4/5] bg-stone-200 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-7 bg-stone-200 rounded-lg w-3/4" />
        <div className="h-5 bg-stone-200 rounded-lg w-1/2" />
        <div className="h-4 bg-stone-200 rounded-lg w-1/3" />
      </div>
    </div>
  );
}

function FeaturedObject() {
  const [object, setObject] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  const fetchObject = async () => {
    try {
      setLoading(true);
      const data = await getRandomObject();
      setObject(data);
    } catch (error) {
      console.error('Failed to fetch object:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObject();
  }, []);

  const handleShuffle = async () => {
    setShuffling(true);
    await fetchObject();
    // Small delay to show shuffle animation
    setTimeout(() => setShuffling(false), 300);
  };

  if (loading && !object) {
    return <ObjectSkeleton />;
  }

  if (!object) {
    return (
      <div className="text-center py-8 text-stone-500">
        Failed to load featured artwork
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Featured label with shuffle button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-400">
          <span className="w-8 h-px bg-stone-300" />
          <span>Today&apos;s Featured</span>
        </div>
        <button
          onClick={handleShuffle}
          disabled={shuffling || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 
                     hover:text-stone-900 hover:bg-stone-100 rounded-lg 
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-95"
          aria-label="Shuffle featured artwork"
        >
          <span className={`transition-transform duration-300 ${shuffling ? 'rotate-180' : ''}`}>
            🔀
          </span>
          <span>Shuffle</span>
        </button>
      </div>

      <Link 
        href={`/objects/${object.objectID}`}
        className="block group"
      >
        <div className={`space-y-4 transition-opacity duration-300 ${shuffling ? 'opacity-50' : 'opacity-100'}`}>
          {/* Image */}
          {object.primaryImage && (
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden 
                            bg-stone-100 shadow-lg shadow-stone-200/50
                            group-hover:shadow-xl group-hover:shadow-stone-300/50 
                            transition-shadow duration-300">
              <Image
                src={object.primaryImage}
                alt={object.title || 'Artwork'}
                fill
                className="object-contain group-hover:scale-[1.02] transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
              
              {/* View overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                              flex items-end justify-center pb-6">
                <span className="px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full 
                                 text-sm font-medium text-stone-800 shadow-lg">
                  View Artwork →
                </span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="space-y-2 px-1">
            <h2 className="text-xl font-semibold text-stone-900 leading-tight 
                           group-hover:text-stone-700 transition-colors">
              {object.title || 'Untitled'}
            </h2>
            
            {object.artistDisplayName && (
              <p className="text-stone-600">{object.artistDisplayName}</p>
            )}
            
            {object.objectDate && (
              <p className="text-sm text-stone-400">{object.objectDate}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center 
                            text-white font-bold text-lg shadow-lg shadow-stone-400/30">
              M
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Met Guide
            </h1>
          </div>
          <p className="text-stone-500 pl-[52px]">
            Your companion at The Met
          </p>
        </header>

        {/* Featured Object */}
        <FeaturedObject />

        {/* Quick actions */}
        <nav className="mt-10 grid grid-cols-2 gap-3">
          <Link 
            href="/scan"
            className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 
                       rounded-2xl text-center transition-all hover:shadow-lg hover:shadow-amber-200/50 
                       active:scale-95 border border-amber-100"
          >
            <div className="text-2xl mb-2">📷</div>
            <span className="text-sm font-medium text-stone-700">Scan Art</span>
            <p className="text-xs text-stone-500 mt-1">Identify artworks</p>
          </Link>
          <Link 
            href="/tours"
            className="p-5 bg-stone-100/80 hover:bg-stone-200/80 rounded-2xl text-center 
                       transition-all hover:shadow-lg hover:shadow-stone-200/50 active:scale-95"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <span className="text-sm font-medium text-stone-600">Tours</span>
            <p className="text-xs text-stone-400 mt-1">Explore curated art</p>
          </Link>
        </nav>
      </div>
    </main>
  );
}
