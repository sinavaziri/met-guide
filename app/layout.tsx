import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Outfit, Fraunces } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const fraunces = Fraunces({ 
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Met Guide',
  description: 'Your companion at The Metropolitan Museum of Art',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Met Guide',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#fafaf9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="antialiased bg-stone-50 dark:bg-neutral-950 text-stone-900 dark:text-neutral-100">
        <Providers>
          {/* Theme toggle - fixed top right */}
          <div className="fixed top-4 right-4 z-40">
            <ThemeToggle />
          </div>
          
          {/* Main content with bottom padding for nav */}
          <div className="pb-20">
            {children}
          </div>
          
          {/* Bottom navigation */}
          <BottomNav />
        </Providers>
        <Analytics />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
