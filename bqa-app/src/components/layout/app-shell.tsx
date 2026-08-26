"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { SIDEBAR_GRADIENT } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[268px] p-5 text-[#eef6f1]"
          style={{ backgroundImage: SIDEBAR_GRADIENT }}
        >
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col lg:pl-[268px]">
        <Topbar onMenu={() => setOpen(true)} />
        <main
          key={pathname}
          className="mx-auto w-full max-w-[1440px] flex-1 animate-fade-up space-y-6 p-4 md:p-6 lg:px-8"
        >
          {children}
        </main>
        <footer className="mt-2 border-t border-line px-4 py-5 text-center text-[12.5px] font-medium text-muted-foreground md:px-6 lg:px-8">
          <span className="font-arabic text-sm text-primary/70">
            طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
          </span>
          <span className="mx-2 text-line">•</span>
          © 2026 Pondok Pesantren Baitul Qur&apos;an Al-Ikhwan · v1.0
        </footer>
      </div>
    </div>
  );
}
