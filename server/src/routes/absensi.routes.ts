import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { absensiUstadz, users } from "../db/schema";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAdmin, requireAuth, requireWrite, scopeHalqah } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  getSettings,
  jarakDariPesantren,
  resolvePresensiSession,
} from "../lib/settings";
import { wibParts } from "../lib/wib";

export const absensiRouter = Router();

const listQuerySchema = z.object({
  tanggal: z.string().optional(),
  sesi: z.enum(["Subuh", "Maghrib"]).optional(),
  status: z.enum(["Hadir", "Izin", "Sakit"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const presensiSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  keterangan: z.string().nullish(),
});

const izinSchema = z.object({
  status: z.enum(["Izin", "Sakit"]),
  keterangan: z.string().min(3, "Keterangan wajib diisi (min. 3 karakter)"),
});

const overrideSchema = z.object({
  username: z.string().min(1, "Username ustadz wajib diisi"),
  sesi: z.enum(["Subuh", "Maghrib"]),
  status: z.enum(["Hadir", "Izin", "Sakit"]),
  keterangan: z.string().nullish(),
});

function cekDuplikasi(tanggal: string, username: string, sesi: string) {
  const existing = db
    .select()
    .from(absensiUstadz)
    .where(
      and(
        eq(absensiUstadz.tanggal, tanggal),
        eq(absensiUstadz.username, username),
        eq(absensiUstadz.sesi, sesi)
      )
    )
    .get();
  if (existing) {
    throw new HttpError(
      409,
      `Duplikasi — Anda sudah presensi sesi ${sesi} hari ini pukul ${existing.jam}`
    );
  }
}

absensiRouter.use(requireAuth);

absensiRouter.get("/status", (req, res) => {
  const now = wibParts();
  const sesi = resolvePresensiSession(now);
  const rows = db
    .select()
    .from(absensiUstadz)
    .where(
      and(eq(absensiUstadz.tanggal, now.date), eq(absensiUstadz.username, req.user!.username))
    )
    .all();

  const settings = getSettings();
  res.json({
    serverDate: now.date,
    serverTime: now.time,
    sesiBerjalan: sesi,
    presensiHariIni: rows.map((row) => ({
      sesi: row.sesi,
      status: row.status,
      jam: row.jam,
      jarakMeter: row.jarakMeter,
    })),
    jadwal: {
      subuh: {
        mulai: settings.presensi_subuh_mulai,
        selesai: settings.presensi_subuh_selesai,
      },
      maghrib: {
        mulai: settings.presensi_maghrib_mulai,
        selesai: settings.presensi_maghrib_selesai,
      },
    },
  });
});

absensiRouter.get("/", validateQuery(listQuerySchema), (req, res) => {
  const { tanggal, sesi, status, limit } = res.locals.query as z.infer<
    typeof listQuerySchema
  >;
  const scopedHalqah = scopeHalqah(req.user!);

  const filters = [];
  if (req.user!.role === "Ustadz" || req.user!.role === "Ustadzah") {
    filters.push(eq(absensiUstadz.username, req.user!.username));
  } else if (scopedHalqah) {
    filters.push(eq(absensiUstadz.halqah, scopedHalqah));
  }
  if (tanggal) filters.push(eq(absensiUstadz.tanggal, tanggal));
  if (sesi) filters.push(eq(absensiUstadz.sesi, sesi));
  if (status) filters.push(eq(absensiUstadz.status, status));

  const rows = db
    .select()
    .from(absensiUstadz)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(absensiUstadz.tanggal), desc(absensiUstadz.id))
    .limit(limit)
    .all();

  res.json({ total: rows.length, data: rows });
});

absensiRouter.post("/presensi", requireWrite, validateBody(presensiSchema), (req, res) => {
  const { latitude, longitude, keterangan } = req.body as z.infer<
    typeof presensiSchema
  >;
  const now = wibParts();

  const sesi = resolvePresensiSession(now);
  if (!sesi.open || !sesi.sesi) {
    throw new HttpError(403, sesi.reason ?? "Sesi presensi sedang ditutup");
  }

  cekDuplikasi(now.date, req.user!.username, sesi.sesi);

  const lokasi = jarakDariPesantren(latitude, longitude);
  if (!lokasi.dalamRadius) {
    throw new HttpError(
      403,
      `Di luar radius pesantren (${lokasi.jarakMeter} m > maks ${lokasi.radiusMeter} m)`
    );
  }

  const inserted = db
    .insert(absensiUstadz)
    .values({
      tanggal: now.date,
      jam: now.time,
      username: req.user!.username,
      nama: req.user!.nama,
      sesi: sesi.sesi,
      halqah: req.user!.halqah,
      status: "Hadir",
      jarakMeter: lokasi.jarakMeter,
      lokasiValidasi: true,
      keterangan: keterangan ?? null,
      isAdminOverride: false,
      createdBy: req.user!.username,
      createdAt: now.timestamp,
    })
    .returning()
    .get();

  writeAudit(
    req.user!,
    "absensi.presensi",
    `Presensi ${sesi.sesi} — ${lokasi.jarakMeter} m dari pesantren`
  );
  res.status(201).json({
    absensi: inserted,
    pesan: `Presensi ${sesi.sesi} berhasil — ${lokasi.jarakMeter} m dari pesantren`,
  });
});

absensiRouter.post("/izin", requireWrite, validateBody(izinSchema), (req, res) => {
  const { status, keterangan } = req.body as z.infer<typeof izinSchema>;
  const now = wibParts();
  const sesi = resolvePresensiSession(now);

  if (!sesi.open || !sesi.sesi) {
    throw new HttpError(403, sesi.reason ?? "Sesi presensi sedang ditutup");
  }
  cekDuplikasi(now.date, req.user!.username, sesi.sesi);

  const inserted = db
    .insert(absensiUstadz)
    .values({
      tanggal: now.date,
      jam: now.time,
      username: req.user!.username,
      nama: req.user!.nama,
      sesi: sesi.sesi,
      halqah: req.user!.halqah,
      status,
      jarakMeter: null,
      lokasiValidasi: false,
      keterangan,
      isAdminOverride: false,
      createdBy: req.user!.username,
      createdAt: now.timestamp,
    })
    .returning()
    .get();

  writeAudit(req.user!, "absensi.izin", `Mengajukan ${status} sesi ${sesi.sesi}`);
  res.status(201).json({ absensi: inserted });
});

absensiRouter.post(
  "/override",
  requireWrite,
  ...requireAdmin,
  validateBody(overrideSchema),
  (req, res) => {
    const { username, sesi, status, keterangan } = req.body as z.infer<
      typeof overrideSchema
    >;
    const now = wibParts();

    const target = db.select().from(users).where(eq(users.username, username)).get();
    if (!target) throw new HttpError(404, `User "${username}" tidak ditemukan`);

    cekDuplikasi(now.date, username, sesi);

    const inserted = db
      .insert(absensiUstadz)
      .values({
        tanggal: now.date,
        jam: now.time,
        username: target.username,
        nama: target.nama,
        sesi,
        halqah: target.halqah,
        status,
        jarakMeter: null,
        lokasiValidasi: false,
        keterangan: keterangan ?? null,
        isAdminOverride: true,
        createdBy: req.user!.username,
        createdAt: now.timestamp,
      })
      .returning()
      .get();

    writeAudit(
      req.user!,
      "absensi.override",
      `Override presensi ${username} (${sesi}/${status})`
    );
    res.status(201).json({ absensi: inserted });
  }
);
