'use client';

import { ReactNode } from 'react';
import { AudioProvider } from '@/lib/audio-context';
import AudioPlayer from '@/components/AudioPlayer';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      {children}
      <AudioPlayer />
    </AudioProvider>
  );
}


