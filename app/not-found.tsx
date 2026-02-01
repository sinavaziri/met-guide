import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🏛️</div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Page Not Found</h2>
        <p className="text-stone-500 mb-6">
          This gallery seems to be closed. Let's get you back on track.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-stone-900 text-white rounded-full font-medium
                     hover:bg-stone-800 active:scale-95 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
