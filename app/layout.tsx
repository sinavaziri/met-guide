import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Met Guide',
  description: 'Your companion at The Metropolitan Museum of Art',
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
    <html lang="en">
      <body className="antialiased bg-stone-50 text-stone-900">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
