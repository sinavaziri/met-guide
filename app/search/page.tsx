'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

interface SearchResult {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  objectDate: string | null;
  primaryImageSmall: string | null;
  department: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Search Met API
      const searchRes = await fetch(
        `${MET_API_BASE}/search?hasImages=true&q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );

      if (!searchRes.ok) throw new Error('Search failed');

      const searchData = await searchRes.json();
      const objectIds: number[] = (searchData.objectIDs || []).slice(0, 12);

      if (objectIds.length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // Fetch details in parallel
      const detailResults = await Promise.allSettled(
        objectIds.map(async (id) => {
          const res = await fetch(`/api/object/${id}`, { signal: controller.signal });
          if (!res.ok) return null;
          return res.json();
        })
      );

      const items: SearchResult[] = detailResults
        .filter((r): r is PromiseFulfilledResult<SearchResult | null> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((obj): obj is SearchResult => obj !== null && !!(obj.primaryImageSmall));

      setResults(items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

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
          <h1 className="text-lg font-semibold text-stone-900">Search</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Search input */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by artist, title, keyword..."
              className="w-full pl-10 pr-4 py-3 bg-stone-100 rounded-xl text-stone-900
                         placeholder:text-stone-400 focus:outline-none focus:ring-2 
                         focus:ring-stone-900/20 transition-all"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-5 py-3 bg-stone-900 text-white rounded-xl font-medium
                       hover:bg-stone-800 active:scale-95 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Go'
            )}
          </button>
        </div>

        {/* Suggestions (before search) */}
        {!searched && (
          <div className="space-y-4">
            <p className="text-sm text-stone-400">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {['Monet', 'Van Gogh', 'Egyptian', 'Rembrandt', 'Japanese', 'Impressionist', 'Medieval armor'].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      // Trigger search after setting query
                      setTimeout(() => {
                        const btn = document.querySelector<HTMLButtonElement>('button[disabled]');
                        // Just set and let user click Go, or auto-search
                      }, 0);
                    }}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full
                               text-sm text-stone-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {searched && !isLoading && results.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold text-stone-900 mb-2">No results found</h3>
            <p className="text-sm text-stone-500">
              Try different keywords or a broader search term.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {results.map((item) => (
              <button
                key={item.objectID}
                onClick={() => router.push(`/objects/${item.objectID}`)}
                className="text-left group"
              >
                <div className="aspect-square relative rounded-xl overflow-hidden bg-stone-100 mb-2
                                group-hover:shadow-lg transition-shadow">
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
                <p className="text-sm font-medium text-stone-900 line-clamp-2 leading-tight">
                  {item.title}
                </p>
                {item.artistDisplayName && (
                  <p className="text-xs text-stone-500 mt-0.5 truncate">
                    {item.artistDisplayName}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-stone-200 rounded-xl mb-2" />
                <div className="h-4 bg-stone-200 rounded w-3/4 mb-1" />
                <div className="h-3 bg-stone-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
