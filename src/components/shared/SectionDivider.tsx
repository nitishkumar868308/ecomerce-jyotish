import { cn } from "@/lib/utils";

interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) {
    return (
      <hr
        className={cn(
          "border-t border-[var(--border-primary)] my-6",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("relative my-6", className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[var(--border-primary)]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-muted)]">
          {label}
        </span>
      </div>
    </div>
  );
}

export default SectionDivider;
