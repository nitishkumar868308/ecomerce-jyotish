export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Page title skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="h-9 w-32 rounded-lg shimmer" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5"
          >
            <div className="mb-3 h-4 w-24 rounded shimmer" />
            <div className="mb-1 h-7 w-20 rounded shimmer" />
            <div className="h-3 w-16 rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-[var(--border-primary)] px-5 py-4">
          <div className="h-4 w-32 rounded shimmer" />
          <div className="ml-auto h-9 w-40 rounded-lg shimmer" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--border-primary)] px-5 py-3.5 last:border-b-0"
          >
            <div className="h-4 w-8 rounded shimmer" />
            <div className="h-4 w-40 rounded shimmer" />
            <div className="h-4 w-28 rounded shimmer" />
            <div className="ml-auto h-4 w-20 rounded shimmer" />
            <div className="h-6 w-16 rounded-full shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
