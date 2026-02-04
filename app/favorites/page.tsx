'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFavorites, getRecentlyViewed, toggleFavorite, SavedArtwork } from '@/lib/favorites';

export default function FavoritesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'favorites' | 'recent'>('favorites');
  const [favorites, setFavorites] = useState<SavedArtwork[]>([]);
  const [recent, setRecent] = useState<SavedArtwork[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    setRecent(getRecentlyViewed());
  }, []);

  const items = tab === 'favorites' ? favorites : recent;

  const handleRemoveFavorite = (artwork: SavedArtwork) => {
    toggleFavorite(artwork);
    setFavorites(getFavorites());
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-stone-100 dark:border-neutral-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 
                       active:scale-95 transition-all text-stone-600 dark:text-neutral-300" 
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-stone-900 dark:text-neutral-100">My Collection</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setTab('favorites')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'favorites' 
                ? 'bg-stone-900 dark:bg-amber-600 text-white' 
                : 'bg-stone-100 dark:bg-neutral-900 text-stone-600 dark:text-neutral-400 hover:bg-stone-150 dark:hover:bg-neutral-800'
            }`}
          >
            ❤️ Favorites ({favorites.length})
          </button>
          <button 
            onClick={() => setTab('recent')} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'recent' 
                ? 'bg-stone-900 dark:bg-amber-600 text-white' 
                : 'bg-stone-100 dark:bg-neutral-900 text-stone-600 dark:text-neutral-400 hover:bg-stone-150 dark:hover:bg-neutral-800'
            }`}
          >
            🕐 Recent ({recent.length})
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-neutral-900 
                            flex items-center justify-center">
              <span className="text-4xl">
                {tab === 'favorites' ? '❤️' : '🕐'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-neutral-100 mb-2">
              {tab === 'favorites' ? 'No favorites yet' : 'No recently viewed'}
            </h3>
            <p className="text-sm text-stone-500 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
              {tab === 'favorites' 
                ? 'Start building your personal collection by tapping the heart icon on any artwork you love.' 
                : 'Artworks you explore will automatically appear here for quick access.'}
            </p>
            <button
              onClick={() => router.push(tab === 'favorites' ? '/' : '/search')}
              className="px-5 py-2.5 bg-stone-900 dark:bg-amber-600 text-white rounded-xl 
                         font-medium hover:bg-stone-800 dark:hover:bg-amber-500 
                         active:scale-95 transition-all"
            >
              {tab === 'favorites' ? 'Explore Art' : 'Search Artworks'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.objectID} className="relative group">
                <button 
                  onClick={() => router.push(`/objects/${item.objectID}`)} 
                  className="w-full text-left"
                >
                  <div className="aspect-square relative rounded-xl overflow-hidden 
                                  bg-stone-100 dark:bg-neutral-900 mb-2 
                                  group-hover:shadow-lg dark:group-hover:shadow-black/50 
                                  transition-shadow">
                    {item.primaryImageSmall && (
                      <Image 
                        src={item.primaryImageSmall} 
                        alt={item.title || 'Artwork'} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300" 
                        sizes="(max-width: 768px) 50vw, 200px" 
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium text-stone-900 dark:text-neutral-100 line-clamp-2 leading-tight">
                    {item.title}
                  </p>
                  {item.artistDisplayName && (
                    <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5 truncate">
                      {item.artistDisplayName}
                    </p>
                  )}
                </button>
                {tab === 'favorites' && (
                  <button 
                    onClick={() => handleRemoveFavorite(item)} 
                    className="absolute top-2 right-2 w-8 h-8 
                               bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm 
                               rounded-full flex items-center justify-center 
                               opacity-0 group-hover:opacity-100 transition-opacity
                               hover:bg-red-50 dark:hover:bg-red-950 
                               text-stone-600 dark:text-neutral-300
                               hover:text-red-600 dark:hover:text-red-400" 
                    aria-label="Remove from favorites"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
