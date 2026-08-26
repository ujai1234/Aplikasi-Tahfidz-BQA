import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ActionButton({
  icon: Icon,
  title,
  danger = false,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={title}
          onClick={onClick}
          className={cn(
            "text-muted-foreground",
            danger
              ? "hover:border-danger hover:bg-danger-soft hover:text-danger"
              : "hover:text-primary"
          )}
        >
          <Icon className="size-4" strokeWidth={1.9} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
