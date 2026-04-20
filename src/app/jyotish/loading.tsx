"use client";

import { Loader } from "@/components/ui/Loader";

export default function JyotishLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--jy-bg-primary)]">
      <Loader variant="section" message="Loading..." />
    </div>
  );
}
