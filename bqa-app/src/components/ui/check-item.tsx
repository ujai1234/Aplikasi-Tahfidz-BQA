import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CheckItem({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-[13px] font-semibold",
        !ok && "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "grid size-[22px] shrink-0 place-items-center rounded-full",
          ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
        )}
      >
        {ok ? (
          <Check className="size-3" strokeWidth={3.2} />
        ) : (
          <X className="size-3" strokeWidth={3.2} />
        )}
      </span>
      <span>{children}</span>
    </div>
  );
}
