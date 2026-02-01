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
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-stone-100 active:scale-95 transition-all text-stone-600" aria-label="Go back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-stone-900">My Collection</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('favorites')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'favorites' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
            ❤️ Favorites ({favorites.length})
          </button>
          <button onClick={() => setTab('recent')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'recent' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
            🕐 Recent ({recent.length})
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">{tab === 'favorites' ? '❤️' : '🕐'}</div>
            <h3 className="font-semibold text-stone-900 mb-2">
              {tab === 'favorites' ? 'No favorites yet' : 'No recently viewed'}
            </h3>
            <p className="text-sm text-stone-500">
              {tab === 'favorites' ? 'Tap the heart on any artwork to save it here.' : 'Artworks you view will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.objectID} className="relative group">
                <button onClick={() => router.push(`/objects/${item.objectID}`)} className="w-full text-left">
                  <div className="aspect-square relative rounded-xl overflow-hidden bg-stone-100 mb-2">
                    {item.primaryImageSmall && (
                      <Image src={item.primaryImageSmall} alt={item.title || 'Artwork'} fill className="object-cover" sizes="(max-width: 768px) 50vw, 200px" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-stone-900 line-clamp-2 leading-tight">{item.title}</p>
                  {item.artistDisplayName && <p className="text-xs text-stone-500 mt-0.5 truncate">{item.artistDisplayName}</p>}
                </button>
                {tab === 'favorites' && (
                  <button onClick={() => handleRemoveFavorite(item)} className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove from favorites">
                    <span className="text-sm">✕</span>
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
