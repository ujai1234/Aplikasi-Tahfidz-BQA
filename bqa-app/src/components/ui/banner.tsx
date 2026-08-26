import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "border-info/25 bg-info-soft text-[#2b5490]",
  success: "border-success/25 bg-success-soft text-[#116a3b]",
  warning: "border-warning/25 bg-warning-soft text-[#8a5406]",
  danger: "border-danger/25 bg-danger-soft text-[#8f2b2b]",
};

export function Banner({
  tone = "info",
  icon: Icon,
  className,
  children,
}: {
  tone?: Tone;
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Alert className={cn("border", tones[tone], className)}>
      <Icon className="size-[18px]" strokeWidth={1.9} />
      <AlertDescription className="text-[13px] leading-relaxed text-current">
        {children}
      </AlertDescription>
    </Alert>
  );
}
