'use client';

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

interface AudioTrack {
  objectId: number;
  title: string;
  text: string;
  audioUrl?: string;
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  error: string | null;
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback(async (track: AudioTrack) => {
    setIsLoading(true);
    setError(null);
    setCurrentTrack(track);

    try {
      // Generate audio URL with text for TTS
      const audioUrl = `/api/tts?id=${track.objectId}&text=${encodeURIComponent(track.text)}`;
      
      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
        
        // Set up event listeners
        audioRef.current.addEventListener('loadedmetadata', () => {
          setDuration(audioRef.current?.duration || 0);
        });
        
        audioRef.current.addEventListener('timeupdate', () => {
          setProgress(audioRef.current?.currentTime || 0);
        });
        
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setProgress(0);
        });
        
        audioRef.current.addEventListener('error', () => {
          setError('Failed to load audio');
          setIsLoading(false);
          setIsPlaying(false);
        });
      }
      
      // Set source and play
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      
      audioRef.current.oncanplaythrough = () => {
        setIsLoading(false);
        audioRef.current?.play();
        setIsPlaying(true);
      };
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play audio');
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTrack(null);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        progress,
        duration,
        error,
        play,
        pause,
        resume,
        stop,
        seek,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}


