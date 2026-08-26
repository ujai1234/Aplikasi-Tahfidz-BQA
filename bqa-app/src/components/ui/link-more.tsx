import Link from "next/link";
import type { ReactNode } from "react";

export function LinkMore({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[12.5px] font-bold whitespace-nowrap text-primary hover:underline"
    >
      {children}
    </Link>
  );
}
