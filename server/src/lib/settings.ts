import { eq } from "drizzle-orm";
import { db } from "../db";
import { settings } from "../db/schema";
import { wibParts, isWithinWindow, haversineMeter } from "./wib";

export const SETTING_DEFAULTS: Record<string, string> = {
  gps_radius_meter: "500",
  gps_latitude: "-6.914720",
  gps_longitude: "107.609850",
  presensi_subuh_mulai: "04:30",
  presensi_subuh_selesai: "06:00",
  presensi_maghrib_mulai: "18:00",
  presensi_maghrib_selesai: "20:00",
  presensi_jumat_mulai: "04:30",
  presensi_jumat_selesai: "21:00",
  evaluasi_subuh_mulai: "05:00",
  evaluasi_subuh_selesai: "07:00",
  evaluasi_maghrib_mulai: "18:30",
  evaluasi_maghrib_selesai: "20:30",
};

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS);

export type AppSettings = Record<string, string>;

export function getSettings(): AppSettings {
  const rows = db.select().from(settings).all();
  const merged: AppSettings = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    merged[row.key] = row.value;
  }
  return merged;
}

export function setSetting(key: string, value: string): void {
  db.insert(settings)
    .values({ key, value, updatedAt: wibParts().timestamp })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: wibParts().timestamp },
    })
    .run();
}

export function resolvePresensiSession(now = wibParts()): {
  open: boolean;
  sesi: "Subuh" | "Maghrib" | null;
  reason: string | null;
} {
  const s = getSettings();

  if (now.day === 0 || now.day === 6) {
    return { open: false, sesi: null, reason: "Sabtu & Minggu libur — presensi tidak dibuka" };
  }

  if (now.day === 5) {
    if (isWithinWindow(now.time, s.presensi_jumat_mulai, s.presensi_jumat_selesai)) {
      return {
        open: true,
        sesi: now.time < "12:00" ? "Subuh" : "Maghrib",
        reason: null,
      };
    }
    return {
      open: false,
      sesi: null,
      reason: `Di luar sesi khusus Jumat (${s.presensi_jumat_mulai}–${s.presensi_jumat_selesai} WIB)`,
    };
  }

  if (isWithinWindow(now.time, s.presensi_subuh_mulai, s.presensi_subuh_selesai)) {
    return { open: true, sesi: "Subuh", reason: null };
  }
  if (isWithinWindow(now.time, s.presensi_maghrib_mulai, s.presensi_maghrib_selesai)) {
    return { open: true, sesi: "Maghrib", reason: null };
  }
  return {
    open: false,
    sesi: null,
    reason: `Di luar jadwal sesi — Subuh ${s.presensi_subuh_mulai}–${s.presensi_subuh_selesai}, Maghrib ${s.presensi_maghrib_mulai}–${s.presensi_maghrib_selesai} WIB`,
  };
}

export function checkEvaluasiWindow(sesi: "Subuh" | "Maghrib", now = wibParts()): {
  open: boolean;
  reason: string | null;
} {
  const s = getSettings();

  if (now.day === 0 || now.day === 5 || now.day === 6) {
    return { open: false, reason: "Evaluasi hanya dapat diinput hari Senin–Kamis" };
  }

  const [mulai, selesai] =
    sesi === "Subuh"
      ? [s.evaluasi_subuh_mulai, s.evaluasi_subuh_selesai]
      : [s.evaluasi_maghrib_mulai, s.evaluasi_maghrib_selesai];

  if (!isWithinWindow(now.time, mulai, selesai)) {
    return { open: false, reason: `Sesi ${sesi} dibuka pukul ${mulai}–${selesai} WIB` };
  }
  return { open: true, reason: null };
}

export function jarakDariPesantren(latitude: number, longitude: number): {
  jarakMeter: number;
  radiusMeter: number;
  dalamRadius: boolean;
} {
  const s = getSettings();
  const radiusMeter = Number(s.gps_radius_meter);
  const jarakMeter = haversineMeter(
    latitude,
    longitude,
    Number(s.gps_latitude),
    Number(s.gps_longitude)
  );
  return { jarakMeter, radiusMeter, dalamRadius: jarakMeter <= radiusMeter };
}
