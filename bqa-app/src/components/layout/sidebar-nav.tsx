"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut } from "lucide-react";
import { toast } from "sonner";
import { NAV_GROUPS } from "@/lib/nav";
import { useAuth } from "@/components/providers/auth-provider";
import { cn, initialsOf } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (user?.role === "Kepsek" && item.href === "/evaluasi") return false;
      if (!item.adminOnly) return true;
      return user?.role === "Admin";
    }),
  })).filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    toast.info("Anda telah keluar dari sistem. Barakallah!");
    router.push("/login");
  };

  const userInitials = initialsOf(user?.nama ?? "User");
  const userScope = user?.halqah ? `${user.role} (${user.halqah})` : user?.role ?? "User";

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-md">
            <BookOpen className="size-5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="font-display text-[15px] font-extrabold text-white tracking-wide">
              Tahfidz App
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-300">
              Baitul Qur&apos;an Al-Ikhwan
            </p>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav
          aria-label="Navigasi utama"
          className="space-y-1 overflow-y-auto py-4"
        >
          {groups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="mb-2 px-3 text-[10.5px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all duration-200",
                        active
                          ? "bg-emerald-600 text-white shadow-md font-bold"
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon className="size-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10.5px] font-extrabold text-slate-900">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Card at bottom matching screenshot */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-inner">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-900/80 text-emerald-300 font-bold border border-emerald-500/30 text-xs">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-bold text-white">
                {user?.nama ?? "Ustadz"}
              </p>
              <p className="truncate text-[11px] font-medium text-emerald-400/90 mt-0.5">
                {userScope}
              </p>
              {user?.email && (
                <p className="truncate text-[10.5px] text-slate-400 mt-0.5">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-bold text-slate-200 transition-all hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-200 shadow-2xs"
          >
            <LogOut className="size-3.5" strokeWidth={2} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
}
