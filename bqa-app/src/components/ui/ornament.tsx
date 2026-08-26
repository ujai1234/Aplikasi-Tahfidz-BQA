import { cn } from "@/lib/utils";

export function Ornament({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3 text-gold", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/40" />
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
        <rect x="6.5" y="6.5" width="11" height="11" rx="1" />
        <rect
          x="6.5"
          y="6.5"
          width="11"
          height="11"
          rx="1"
          opacity=".5"
          transform="rotate(45 12 12)"
        />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/40" />
    </div>
  );
}
