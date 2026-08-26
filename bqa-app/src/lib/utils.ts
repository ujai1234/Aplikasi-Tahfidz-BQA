import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BadgeVariant, CapaianStatus, Role } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ISLAMIC_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.05'%3E%3Cpath d='M32 4l8 20 20 8-20 8-8 20-8-20-20-8 20-8z'/%3E%3Ccircle cx='32' cy='32' r='6'/%3E%3C/g%3E%3C/svg%3E\")";

export const SIDEBAR_GRADIENT = "linear-gradient(180deg, #0f4a2e 0%, #0d4229 100%)";

export const LOGIN_GRADIENT = "linear-gradient(160deg, #0f4a2e 0%, #0a3527 100%)";

export const capaianVariant: Record<CapaianStatus, BadgeVariant> = {
  Tuntas: "success",
  Sedang: "warning",
  Recovery: "danger",
};

export const presensiVariant: Record<string, BadgeVariant> = {
  Hadir: "success",
  Izin: "warning",
  Sakit: "danger",
};

export const roleVariant: Record<Role, BadgeVariant> = {
  Admin: "gold",
  Ustadz: "success",
  Ustadzah: "info",
  Kepsek: "purple",
};

export function initialsOf(name: string): string {
  const clean = name.replace(/^Ust(zh)?\.\s*/i, "");
  return clean
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}
