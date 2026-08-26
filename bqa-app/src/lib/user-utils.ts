import type { PublicUser } from "@/lib/api";

export function roleVariantLabel(user: PublicUser | null): string {
  if (!user) return "";
  switch (user.role) {
    case "Admin":
      return "Administrator";
    case "Kepsek":
      return "Kepala Pesantren";
    case "Ustadz":
      return `Ustadz${user.halqah ? ` · ${user.halqah}` : ""}`;
    case "Ustadzah":
      return `Ustadzah${user.halqah ? ` · ${user.halqah}` : ""}`;
    default:
      return user.role;
  }
}

export function tanggalIndo(dateStr: string): string {
  try {
    return new Date(`${dateStr.slice(0, 10)}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
