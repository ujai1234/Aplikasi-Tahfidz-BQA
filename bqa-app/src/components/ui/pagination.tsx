import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function PagerButton({ active = false, children }: { active?: boolean; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      aria-current={active ? "page" : undefined}
      className={cn("h-[30px] min-w-[30px] rounded-lg px-1.5 text-[12.5px]", !active && "text-muted-foreground")}
    >
      {children}
    </Button>
  );
}

export function Pagination({
  info,
  page = 1,
  pages = 3,
}: {
  info: string;
  page?: number;
  pages?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-[12.5px] text-muted-foreground">
      <span>{info}</span>
      <nav className="flex gap-1.5" aria-label="Paginasi">
        <PagerButton>‹</PagerButton>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <PagerButton key={p} active={p === page}>
            {p}
          </PagerButton>
        ))}
        <PagerButton>›</PagerButton>
      </nav>
    </div>
  );
}
