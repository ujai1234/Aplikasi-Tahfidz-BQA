import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type StatTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold"
  | "purple";

const iconTone: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  gold: "bg-gold-soft text-gold-ink",
  purple: "bg-purple-soft text-purple",
};

const barTone: Record<StatTone, string> = {
  primary: "[&>div]:bg-primary",
  success: "[&>div]:bg-success",
  warning: "[&>div]:bg-warning",
  danger: "[&>div]:bg-danger",
  info: "[&>div]:bg-info",
  gold: "[&>div]:bg-gold",
  purple: "[&>div]:bg-purple",
};

export function StatCard({
  icon: Icon,
  tone = "primary",
  value,
  label,
  footer,
  progress,
  delay = 0,
}: {
  icon: LucideIcon;
  tone?: StatTone;
  value: string;
  label: string;
  footer?: string;
  progress?: number;
  delay?: number;
}) {
  return (
    <Card
      className="animate-fade-up transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              iconTone[tone]
            )}
          >
            <Icon className="size-5" strokeWidth={1.9} />
          </span>
          <p className="font-display text-[26px] leading-none font-extrabold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <div className="mt-auto space-y-2">
          <p className="text-[12.5px] leading-snug font-bold text-muted-foreground">
            {label}
          </p>
          {typeof progress === "number" ? (
            <Progress value={progress} className={barTone[tone]} />
          ) : null}
          {footer ? (
            <p className="text-[11.5px] font-medium text-muted-foreground">{footer}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
