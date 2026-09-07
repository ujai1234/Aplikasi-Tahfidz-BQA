"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { initialsOf } from "@/lib/utils";
import { roleVariantLabel } from "@/lib/user-utils";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info("Anda telah keluar dari sistem. Barakallah!");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
      <Button
        variant="outline"
        size="icon"
        onClick={onMenu}
        aria-label="Buka menu navigasi"
        className="lg:hidden"
      >
        <Menu className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Cari santri, ustadz…"
            aria-label="Pencarian"
            className="h-10 w-56 rounded-xl border border-transparent bg-[#ebf1ed] pr-3.5 pl-10 text-[13px] text-ink outline-none transition-colors placeholder:text-[#77877c] focus:border-primary focus:bg-surface dark:bg-black/20"
          />
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Notifikasi"
              className="text-muted-foreground"
            >
              <Bell className="size-[18px]" strokeWidth={1.9} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info("Belum ada notifikasi baru")}>
              Belum ada notifikasi baru
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu akun"
              className="flex items-center gap-2.5 rounded-full border border-line bg-card py-1 pr-3.5 pl-1 transition-colors hover:border-primary/40"
            >
              <Avatar className="size-[34px]">
                <AvatarFallback className="bg-gradient-to-br from-primary to-[#1ba377] text-[12.5px] font-extrabold text-white">
                  {initialsOf(user?.nama ?? "?")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden leading-tight sm:block">
                <span className="block text-[13px] font-bold">{user?.nama}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {roleVariantLabel(user)}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                toast.message(
                  `${user?.nama} — ${user?.role}${
                    user?.halqah ? ` · Halqah ${user.halqah}` : ""
                  }`
                )
              }
            >
              <UserRound /> Profil Saya
            </DropdownMenuItem>
            {user?.role === "Admin" && (
              <DropdownMenuItem asChild>
                <Link href="/pengaturan">
                  <Settings /> Pengaturan Sistem
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOut /> Log Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
