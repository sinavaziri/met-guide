export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-md mx-auto px-5 py-8">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-stone-200 rounded-xl" />
            <div className="h-7 bg-stone-200 rounded-lg w-32" />
          </div>

          {/* Image skeleton */}
          <div className="w-full aspect-[4/5] bg-stone-200 rounded-2xl" />

          {/* Text skeleton */}
          <div className="space-y-3">
            <div className="h-7 bg-stone-200 rounded-lg w-3/4" />
            <div className="h-5 bg-stone-200 rounded-lg w-1/2" />
          </div>
        </div>
      </div>
    </main>
  );
}
