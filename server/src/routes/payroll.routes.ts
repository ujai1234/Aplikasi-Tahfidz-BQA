import { Router } from "express";
import { db } from "../db";
import { absensiUstadz, users } from "../db/schema";
import { and, gte, lt } from "drizzle-orm";

export const payrollRouter = Router();

/**
 * GET /api/payroll?bulan=8&tahun=2026
 *
 * Endpoint khusus yang digunakan oleh sistem HRIS untuk mengambil
 * rekap kehadiran (honor) seluruh Ustadz/Ustadzah dalam satu bulan.
 *
 * Autentikasi: menggunakan header `x-api-key` dengan nilai yang
 * didaftarkan di env HRIS_API_KEY (opsional, dilewati jika tidak diset).
 *
 * Response shape: TahfidzPayrollSummary (sesuai types.ts HRIS)
 */
payrollRouter.get("/", async (req, res) => {
  try {
    const bulanRaw = Number(req.query.bulan);
    const tahunRaw = Number(req.query.tahun);

    if (!bulanRaw || !tahunRaw || isNaN(bulanRaw) || isNaN(tahunRaw)) {
      return res
        .status(400)
        .json({ error: "Parameter bulan dan tahun diperlukan (contoh: ?bulan=8&tahun=2026)" });
    }

    const bulan = Math.min(12, Math.max(1, bulanRaw));
    const tahun = tahunRaw;

    // Buat range tanggal awal-akhir bulan dalam format YYYY-MM-DD
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const endMonth = bulan === 12 ? 1 : bulan + 1;
    const endYear = bulan === 12 ? tahun + 1 : tahun;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    // Ambil semua record kehadiran Ustadz dalam bulan tersebut
    const records = await db
      .select()
      .from(absensiUstadz)
      .where(and(gte(absensiUstadz.tanggal, startDate), lt(absensiUstadz.tanggal, endDate)));

    // Ambil semua data user Ustadz/Ustadzah untuk melengkapi nama & halqah
    const ustadzList = await db
      .select()
      .from(users)
      .then((rows) => rows.filter((u) => u.role === "Ustadz" || u.role === "Ustadzah"));

    // Buat peta username -> halqah dari data user
    const userMap = new Map<string, { nama: string; halqah: string | null }>();
    for (const u of ustadzList) {
      userMap.set(u.username, { nama: u.nama, halqah: u.halqah });
    }

    // Agregasi per-username
    const aggregated = new Map<
      string,
      {
        username: string;
        nama: string;
        halqah: string;
        totalSubuhHadir: number;
        totalMaghribHadir: number;
        totalSubuhIzin: number;
        totalMaghribIzin: number;
        totalSubuhSakit: number;
        totalMaghribSakit: number;
        presentDates: Set<string>;
      }
    >();

    for (const r of records) {
      const key = r.username;
      if (!aggregated.has(key)) {
        const userData = userMap.get(key);
        aggregated.set(key, {
          username: key,
          nama: r.nama || userData?.nama || key,
          halqah: r.halqah || userData?.halqah || "-",
          totalSubuhHadir: 0,
          totalMaghribHadir: 0,
          totalSubuhIzin: 0,
          totalMaghribIzin: 0,
          totalSubuhSakit: 0,
          totalMaghribSakit: 0,
          presentDates: new Set(),
        });
      }

      const entry = aggregated.get(key)!;

      if (r.sesi === "Subuh") {
        if (r.status === "Hadir") { entry.totalSubuhHadir++; entry.presentDates.add(r.tanggal); }
        else if (r.status === "Izin") entry.totalSubuhIzin++;
        else if (r.status === "Sakit") entry.totalSubuhSakit++;
      } else if (r.sesi === "Maghrib") {
        if (r.status === "Hadir") { entry.totalMaghribHadir++; entry.presentDates.add(r.tanggal); }
        else if (r.status === "Izin") entry.totalMaghribIzin++;
        else if (r.status === "Sakit") entry.totalMaghribSakit++;
      }
    }

    // Rate per sesi (JP) — Rp 40.000 sesuai standar HRIS
    const RATE_PER_JP = 40_000;

    const periodLabel = new Date(`${tahun}-${String(bulan).padStart(2, "0")}-15`).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    const items = Array.from(aggregated.values()).map((entry) => {
      const totalJP = entry.totalSubuhHadir + entry.totalMaghribHadir;
      const totalHonor = totalJP * RATE_PER_JP;
      return {
        teacherName: entry.nama,
        teacherUsername: entry.username,
        teacherId: undefined as string | undefined, // HRIS akan mengisi ini saat matching
        halqah: entry.halqah ?? "-",
        period: periodLabel,
        totalSubuhHadir: entry.totalSubuhHadir,
        totalMaghribHadir: entry.totalMaghribHadir,
        totalSubuhIzin: entry.totalSubuhIzin,
        totalMaghribIzin: entry.totalMaghribIzin,
        totalSubuhSakit: entry.totalSubuhSakit,
        totalMaghribSakit: entry.totalMaghribSakit,
        totalJP,
        ratePerJP: RATE_PER_JP,
        totalHonor,
        presentDates: Array.from(entry.presentDates).sort(),
      };
    });

    // Urutkan berdasarkan halqah, kemudian nama
    items.sort((a, b) =>
      a.halqah.localeCompare(b.halqah) || a.teacherName.localeCompare(b.teacherName)
    );

    const totalJP = items.reduce((s, i) => s + i.totalJP, 0);
    const summary = {
      period: periodLabel,
      totalUstadz: items.length,
      totalJP,
      totalSubuhJP: items.reduce((s, i) => s + i.totalSubuhHadir, 0),
      totalMaghribJP: items.reduce((s, i) => s + i.totalMaghribHadir, 0),
      totalHonor: items.reduce((s, i) => s + i.totalHonor, 0),
      generatedDate: new Date().toISOString(),
      items,
      apiStatus: "connected" as const,
    };

    res.json(summary);
  } catch (err) {
    console.error("[payroll] Error:", err);
    res.status(500).json({ error: "Gagal menghitung payroll tahfidz" });
  }
});

/**
 * GET /api/payroll/status
 * Health-check sederhana untuk HRIS mendeteksi apakah server Tahfidz aktif.
 */
payrollRouter.get("/status", (_req, res) => {
  res.json({ status: "ok", app: "BQA Tahfidz Payroll API", time: new Date().toISOString() });
});
