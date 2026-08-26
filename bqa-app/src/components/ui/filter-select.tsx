"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function FilterSelect({
  label,
  options,
  className,
  value,
  onValueChange,
}: {
  label: string
  options: string[]
  className?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const controlled = onValueChange !== undefined

  return (
    <Select
      {...(controlled ? { value, onValueChange } : { defaultValue: options[0] })}
    >
      <SelectTrigger
        aria-label={label}
        className={cn("h-10 w-auto min-w-36 bg-surface text-[13px]", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
