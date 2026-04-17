"use client";

export default function QuickGoLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--qg-primary,#0d9488)]/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--qg-primary,#0d9488)]" />
        </div>
        <p className="text-sm text-[var(--qg-text-secondary,#64748b)]">Loading...</p>
      </div>
    </div>
  );
}
