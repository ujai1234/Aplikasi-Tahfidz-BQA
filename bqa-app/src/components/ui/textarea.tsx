import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-line bg-background px-3.5 py-2.5 text-[13.5px] text-foreground shadow-none transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-[13.5px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
