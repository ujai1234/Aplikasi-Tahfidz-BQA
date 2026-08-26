import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
