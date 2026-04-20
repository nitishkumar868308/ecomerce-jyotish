"use client";

import { Loader } from "@/components/ui/Loader";

export default function QuickGoLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader variant="section" message="Loading..." />
    </div>
  );
}
