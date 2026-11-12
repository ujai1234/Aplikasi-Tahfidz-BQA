// @ts-nocheck
import { Router } from "express";
import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "../db";
import {
  absensiUstadz,
  dataSantri,
  dataTasmi,
  masterSantri,
  users,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { getSettings, resolvePresensiSession } from "../lib/settings";
import { wibDaysAgo, wibParts } from "../lib/wib";

export const dashboardRouter = Router();
dashboardRouter.get("/", requireAuth, (req, res) => {
  const user = req.user!;
  const scopedHalqah =
    user.role === "Ustadz" || user.role === "Ustadzah" ? user.halqah : null;
  const settings = getSettings();
  const now = wibParts();
  const today = now.date;

  const santriRows = db
    .select()
    .from(masterSantri)
    .where(
      scopedHalqah
        ? and(eq(masterSantri.statusAktif, "AKTIF"), eq(masterSantri.halqah, scopedHalqah))
        : eq(masterSantri.statusAktif, "AKTIF")
    )
    .orderBy(asc(masterSantri.halqah))
    .all();

  const santriMap = new Map(santriRows.map((s) => [s.id, s]));

  const evaluasiRows = db
    .select()
    .from(dataSantri)
    .orderBy(desc(dataSantri.tanggal), desc(dataSantri.id))
    .all();

  const latestBySantri = new Map<string, typeof evaluasiRows[number]>();
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
    catatan: string;
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
        halqah: santri.halqah ?? "-",
        tingkat: santri.tingkatan ?? 1,
        status,
        kendala: latest?.penyebab ?? "-",
        target: `Juz ${Math.max(25, 31 - (santri.tingkatan ?? 1))}`,
        catatan: "-",
      });
    }
  }

  // Tasmi calculation
  const tasmiRows = db
    .select()
    .from(dataTasmi)
    .orderBy(desc(dataTasmi.tanggal), desc(dataTasmi.id))
    .all();

  const filteredTasmi = scopedHalqah
    ? tasmiRows.filter((t) => {
        const santri = santriMap.get(t.santriId);
        return santri && santri.halqah === scopedHalqah;
      })
    : tasmiRows;

  const latestTasmiBySantri = new Map<string, typeof tasmiRows[number]>();
  for (const t of filteredTasmi) {
    if (!latestTasmiBySantri.has(t.santriId)) latestTasmiBySantri.set(t.santriId, t);
  }

  let tasmiLulus = 0;
  let mumtazCount = 0;
  let jayyidJiddanCount = 0;
  let jayyidCount = 0;
  let rasibCount = 0;

  for (const t of latestTasmiBySantri.values()) {
    if (t.statusKelulusan) tasmiLulus += 1;
    
    if (t.predikat === "Mumtaz") mumtazCount += 1;
    else if (t.predikat === "Jayyid Jiddan") jayyidJiddanCount += 1;
    else if (t.predikat === "Jayyid") jayyidCount += 1;
    else if (t.predikat === "Rasib") rasibCount += 1;
  }

  const testedCount = latestTasmiBySantri.size;
  const belumUjianCount = Math.max(0, santriRows.length - testedCount);
  const persenLulusTasmi = testedCount > 0 ? Math.round((tasmiLulus / testedCount) * 100) : 0;

  const rekapPredikat = [
    { name: "Mumtaz", count: mumtazCount },
    { name: "Jayyid Jiddan", count: jayyidJiddanCount },
    { name: "Jayyid", count: jayyidCount },
    { name: "Rasib", count: rasibCount },
    { name: "Belum Ujian", count: belumUjianCount },
  ];

  const totalSantriCount = santriRows.length || 1;
  const persentaseCapaian = [
    { name: "Tuntas Target", count: tuntas, percent: Math.round((tuntas / totalSantriCount) * 100), color: "#10b981" },
    { name: "Sedang Process", count: sedang, percent: Math.round((sedang / totalSantriCount) * 100), color: "#f59e0b" },
    { name: "Recovery", count: recovery, percent: Math.round((recovery / totalSantriCount) * 100), color: "#ef4444" },
  ];

  // Presensi Session Status
  const presensiSession = resolvePresensiSession(now);
  let bannerMessage = "";
  if (presensiSession.open) {
    bannerMessage = `Dibuka: Sesi ${presensiSession.sesi} sedang berlangsung saat ini.`;
  } else {
    if (now.time < settings.presensi_subuh_mulai) {
      bannerMessage = `Ditutup: Sesi terdekat Subuh (${settings.presensi_subuh_mulai} - ${settings.presensi_subuh_selesai} WIB).`;
    } else if (now.time < settings.presensi_maghrib_mulai) {
      bannerMessage = `Ditutup: Sesi terdekat Maghrib (${settings.presensi_maghrib_mulai} - ${settings.presensi_maghrib_selesai} WIB).`;
    } else {
      bannerMessage = `Ditutup: Presensi hari ini telah berakhir.`;
    }
  }

  const isSupervisor = user.role === "Admin" || user.role === "Kepsek";

  const absensiTodayAll = db
    .select()
    .from(absensiUstadz)
    .where(eq(absensiUstadz.tanggal, today))
    .orderBy(desc(absensiUstadz.jam), desc(absensiUstadz.createdAt))
    .all();

  const absensiToday = isSupervisor
    ? absensiTodayAll
    : absensiTodayAll.filter((row) => row.username === user.username);

  const hadirUsernames = new Set(
    absensiTodayAll.filter((row) => row.status === "Hadir").map((row) => row.username)
  );
  const subuhHadir = absensiTodayAll.filter(
    (row) => row.sesi === "Subuh" && row.status === "Hadir"
  ).length;
  const maghribHadir = absensiTodayAll.filter(
    (row) => row.sesi === "Maghrib" && row.status === "Hadir"
  ).length;

  const ustadzAktif = db
    .select({
      id: users.id,
      username: users.username,
      nama: users.nama,
      halqah: users.halqah,
    })
    .from(users)
    .where(and(eq(users.status, "Aktif"), inArray(users.role, ["Ustadz", "Ustadzah"])))
    .orderBy(asc(users.halqah), asc(users.nama))
    .all();

  const absensiRecentRows = db
    .select()
    .from(absensiUstadz)
    .where(isSupervisor ? undefined : eq(absensiUstadz.username, user.username))
    .orderBy(desc(absensiUstadz.tanggal), desc(absensiUstadz.jam), desc(absensiUstadz.createdAt))
    .limit(30)
    .all();

  const [yearStr, monthStr] = today.split("-");
  const currentYear = Number(yearStr);
  const currentMonth = Number(monthStr);
  const monthStart = `${yearStr}-${monthStr}-01`;
  const nextMonthStart =
    currentMonth === 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const bulanIniLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(currentYear, currentMonth - 1, 1)));

  const absensiBulanIni = db
    .select()
    .from(absensiUstadz)
    .where(
      isSupervisor
        ? and(gte(absensiUstadz.tanggal, monthStart), lt(absensiUstadz.tanggal, nextMonthStart))
        : and(
            eq(absensiUstadz.username, user.username),
            gte(absensiUstadz.tanggal, monthStart),
            lt(absensiUstadz.tanggal, nextMonthStart)
          )
    )
    .orderBy(desc(absensiUstadz.tanggal), desc(absensiUstadz.jam), desc(absensiUstadz.createdAt))
    .all();

  const rekapMap = new Map<
    string,
    {
      username: string;
      nama: string;
      halqah: string;
      subuhHadir: number;
      maghribHadir: number;
      izin: number;
      sakit: number;
      totalHadir: number;
      terakhirAbsen: string | null;
      terakhirJam: string | null;
      terakhirSesi: string | null;
      terakhirStatus: string | null;
    }
  >();

  const seedRekapUsers = isSupervisor
    ? ustadzAktif
    : [
        {
          id: user.id,
          username: user.username,
          nama: user.nama,
          halqah: user.halqah ?? null,
        },
      ];

  for (const u of seedRekapUsers) {
    rekapMap.set(u.username, {
      username: u.username,
      nama: u.nama,
      halqah: u.halqah ?? "-",
      subuhHadir: 0,
      maghribHadir: 0,
      izin: 0,
      sakit: 0,
      totalHadir: 0,
      terakhirAbsen: null,
      terakhirJam: null,
      terakhirSesi: null,
      terakhirStatus: null,
    });
  }

  for (const row of absensiBulanIni) {
    let entry = rekapMap.get(row.username);
    if (!entry) {
      entry = {
        username: row.username,
        nama: row.nama,
        halqah: row.halqah ?? "-",
        subuhHadir: 0,
        maghribHadir: 0,
        izin: 0,
        sakit: 0,
        totalHadir: 0,
        terakhirAbsen: null,
        terakhirJam: null,
        terakhirSesi: null,
        terakhirStatus: null,
      };
      rekapMap.set(row.username, entry);
    }

    if (row.status === "Hadir") {
      entry.totalHadir += 1;
      if (row.sesi === "Subuh") entry.subuhHadir += 1;
      else if (row.sesi === "Maghrib") entry.maghribHadir += 1;
    } else if (row.status === "Izin") {
      entry.izin += 1;
    } else if (row.status === "Sakit") {
      entry.sakit += 1;
    }

    if (!entry.terakhirAbsen) {
      entry.terakhirAbsen = row.tanggal;
      entry.terakhirJam = row.jam;
      entry.terakhirSesi = row.sesi;
      entry.terakhirStatus = row.status;
    }
  }

  const rekapPresensiBulanIni = [...rekapMap.values()].sort(
    (a, b) =>
      b.totalHadir - a.totalHadir ||
      b.izin + b.sakit - (a.izin + a.sakit) ||
      a.halqah.localeCompare(b.halqah) ||
      a.nama.localeCompare(b.nama)
  );

  const mapPresensiItem = (row: typeof absensiUstadz.$inferSelect) => ({
    id: row.id,
    tanggal: row.tanggal,
    jam: row.jam,
    username: row.username,
    nama: row.nama,
    halqah: row.halqah ?? "-",
    sesi: row.sesi,
    status: row.status,
    jarak: row.jarakMeter != null ? `${row.jarakMeter} m` : "—",
    lokasiValidasi: row.lokasiValidasi ?? null,
    isAdminOverride: Boolean(row.isAdminOverride),
    keterangan: row.keterangan ?? null,
  });

  const since = wibDaysAgo(7);
  const recentEvaluasi = evaluasiRows.filter((row) => row.tanggal >= since);
  const halqahAgg = new Map<string, { tuntas: number; total: number }>();
  
  for (const row of recentEvaluasi) {
    const santri = santriMap.get(row.santriId);
    if (!santri || !santri.halqah) continue;
    if (scopedHalqah && santri.halqah !== scopedHalqah) continue;
    
    const agg = halqahAgg.get(santri.halqah) ?? { tuntas: 0, total: 0 };
    agg.total += 1;
    if (row.statusCapaian === "Tuntas") agg.tuntas += 1;
    halqahAgg.set(santri.halqah, agg);
  }
  
  const capaianHalqah = [...halqahAgg.entries()]
    .map(([name, agg]) => ({
      name,
      value: agg.total ? Math.round((agg.tuntas / agg.total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const distribusiMap = new Map<string, number>();
  for (const santri of santriRows) {
    if (!santri.halqah) continue;
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
      lulusTasmiPercent: persenLulusTasmi,
      tasmiLulus,
      testedTasmiCount: testedCount,
      presensiHadir: hadirUsernames.size,
      presensiTotal: ustadzAktif.length,
      presensiSubuh: subuhHadir,
      presensiMaghrib: maghribHadir,
    },
    persentaseCapaian,
    rekapPredikat,
    presensiBanner: {
      open: presensiSession.open,
      message: bannerMessage,
      sesi: presensiSession.sesi,
    },
    capaianHalqah,
    distribusiHalqah,
    santriPerluPerhatian: perluPerhatian.slice(0, 10),
    presensiHariIni: absensiToday.map(mapPresensiItem),
    presensiTerbaru: absensiRecentRows.map(mapPresensiItem),
    rekapPresensiBulanIni,
    bulanIniLabel,
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
