export interface SantriHalqahSource {
  halqah?: string | null;
  classPesantren?: string | null;
  className?: string | null;
}

/**
 * Resolve effective halqah name across standalone Tahfidz (`halqah`)
 * and HRIS-synced (`class_pesantren`, `class_name`) columns.
 */
export function resolveSantriHalqah(s: SantriHalqahSource): string {
  const candidates = [s.halqah, s.classPesantren, s.className];
  for (const candidate of candidates) {
    const trimmed = typeof candidate === "string" ? candidate.trim() : "";
    if (trimmed && trimmed !== "-") {
      return trimmed;
    }
  }
  return "";
}

/**
 * Normalize a halqah string for case-insensitive comparison.
 */
export function normalizeHalqahKey(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Case-insensitive trimmed comparison between two halqah labels.
 */
export function matchesHalqah(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ka = normalizeHalqahKey(a);
  const kb = normalizeHalqahKey(b);
  return ka.length > 0 && kb.length > 0 && ka === kb;
}

/**
 * Check whether a santri record is active across HRIS/Tahfidz variants.
 */
export function isSantriAktif(status: string | boolean | null | undefined): boolean {
  if (typeof status === "boolean") return status;
  const norm = String(status ?? "").trim().toUpperCase();
  return norm === "AKTIF" || norm === "ACTIVE" || norm === "1" || norm === "TRUE";
}

/**
 * Normalize gender representation from HRIS ('L'/'P') or Tahfidz ('Laki-laki'/'Perempuan').
 */
export function normalizeGender(gender: string | null | undefined): "Laki-laki" | "Perempuan" {
  const g = String(gender ?? "").trim().toLowerCase();
  if (g === "p" || g === "perempuan" || g === "f" || g === "female" || g === "akhwat") {
    return "Perempuan";
  }
  return "Laki-laki";
}

/**
 * Fallback numeric tingkatan when HRIS students.tingkatan is null.
 */
export function normalizeTingkatan(tingkatan: number | string | null | undefined): number {
  const parsed = typeof tingkatan === "number" ? tingkatan : Number(tingkatan);
  if (Number.isFinite(parsed) && parsed >= 1) {
    return Math.trunc(parsed);
  }
  return 1;
}

/**
 * Compute target juz string from tingkatan (1..6 -> Juz 30..25).
 */
export function computeTargetJuz(tingkatan: number | string | null | undefined): string {
  const t = normalizeTingkatan(tingkatan);
  return `Juz ${Math.max(25, 31 - t)}`;
}

/**
 * Normalize statusCapaian label casing/whitespace.
 */
export function normalizeStatusCapaian(
  status: string | null | undefined,
): "Tuntas" | "Sedang" | "Recovery" {
  const norm = String(status ?? "").trim().toLowerCase();
  if (norm === "tuntas" || norm === "tuntas target") return "Tuntas";
  if (norm === "recovery") return "Recovery";
  return "Sedang";
}

/**
 * Normalize Tasmi predikat casing/whitespace.
 */
export function normalizePredikat(
  predikat: string | null | undefined,
): "Mumtaz" | "Jayyid Jiddan" | "Jayyid" | "Rasib" {
  const norm = String(predikat ?? "").trim().toLowerCase();
  if (norm === "mumtaz") return "Mumtaz";
  if (norm === "jayyid jiddan") return "Jayyid Jiddan";
  if (norm === "jayyid") return "Jayyid";
  return "Rasib";
}

/**
 * Check whether Tasmikelulusan flag represents passing.
 */
export function isTasmiLulus(value: boolean | number | string | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const norm = String(value ?? "").trim().toLowerCase();
  return norm === "1" || norm === "true" || norm === "lulus";
}

/**
 * Current unix epoch timestamp in seconds (matches HRIS integer created_at).
 */
export function unixNowSec(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Parse mixed created_at values (unix seconds, unix ms, ISO string, or 'YYYY-MM-DD HH:MM:SS' WIB).
 */
export function toEpochMs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const n = Number(trimmed);
      return Number.isFinite(n) ? (n < 1e12 ? n * 1000 : n) : 0;
    }
    const isoLike = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    const parsed = Date.parse(isoLike.endsWith("Z") || isoLike.includes("+") ? isoLike : `${isoLike}+07:00`);
    if (Number.isFinite(parsed)) return parsed;
    const fallback = Date.parse(trimmed);
    return Number.isFinite(fallback) ? fallback : 0;
  }
  return 0;
}

/**
 * Compare two records with `(tanggal, createdAt, id)` descending chronologically.
 */
export function compareDateThenCreatedDesc(
  a: { tanggal?: string | null; createdAt?: unknown; id?: string | null },
  b: { tanggal?: string | null; createdAt?: unknown; id?: string | null },
): number {
  const dateA = a.tanggal ?? "";
  const dateB = b.tanggal ?? "";
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  const msA = toEpochMs(a.createdAt);
  const msB = toEpochMs(b.createdAt);
  if (msA !== msB) return msB - msA;
  return String(b.id ?? "").localeCompare(String(a.id ?? ""));
}

const NOTES_SEPARATOR = " — ";
const CATATAN_PREFIX = "Catatan: ";

/**
 * Encode `penyebab` (kendala) and `catatan` into single `tahfidz_evaluations.notes` column
 * while keeping text human-readable for HRIS.
 */
export function formatEvaluasiNotes(
  penyebab?: string | null,
  catatan?: string | null,
): string | null {
  const p = penyebab?.trim() || "";
  const c = catatan?.trim() || "";
  if (p && c) return `${p}${NOTES_SEPARATOR}${c}`;
  if (p) return p;
  if (c) return `${CATATAN_PREFIX}${c}`;
  return null;
}

/**
 * Decode `tahfidz_evaluations.notes` back into `{ penyebab, catatan }`.
 */
export function parseEvaluasiNotes(
  notes: string | null | undefined,
  statusCapaian?: string | null,
): { penyebab: string | null; catatan: string | null } {
  const raw = notes?.trim() || "";
  if (!raw) return { penyebab: null, catatan: null };

  const sepIdx = raw.indexOf(NOTES_SEPARATOR);
  if (sepIdx !== -1) {
    const p = raw.slice(0, sepIdx).trim() || null;
    const c = raw.slice(sepIdx + NOTES_SEPARATOR.length).trim() || null;
    return { penyebab: p, catatan: c };
  }

  if (raw.startsWith(CATATAN_PREFIX)) {
    return {
      penyebab: null,
      catatan: raw.slice(CATATAN_PREFIX.length).trim() || null,
    };
  }

  const status = normalizeStatusCapaian(statusCapaian);
  if (status === "Tuntas") {
    return { penyebab: null, catatan: raw };
  }
  return { penyebab: raw, catatan: null };
}

