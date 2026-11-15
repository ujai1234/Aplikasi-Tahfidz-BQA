// @ts-nocheck
import { Router } from "express";
import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  absensiUstadz,
  dataSantri,
  dataTasmi,
  masterSantri,
  users,
} from "../db/schema";
import {
  compareDateThenCreatedDesc,
  computeTargetJuz,
  isSantriAktif,
  isTasmiLulus,
  matchesHalqah,
  normalizeHalqahKey,
  normalizePredikat,
  normalizeStatusCapaian,
  normalizeTingkatan,
  parseEvaluasiNotes,
  resolveSantriHalqah,
} from "../lib/santri-utils";
import { requireAuth, scopeHalqah } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { getSettings, resolvePresensiSession } from "../lib/settings";
import { wibParts } from "../lib/wib";

export const dashboardRouter = Router();

  const dashboardQuerySchema = z.object({
    mode: z.enum(["all", "today", "date", "month", "year"]).optional(),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional(),
    bulan: z.coerce.number().int().min(1).max(12).optional(),
    tahun: z.coerce.number().int().min(2020).max(2040).optional(),
    halqah: z.string().optional(),
  });

  const NAMA_BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  function formatTanggalIndo(dateStr: string): string {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    } catch {
      return dateStr;
    }
  }

  function toLookupKey(val: unknown): string {
    return String(val ?? "").trim().toLowerCase();
  }

  dashboardRouter.get("/", requireAuth, validateQuery(dashboardQuerySchema), (req, res) => {
    const query = (res.locals.query || req.query) as z.infer<typeof dashboardQuerySchema>;
    const user = req.user!;
    const userHalqah = scopeHalqah(user);
    const requestedHalqah = query.halqah && query.halqah !== "Semua Halqah" ? query.halqah : null;
    const scopedHalqah = userHalqah ?? requestedHalqah;

    const settings = getSettings();
    const now = wibParts();
    const today = now.date;
    const [currentYearStr, currentMonthStr] = today.split("-");
    const currentYearNum = Number(currentYearStr);
    const currentMonthNum = Number(currentMonthStr);

    // Determine effective filter mode
    let mode: "all" | "today" | "date" | "month" | "year" = query.mode ?? "all";
    if (!query.mode) {
      if (query.tanggal) mode = "date";
      else if (query.bulan && query.tahun) mode = "month";
      else if (query.tahun) mode = "year";
    }

    let filterLabel = "Semua Waktu (Akumulasi Seluruh Data)";
    let targetDate: string | null = null;
    let targetMonth: number | null = null;
    let targetYear: number | null = null;
    let monthPrefix: string | null = null;
    let yearPrefix: string | null = null;

    if (mode === "today") {
      targetDate = today;
      filterLabel = `Hari Ini (${formatTanggalIndo(today)})`;
    } else if (mode === "date") {
      targetDate = query.tanggal ?? today;
      filterLabel = formatTanggalIndo(targetDate);
    } else if (mode === "month") {
      targetMonth = query.bulan ? Number(query.bulan) : currentMonthNum;
      targetYear = query.tahun ? Number(query.tahun) : currentYearNum;
      monthPrefix = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
      filterLabel = `${NAMA_BULAN[targetMonth - 1]} ${targetYear}`;
    } else if (mode === "year") {
      targetYear = query.tahun ? Number(query.tahun) : currentYearNum;
      yearPrefix = `${targetYear}-`;
      filterLabel = `Tahun ${targetYear}`;
    }

    const allMasterSantri = db
      .select()
      .from(masterSantri)
      .orderBy(asc(masterSantri.nama))
      .all()
      .map((s) => ({
        ...s,
        resolvedHalqah: resolveSantriHalqah(s),
        resolvedTingkatan: normalizeTingkatan(s.tingkatan),
        aktif: isSantriAktif(s.statusAktif),
      }));

    // Build dual-index lookup map (by id and nis)
    const allSantriMap = new Map<string, (typeof allMasterSantri)[number]>();
    for (const s of allMasterSantri) {
      if (s.id != null) allSantriMap.set(toLookupKey(s.id), s);
      if (s.nis != null) allSantriMap.set(toLookupKey(s.nis), s);
    }

    const santriRows = allMasterSantri
      .filter((s) => {
        if (!s.aktif) return false;
        if (scopedHalqah && !matchesHalqah(s.resolvedHalqah, scopedHalqah)) return false;
        return true;
      })
      .sort((a, b) => a.resolvedHalqah.localeCompare(b.resolvedHalqah) || a.nama.localeCompare(b.nama));

    const santriMap = new Map<string, (typeof santriRows)[number]>();
    for (const s of santriRows) {
      if (s.id != null) santriMap.set(toLookupKey(s.id), s);
      if (s.nis != null) santriMap.set(toLookupKey(s.nis), s);
    }

    const allEvaluasiRows = db
      .select()
      .from(dataSantri)
      .all()
      .sort(compareDateThenCreatedDesc);

    // Filter evaluations based on active period
    const dateFilteredEvaluasi = allEvaluasiRows.filter((row) => {
      if (mode === "today" || mode === "date") {
        return row.tanggal === targetDate;
      }
      if (mode === "month") {
        return monthPrefix ? row.tanggal.startsWith(monthPrefix) : true;
      }
      if (mode === "year") {
        return yearPrefix ? row.tanggal.startsWith(yearPrefix) : true;
      }
      return true; // mode === "all"
    });

    const scopedEvaluasiRows = scopedHalqah
    ? dateFilteredEvaluasi.filter((row) => {
          const s = allSantriMap.get(toLookupKey(row.santriId));
          return s ? matchesHalqah(s.resolvedHalqah, scopedHalqah) : false;
        })
    : dateFilteredEvaluasi;

    const latestBySantri = new Map<string, (typeof allEvaluasiRows)[number]>();
    for (const row of scopedEvaluasiRows) {
      const rowKey = toLookupKey(row.santriId);
      if (!latestBySantri.has(rowKey)) latestBySantri.set(rowKey, row);
      const s = allSantriMap.get(rowKey);
      if (s) {
        const sIdKey = toLookupKey(s.id);
        const sNisKey = toLookupKey(s.nis);
        if (!latestBySantri.has(sIdKey)) latestBySantri.set(sIdKey, row);
        if (!latestBySantri.has(sNisKey)) latestBySantri.set(sNisKey, row);
      }
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
      const sIdKey = toLookupKey(santri.id);
      const sNisKey = toLookupKey(santri.nis);
      const latest = latestBySantri.get(sIdKey) || latestBySantri.get(sNisKey);
      if (!latest) continue;
      const status = normalizeStatusCapaian(latest.statusCapaian);
      if (status === "Tuntas") tuntas += 1;
      else if (status === "Sedang") sedang += 1;
      else if (status === "Recovery") recovery += 1;

      if (status === "Recovery" || status === "Sedang") {
        const parsed = parseEvaluasiNotes(latest.penyebab, status);
        perluPerhatian.push({
          nis: santri.nis,
          nama: santri.nama,
          halqah: santri.resolvedHalqah || "-",
          tingkat: santri.resolvedTingkatan,
          status,
          kendala: parsed.penyebab ?? "-",
          target: computeTargetJuz(santri.resolvedTingkatan),
          catatan: parsed.catatan ?? "-",
        });
      }
    }

    // Tasmi calculation
    const allTasmiRows = db
      .select()
      .from(dataTasmi)
      .all()
      .sort(compareDateThenCreatedDesc);

    const dateFilteredTasmi = allTasmiRows.filter((t) => {
      if (mode === "today" || mode === "date") {
        return t.tanggal === targetDate;
      }
      if (mode === "month") {
        return monthPrefix ? t.tanggal.startsWith(monthPrefix) : true;
      }
      if (mode === "year") {
        return yearPrefix ? t.tanggal.startsWith(yearPrefix) : true;
      }
      return true; // mode === "all"
    });

    const filteredTasmi = scopedHalqah
    ? dateFilteredTasmi.filter((t) => {
          const s = allSantriMap.get(toLookupKey(t.santriId));
          return s ? matchesHalqah(s.resolvedHalqah, scopedHalqah) : false;
        })
    : dateFilteredTasmi;

    const latestTasmiBySantri = new Map<string, (typeof allTasmiRows)[number]>();
    for (const t of filteredTasmi) {
      const tKey = toLookupKey(t.santriId);
      const s = allSantriMap.get(tKey);
      if (!s || !santriMap.has(toLookupKey(s.id))) continue;

      if (!latestTasmiBySantri.has(tKey)) latestTasmiBySantri.set(tKey, t);
      const sIdKey = toLookupKey(s.id);
      const sNisKey = toLookupKey(s.nis);
      if (!latestTasmiBySantri.has(sIdKey)) latestTasmiBySantri.set(sIdKey, t);
      if (!latestTasmiBySantri.has(sNisKey)) latestTasmiBySantri.set(sNisKey, t);
    }

    let tasmiLulus = 0;
    let mumtazCount = 0;
    let jayyidJiddanCount = 0;
    let jayyidCount = 0;
    let rasibCount = 0;

      for (const santri of santriRows) {
        const sIdKey = toLookupKey(santri.id);
        const sNisKey = toLookupKey(santri.nis);
        const t = latestTasmiBySantri.get(sIdKey) || latestTasmiBySantri.get(sNisKey);
        if (!t) continue;

        if (isTasmiLulus(t.statusKelulusan)) tasmiLulus += 1;

        const predikat = normalizePredikat(t.predikat);
        if (predikat === "Mumtaz") mumtazCount += 1;
        else if (predikat === "Jayyid Jiddan") jayyidJiddanCount += 1;
        else if (predikat === "Jayyid") jayyidCount += 1;
        else if (predikat === "Rasib") rasibCount += 1;
      }

      const testedCount = mumtazCount + jayyidJiddanCount + jayyidCount + rasibCount;
      const belumUjianCount = Math.max(0, santriRows.length - testedCount);
      const persenLulusTasmi = testedCount > 0 ? Math.round((tasmiLulus / testedCount) * 100) : 0;

      const rekapPredikat = [
        { name: "Mumtaz", count: mumtazCount },
        { name: "Jayyid Jiddan", count: jayyidJiddanCount },
        { name: "Jayyid", count: jayyidCount },
        { name: "Rasib", count: rasibCount },
        { name: "Belum Ujian", count: belumUjianCount },
      ];

      const totalEvaluasiSantri = tuntas + sedang + recovery;
      const totalSantriCount = santriRows.length || 1;
      const persentaseCapaian = [
        {
          name: "Tuntas Target",
          count: tuntas,
          percent: Math.round((tuntas / (mode === "all" ? totalSantriCount : Math.max(1, totalEvaluasiSantri))) * 100),
          color: "#10b981",
        },
        {
          name: "Sedang Process",
          count: sedang,
          percent: Math.round((sedang / (mode === "all" ? totalSantriCount : Math.max(1, totalEvaluasiSantri))) * 100),
          color: "#f59e0b",
        },
        {
          name: "Recovery",
          count: recovery,
          percent: Math.round((recovery / (mode === "all" ? totalSantriCount : Math.max(1, totalEvaluasiSantri))) * 100),
          color: "#ef4444",
        },
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

      // Attendance for the date (if in date mode, show that date; otherwise show today)
      const attendanceDate = targetDate ?? today;
      const absensiTodayAll = db
        .select()
        .from(absensiUstadz)
        .where(eq(absensiUstadz.tanggal, attendanceDate))
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

      // Monthly attendance recap calculation based on filter or current month
      const activeYear = targetYear ?? currentYearNum;
      const activeMonth = targetMonth ?? currentMonthNum;
      const monthStart = `${activeYear}-${String(activeMonth).padStart(2, "0")}-01`;
      const nextMonthStart =
      activeMonth === 12
        ? `${activeYear + 1}-01-01`
        : `${activeYear}-${String(activeMonth + 1).padStart(2, "0")}-01`;
      const bulanIniLabel = `${NAMA_BULAN[activeMonth - 1]} ${activeYear}`;

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
        lokasiValidasi: row.lokasiValidasi != null ? Boolean(row.lokasiValidasi) : null,
        isAdminOverride: Boolean(row.isAdminOverride),
        keterangan: row.keterangan ?? null,
      });

      const halqahBuckets = new Map<
        string,
        {
          name: string;
          totalSantri: number;
          tuntas: number;
          sedang: number;
          recovery: number;
        }
      >();

      const ensureBucket = (rawHalqah: string) => {
        const cleanName = rawHalqah.trim();
        if (!cleanName || cleanName === "-") return null;
        const key = normalizeHalqahKey(cleanName);
        let bucket = halqahBuckets.get(key);
        if (!bucket) {
          bucket = {
            name: cleanName,
            totalSantri: 0,
            tuntas: 0,
            sedang: 0,
            recovery: 0,
          };
          halqahBuckets.set(key, bucket);
        }
        return bucket;
      };

      for (const santri of santriRows) {
        const bucket = ensureBucket(santri.resolvedHalqah);
        if (!bucket) continue;
        bucket.totalSantri += 1;

        const sId = toLookupKey(santri.id);
        const sNis = toLookupKey(santri.nis);
        const latest = latestBySantri.get(sId) || latestBySantri.get(sNis);
        if (!latest) continue;
        const status = normalizeStatusCapaian(latest.statusCapaian);
        if (status === "Tuntas") bucket.tuntas += 1;
        else if (status === "Sedang") bucket.sedang += 1;
        else if (status === "Recovery") bucket.recovery += 1;
      }

      const capaianHalqah = [...halqahBuckets.values()]
        .map((b) => {
          const totalEvaluasi = b.tuntas + b.sedang + b.recovery;
          return {
            name: b.name,
            value: totalEvaluasi > 0 ? Math.round((b.tuntas / totalEvaluasi) * 100) : 0,
            tuntas: b.tuntas,
            sedang: b.sedang,
            recovery: b.recovery,
            totalEvaluasi,
            totalSantri: b.totalSantri,
          };
        })
        .sort((a, b) => b.totalEvaluasi - a.totalEvaluasi || b.value - a.value || a.name.localeCompare(b.name));

      const totalSantriForDist = santriRows.length || 1;
      const distribusiHalqah = [...halqahBuckets.values()]
        .map((b) => ({
          name: b.name,
          total: b.totalSantri,
          percent: Math.round((b.totalSantri / totalSantriForDist) * 100),
        }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

      const evaluasiTerbaru = scopedEvaluasiRows.slice(0, 20).map((row) => {
        const santri = allSantriMap.get(toLookupKey(row.santriId));
        const statusCapaian = normalizeStatusCapaian(row.statusCapaian);
        const parsed = parseEvaluasiNotes(row.penyebab, statusCapaian);
        return {
          id: row.id,
          tanggal: row.tanggal,
          sesi: row.sesi,
          santriId: row.santriId,
          namaSantri: santri?.nama ?? "-",
          halqah: (santri?.resolvedHalqah || "").trim() || "-",
          tingkatan: santri?.resolvedTingkatan ?? 1,
          statusCapaian,
          penyebab: parsed.penyebab,
          catatan: parsed.catatan,
          createdBy: row.createdBy,
        };
      });

      const tasmiTerbaru = filteredTasmi.slice(0, 20).map((row) => {
        const santri = allSantriMap.get(toLookupKey(row.santriId));
        return {
          id: row.id,
          tanggal: row.tanggal,
          santriId: row.santriId,
          namaSantri: santri?.nama ?? "-",
          halqah: (santri?.resolvedHalqah || "").trim() || "-",
          tingkatan: santri?.resolvedTingkatan ?? 1,
          jenisTasmi: row.jenisTasmi,
          nilai: row.nilai,
          predikat: normalizePredikat(row.predikat),
          statusKelulusan: isTasmiLulus(row.statusKelulusan) ? "Lulus" : "Tidak Lulus",
          penguji: row.penguji,
        };
      });

      const ustadzForSummary = isSupervisor
        ? ustadzAktif
        : ustadzAktif.filter((u) => u.username === user.username);

      const rekapUstadz = ustadzForSummary.map((u) => {
        const uHalqah = resolveSantriHalqah({ halqah: u.halqah }) || "-";
        const uNameLower = u.nama.trim().toLowerCase();
        const mySantri = santriRows.filter((s) => matchesHalqah(s.resolvedHalqah, uHalqah));

        let uTuntas = 0;
        let uPerhatian = 0;
        for (const s of mySantri) {
          const sId = toLookupKey(s.id);
          const sNis = toLookupKey(s.nis);
          const latest = latestBySantri.get(sId) || latestBySantri.get(sNis);
          if (!latest) continue;
          const st = normalizeStatusCapaian(latest.statusCapaian);
          if (st === "Tuntas") uTuntas += 1;
          else uPerhatian += 1;
        }

        const myEval = scopedEvaluasiRows.filter((row) => {
          const s = allSantriMap.get(toLookupKey(row.santriId));
          return (
            (s && matchesHalqah(s.resolvedHalqah, uHalqah)) ||
            (row.createdBy ?? "").trim().toLowerCase() === uNameLower
          );
        });

        const myTasmi = filteredTasmi.filter((row) => {
          const s = allSantriMap.get(toLookupKey(row.santriId));
          return (
            (s && matchesHalqah(s.resolvedHalqah, uHalqah)) ||
            (row.penguji ?? "").trim().toLowerCase() === uNameLower
          );
        });

        let terakhirInput: string | null = null;
        for (const r of myEval) {
          if (!terakhirInput || r.tanggal > terakhirInput) terakhirInput = r.tanggal;
        }
        for (const r of myTasmi) {
          if (!terakhirInput || r.tanggal > terakhirInput) terakhirInput = r.tanggal;
        }

        return {
          username: u.username,
          nama: u.nama,
          halqah: uHalqah,
          totalSantri: mySantri.length,
          evaluasiCount: myEval.length,
          tuntasCount: uTuntas,
          perluPerhatianCount: uPerhatian,
          tasmiCount: myTasmi.length,
          presensiBulanIni: rekapMap.get(u.username)?.totalHadir ?? 0,
          terakhirInput,
        };
      });

      res.json({
        filterInfo: {
          mode,
          tanggal: targetDate,
          bulan: targetMonth,
          tahun: targetYear,
          halqah: scopedHalqah ?? null,
          label: filterLabel,
          totalEvaluasiPeriode: scopedEvaluasiRows.length,
          totalTasmiPeriode: filteredTasmi.length,
        },
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
        santriPerluPerhatian: perluPerhatian.slice(0, 20),
        evaluasiTerbaru,
        tasmiTerbaru,
        rekapUstadz,
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
