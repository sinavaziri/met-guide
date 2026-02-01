'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-stone-500 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-stone-900 text-white rounded-full font-medium
                     hover:bg-stone-800 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
