import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function AvatarInitials({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback className="bg-primary-soft text-[11px] font-extrabold text-primary-dark">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserCell({
  initials,
  name,
  sub,
}: {
  initials: string;
  name: string;
  sub?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <AvatarInitials initials={initials} />
      <span className="leading-tight">
        {name}
        {sub ? (
          <span className="block text-[11.5px] font-medium text-muted-foreground">{sub}</span>
        ) : null}
      </span>
    </span>
  );
}
