"use client";

export default function JyotishLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--jy-bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--jy-accent-purple)]/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--jy-accent-gold)]" />
        </div>
        <p className="text-sm text-[var(--jy-text-muted)]">Loading...</p>
      </div>
    </div>
  );
}
