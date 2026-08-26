import { Router } from "express";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  absensiUstadz,
  dataSantri,
  masterSantri,
  users,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { getSettings } from "../lib/settings";
import { wibDaysAgo, wibParts } from "../lib/wib";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, (req, res) => {
  const user = req.user!;
  const scopedHalqah =
    user.role === "Ustadz" || user.role === "Ustadzah" ? user.halqah : null;
  const settings = getSettings();
  const today = wibParts().date;

  const santriRows = db
    .select()
    .from(masterSantri)
    .where(
      scopedHalqah
        ? and(eq(masterSantri.statusAktif, true), eq(masterSantri.halqah, scopedHalqah))
        : eq(masterSantri.statusAktif, true)
    )
    .orderBy(asc(masterSantri.halqah))
    .all();

  const evaluasiRows = db
    .select()
    .from(dataSantri)
    .orderBy(desc(dataSantri.tanggal), desc(dataSantri.id))
    .all();

  const latestBySantri = new Map<number, typeof evaluasiRows[number]>();
  for (const row of evaluasiRows) {
    if (!latestBySantri.has(row.santriId)) latestBySantri.set(row.santriId, row);
  }

  let tuntas = 0;
  let sedang = 0;
  let recovery = 0;
  const perluPerhatian: Array<{
    nis: string;
    nama: string;
    halqah: string;
    tingkat: number;
    status: string;
    kendala: string;
    target: string;
  }> = [];

  for (const santri of santriRows) {
    const latest = latestBySantri.get(santri.id);
    const status = latest?.statusCapaian;
    if (status === "Tuntas") tuntas += 1;
    else if (status === "Sedang") sedang += 1;
    else if (status === "Recovery") recovery += 1;

    if (status === "Recovery" || status === "Sedang") {
      perluPerhatian.push({
        nis: santri.nis,
        nama: santri.nama,
        halqah: santri.halqah,
        tingkat: santri.tingkatan,
        status,
        kendala: latest?.penyebab ?? "-",
        target: latest?.targetJuz ?? `Juz ${Math.max(25, 31 - santri.tingkatan)}`,
      });
    }
  }

  const absensiToday = db
    .select()
    .from(absensiUstadz)
    .where(eq(absensiUstadz.tanggal, today))
    .orderBy(desc(absensiUstadz.id))
    .all();

  const hadirUsernames = new Set(
    absensiToday.filter((row) => row.status === "Hadir").map((row) => row.username)
  );
  const subuhHadir = absensiToday.filter(
    (row) => row.sesi === "Subuh" && row.status === "Hadir"
  ).length;
  const maghribHadir = absensiToday.filter(
    (row) => row.sesi === "Maghrib" && row.status === "Hadir"
  ).length;

  const ustadzAktif = db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.status, "Aktif"), inArray(users.role, ["Ustadz", "Ustadzah"])))
    .all();

  const since = wibDaysAgo(7);
  const recentEvaluasi = evaluasiRows.filter((row) => row.tanggal >= since);
  const halqahAgg = new Map<string, { tuntas: number; total: number }>();
  for (const row of recentEvaluasi) {
    if (scopedHalqah && row.halqah !== scopedHalqah) continue;
    const agg = halqahAgg.get(row.halqah) ?? { tuntas: 0, total: 0 };
    agg.total += 1;
    if (row.statusCapaian === "Tuntas") agg.tuntas += 1;
    halqahAgg.set(row.halqah, agg);
  }
  const capaianHalqah = [...halqahAgg.entries()]
    .map(([name, agg]) => ({
      name,
      value: agg.total ? Math.round((agg.tuntas / agg.total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const distribusiMap = new Map<string, number>();
  for (const santri of santriRows) {
    distribusiMap.set(santri.halqah, (distribusiMap.get(santri.halqah) ?? 0) + 1);
  }
  const totalSantri = santriRows.length || 1;
  const distribusiHalqah = [...distribusiMap.entries()]
    .map(([name, total]) => ({
      name,
      total,
      percent: Math.round((total / totalSantri) * 100),
    }))
    .sort((a, b) => b.total - a.total);

  res.json({
    stats: {
      totalSantri: santriRows.length,
      tuntas,
      sedang,
      recovery,
      presensiHadir: hadirUsernames.size,
      presensiTotal: ustadzAktif.length,
      presensiSubuh: subuhHadir,
      presensiMaghrib: maghribHadir,
    },
    capaianHalqah,
    distribusiHalqah,
    santriPerluPerhatian: perluPerhatian.slice(0, 5),
    presensiTerbaru: absensiToday.slice(0, 5).map((row) => ({
      tanggal: row.tanggal,
      jam: row.jam,
      nama: row.nama,
      halqah: row.halqah ?? "-",
      sesi: row.sesi,
      status: row.status,
      jarak: row.jarakMeter != null ? `${row.jarakMeter} m` : "—",
    })),
    sesi: {
      subuh: {
        mulai: settings.presensi_subuh_mulai,
        selesai: settings.presensi_subuh_selesai,
        hadir: subuhHadir,
      },
      maghrib: {
        mulai: settings.presensi_maghrib_mulai,
        selesai: settings.presensi_maghrib_selesai,
        hadir: maghribHadir,
      },
    },
  });
});
