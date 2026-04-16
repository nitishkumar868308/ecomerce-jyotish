import { Spinner } from "@/components/ui/loader/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <Spinner size="lg" />
    </div>
  );
}
