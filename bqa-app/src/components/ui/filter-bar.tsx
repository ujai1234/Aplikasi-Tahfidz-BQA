"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-5 py-3.5">
      {children}
    </div>
  );
}

export function FilterSearch({
  placeholder,
  label,
  onValueChange,
}: {
  placeholder: string;
  label: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="relative h-10 min-w-44 flex-1">
      <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => onValueChange?.(event.target.value)}
        className="h-10 border-transparent bg-[#ebf1ed] pr-3.5 pl-10 focus-visible:bg-surface"
      />
    </div>
  );
}

export function FilterDate({
  label,
  value,
  defaultValue,
  onValueChange,
}: {
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Input
      type="date"
      aria-label={label}
      {...(onValueChange
        ? { value, onChange: (event) => onValueChange(event.target.value) }
        : { defaultValue })}
      className="h-10 w-auto bg-surface font-semibold"
    />
  );
}
