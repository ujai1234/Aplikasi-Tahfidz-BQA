import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-xl border border-line bg-[#fbfdfc] px-3.5 py-2.5 text-[13.5px] text-ink shadow-none transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#77877c] selection:bg-primary selection:text-white focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#eef3ef] disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 read-only:cursor-not-allowed read-only:bg-[#eef3ef] read-only:text-muted-foreground md:text-[13.5px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
