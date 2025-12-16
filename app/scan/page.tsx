'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

interface AnalysisResult {
  probableTitle: string | null;
  probableArtist: string | null;
  keywords: string[];
  period: string | null;
  medium: string | null;
}

interface SearchResult {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  objectDate: string | null;
  department: string;
  primaryImageSmall: string;
  matchScore: number;
  matchReason: string;
}

interface IdentifyResponse {
  isArtwork: boolean;
  message?: string;
  analysis: AnalysisResult;
  results: SearchResult[];
  totalCandidates: number;
}

// Fun facts to display during loading
const FUN_FACTS = [
  "The Met has over 2 million artworks in its collection...",
  "The Temple of Dendur was a gift from Egypt to the US in 1965...",
  "Van Gogh's Starry Night was painted from memory...",
  "The Met's rooftop garden offers stunning views of Central Park...",
  "Vermeer created only about 36 paintings in his lifetime...",
  "The Met was founded in 1870 and opened in 1872...",
  "The Egyptian Art collection spans 5,000 years...",
  "Monet painted over 250 water lily paintings...",
];

function getRandomFact(): string {
  return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [funFact, setFunFact] = useState(getRandomFact());
  const [notArtwork, setNotArtwork] = useState<string | null>(null);

  // Rotate fun facts during loading
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setFunFact(getRandomFact());
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResults(null);
    setAnalysis(null);
    setNotArtwork(null);

    try {
      // Compress image before processing
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPreview(base64);
        await identifyArtwork(base64);
      };
      reader.readAsDataURL(compressedFile);
      
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    }
  };

  const identifyArtwork = async (imageBase64: string) => {
    setIsLoading(true);
    setError(null);
    setFunFact(getRandomFact());

    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to identify artwork');
      }

      const data: IdentifyResponse = await response.json();
      
      if (!data.isArtwork) {
        setNotArtwork(data.message || 'This doesn\'t appear to be an artwork.');
        return;
      }

      setAnalysis(data.analysis);
      setResults(data.results);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to identify artwork');
    } finally {
      setIsLoading(false);
    }
  };

  const resetScan = () => {
    setPreview(null);
    setResults(null);
    setAnalysis(null);
    setError(null);
    setNotArtwork(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <h1 className="text-lg font-semibold text-stone-900">Scan Artwork</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Initial state - no image */}
        {!preview && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 
                              rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-5xl">📷</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">
                Identify Art
              </h2>
              <p className="text-stone-500 max-w-xs mx-auto">
                Take a photo of any artwork in the museum and we&apos;ll help you find it in the collection.
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold
                         hover:bg-stone-800 active:scale-[0.98] transition-all
                         flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>

            <div className="text-center">
              <p className="text-sm text-stone-400">
                Or select an image from your library
              </p>
            </div>

            {/* Tips */}
            <div className="bg-stone-50 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-stone-900 text-sm">Tips for best results</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  <span>Get close to the artwork for a clear shot</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  <span>Avoid glare and reflections on glass</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  <span>Include the full artwork in the frame</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Preview and loading state */}
        {preview && (
          <div className="space-y-6">
            {/* Image preview */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
              <Image
                src={preview}
                alt="Captured artwork"
                fill
                className="object-contain"
              />
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm 
                                flex flex-col items-center justify-center text-white p-6">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white 
                                    rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">🔍</span>
                    </div>
                  </div>
                  <p className="font-semibold text-lg mb-2">Identifying artwork...</p>
                  <p className="text-sm text-white/70 text-center animate-pulse">
                    {funFact}
                  </p>
                </div>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Identification failed</h3>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
                <button
                  onClick={resetScan}
                  className="mt-4 w-full py-3 bg-red-100 text-red-700 rounded-xl 
                             font-medium hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Not an artwork state */}
            {notArtwork && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🤔</div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Not recognized as artwork</h3>
                    <p className="text-sm text-amber-600">{notArtwork}</p>
                  </div>
                </div>
                <button
                  onClick={resetScan}
                  className="mt-4 w-full py-3 bg-amber-100 text-amber-700 rounded-xl 
                             font-medium hover:bg-amber-200 transition-colors"
                >
                  Try Another Photo
                </button>
              </div>
            )}

            {/* Analysis results */}
            {analysis && !isLoading && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-2">
                  What we detected
                </h3>
                <div className="space-y-1 text-sm">
                  {analysis.probableArtist && (
                    <p className="text-stone-700">
                      <span className="text-stone-400">Artist:</span> {analysis.probableArtist}
                    </p>
                  )}
                  {analysis.probableTitle && (
                    <p className="text-stone-700">
                      <span className="text-stone-400">Title:</span> {analysis.probableTitle}
                    </p>
                  )}
                  {analysis.period && (
                    <p className="text-stone-700">
                      <span className="text-stone-400">Period:</span> {analysis.period}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Search results */}
            {results && results.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-stone-900">
                  Possible matches
                </h3>
                
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <button
                      key={result.objectID}
                      onClick={() => router.push(`/objects/${result.objectID}`)}
                      className="w-full flex items-center gap-4 p-3 bg-white border border-stone-200 
                                 rounded-xl hover:border-stone-300 hover:shadow-md 
                                 transition-all text-left group"
                    >
                      {/* Rank badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                                       text-sm font-bold flex-shrink-0
                                       ${index === 0 
                                         ? 'bg-amber-100 text-amber-700' 
                                         : 'bg-stone-100 text-stone-500'}`}>
                        {index + 1}
                      </div>
                      
                      {/* Thumbnail */}
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-stone-100 
                                      flex-shrink-0">
                        <Image
                          src={result.primaryImageSmall}
                          alt={result.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 line-clamp-1 
                                      group-hover:text-stone-700">
                          {result.title}
                        </p>
                        {result.artistDisplayName && (
                          <p className="text-sm text-stone-500 truncate">
                            {result.artistDisplayName}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 mt-0.5">
                          {result.matchReason}
                        </p>
                      </div>
                      
                      {/* Arrow */}
                      <svg 
                        className="w-5 h-5 text-stone-300 group-hover:text-stone-500 
                                   group-hover:translate-x-1 transition-all flex-shrink-0"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* No match fallback */}
                <div className="text-center pt-4">
                  <p className="text-sm text-stone-400 mb-2">
                    Not what you&apos;re looking for?
                  </p>
                  <button
                    onClick={resetScan}
                    className="text-sm text-stone-600 font-medium hover:text-stone-900"
                  >
                    Try another photo →
                  </button>
                </div>
              </div>
            )}

            {/* No results */}
            {results && results.length === 0 && !notArtwork && (
              <div className="bg-stone-50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-stone-900 mb-2">No matches found</h3>
                <p className="text-sm text-stone-500 mb-4">
                  We couldn&apos;t find this artwork in the Met collection. 
                  It might not be in our database, or try a clearer photo.
                </p>
                <button
                  onClick={resetScan}
                  className="px-6 py-2 bg-stone-900 text-white rounded-full text-sm 
                             font-medium hover:bg-stone-800"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Scan again button */}
            {!isLoading && !error && results && (
              <button
                onClick={resetScan}
                className="w-full py-4 bg-stone-100 text-stone-700 rounded-2xl font-medium
                           hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan Another Artwork
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}


