'use client';

import { ReactNode } from 'react';
import { AudioProvider } from '@/lib/audio-context';
import AudioPlayer from '@/components/AudioPlayer';
import ThemeProvider from '@/components/ThemeProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AudioProvider>
        {children}
        <AudioPlayer />
      </AudioProvider>
    </ThemeProvider>
  );
}
