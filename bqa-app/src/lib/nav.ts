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
      { href: "/", label: "Dashboard", icon: LayoutGrid },
      { href: "/data-santri", label: "Data Santri", icon: BookOpen },
      { href: "/evaluasi", label: "Evaluasi Harian", icon: ClipboardList },
      { href: "/absensi", label: "Absensi Ustadz", icon: Clock },
      { href: "/tasmi", label: "Ujian Tasmi'", icon: Award },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { href: "/users", label: "Manajemen User", icon: Users, adminOnly: true },
      { href: "/laporan", label: "Laporan & Cetak", icon: ChartPie },
    ],
  },
  {
    title: "Sistem",
    items: [
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
