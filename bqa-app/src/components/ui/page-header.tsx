import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  arabic = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  actions,
  className,
}: {
  title: string;
  subtitle: string;
  arabic?: string | null;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {arabic ? (
          <p className="font-arabic text-base leading-relaxed text-primary/70">
            {arabic}
          </p>
        ) : null}
        <h1 className="font-display text-[22px] font-extrabold tracking-tight text-ink md:text-2xl">
          {title}
        </h1>
        <p className="text-[13px] font-medium text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5 pb-0.5">{actions}</div>
      ) : null}
    </header>
  );
}
