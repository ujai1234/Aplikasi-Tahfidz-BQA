import {
  Award,
  BookOpen,
  ChartPie,
  ClipboardList,
  Clock,
  LayoutGrid,
  Save,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
  hideFor?: Role[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Menu Utama",
    items: [
      { href: "/", label: "Dashboard Overview", icon: LayoutGrid },
      { href: "/absensi", label: "Presensi Kehadiran", icon: Clock },
      { href: "/data-santri", label: "Data Santri", icon: BookOpen },
      { href: "/evaluasi", label: "Input Evaluasi", icon: ClipboardList },
      { href: "/tasmi", label: "Input Tasmi'", icon: Award },
      { href: "/laporan", label: "Laporan & Cetak", icon: ChartPie },
    ],
  },
  {
    title: "Manajemen & Sistem",
    items: [
      { href: "/users", label: "Manajemen User", icon: Users, adminOnly: true },
      {
        href: "/pengaturan",
        label: "Pengaturan",
        icon: SlidersHorizontal,
        adminOnly: true,
      },
      {
        href: "/backup",
        label: "Backup & Reset",
        icon: Save,
        adminOnly: true,
      },
    ],
  },
];
