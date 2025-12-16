'use client';

import { useAudio } from '@/lib/audio-context';
import Link from 'next/link';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    isLoading, 
    progress, 
    duration, 
    error,
    pause, 
    resume, 
    stop 
  } = useAudio();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 
                    shadow-lg shadow-stone-200/50 safe-area-bottom">
      <div className="max-w-md mx-auto">
        {/* Progress bar */}
        <div className="h-1 bg-stone-200">
          <div 
            className="h-full bg-amber-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            onClick={() => isPlaying ? pause() : resume()}
            disabled={isLoading}
            className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center 
                       justify-center hover:bg-stone-800 active:scale-95 transition-all
                       disabled:opacity-50 disabled:cursor-wait flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white 
                              rounded-full animate-spin" />
            ) : isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <Link 
              href={`/objects/${currentTrack.objectId}`}
              className="block"
            >
              <p className="font-medium text-stone-900 truncate text-sm hover:text-stone-700">
                {currentTrack.title}
              </p>
            </Link>
            
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : (
              <p className="text-xs text-stone-500">
                {formatTime(progress)} / {formatTime(duration)}
              </p>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={stop}
            className="w-10 h-10 rounded-full flex items-center justify-center
                       text-stone-400 hover:text-stone-600 hover:bg-stone-100 
                       transition-colors flex-shrink-0"
            aria-label="Close player"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


