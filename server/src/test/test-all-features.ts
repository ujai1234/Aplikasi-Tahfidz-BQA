import { createApp } from "../app";
import { db } from "../db";
import { users, masterSantri, dataSantri, absensiUstadz, dataTasmi, settings, auditLogs } from "../db/schema";
import http from "http";

let server: http.Server;
let baseUrl: string;

async function request(path: string, options: RequestInit = {}): Promise<{ status: number; data: any; headers: Headers }> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);
  return { status: res.status, data, headers: res.headers };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function runAllTests() {
  console.log("==========================================================");
  console.log("🚀 STARTING E2E INTEGRATION TEST SUITE — BQA TAHFIDZ API");
  console.log("==========================================================");

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (typeof addr === "object" && addr !== null) {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });

  try {
    // -----------------------------------------------------------------
    // 1. HEALTH CHECK
    // -----------------------------------------------------------------
    console.log("\n[1] TEST HEALTH CHECK");
    const health = await request("/api/health");
    assert(health.status === 200 && health.data?.status === "ok", "Server Health Check Endpoint");

    // -----------------------------------------------------------------
    // 2. AUTHENTICATION & LOGIN
    // -----------------------------------------------------------------
    console.log("\n[2] TEST AUTHENTICATION");

    // Admin Login
    const adminLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: "zeikun98@gmail.com", password: "123456" }),
    });
    assert(adminLogin.status === 200 && !!adminLogin.data.token, "Admin login berhasil dengan JWT token");
    const adminToken = adminLogin.data.token;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // Ustadz 1 Login
    const ustadzLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: "hudzaifahnasrullah98@gmail.com", password: "123456" }),
    });
    assert(ustadzLogin.status === 200 && ustadzLogin.data.user.role === "Ustadz", "Ustadz login berhasil & role terverifikasi");
    const ustadzToken = ustadzLogin.data.token;
    const ustadzAuthHeader = { Authorization: `Bearer ${ustadzToken}` };

    // Invalid Password Rejection
    const invalidLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: "zeikun98@gmail.com", password: "wrongpassword" }),
    });
    assert(invalidLogin.status === 401, "Password salah ditolak dengan HTTP 401");

    // /api/auth/me Endpoint
    const meRes = await request("/api/auth/me", { headers: adminAuthHeader });
    assert(meRes.status === 200 && meRes.data.user.username === "zeikun98@gmail.com", "Endpoint /api/auth/me mengembalikan data profil pengguna");

    // Unauthenticated rejection
    const unauthRes = await request("/api/auth/me");
    assert(unauthRes.status === 401, "Request tanpa token ditolak dengan HTTP 401");

    // -----------------------------------------------------------------
    // 3. RBAC & HALQAH SCOPING
    // -----------------------------------------------------------------
    console.log("\n[3] TEST RBAC & HALQAH SCOPING");
    
    // Ustadz 1 (Halqah 1) fetching santri -> scoped
    const ustadzSantri = await request("/api/santri", { headers: ustadzAuthHeader });
    const allHalqah1 = ustadzSantri.data.data.every((s: any) => s.halqah === "Halqah 1 (Ikhwan)");
    assert(ustadzSantri.status === 200 && allHalqah1, "Ustadz hanya dapat melihat santri di halqahnya");

    // Admin fetching santri -> sees all
    const adminSantri = await request("/api/santri", { headers: adminAuthHeader });
    assert(adminSantri.status === 200 && adminSantri.data.total >= 60, "Admin dapat melihat seluruh santri lintas halqah");

    // -----------------------------------------------------------------
    // 4. MASTER SANTRI CRUD
    // -----------------------------------------------------------------
    console.log("\n[4] TEST MASTER SANTRI CRUD");

    const testNIS = `TEST-${Date.now().toString().slice(-4)}`;
    const createSantri = await request("/api/santri", {
      method: "POST",
      headers: adminAuthHeader,
      body: JSON.stringify({
        nis: testNIS,
        nama: "Santri Uji Coba",
        halqah: "Halqah 1 (Ikhwan)",
        tingkatan: 1,
        jalur: "Reguler",
        jenisKelamin: "Laki-laki",
      }),
    });
    assert(createSantri.status === 201 && createSantri.data.santri.nis === testNIS, "Admin berhasil menambahkan santri baru");
    const newSantriId = createSantri.data.santri.id;

    // Duplicate NIS rejection
    const dupNIS = await request("/api/santri", {
      method: "POST",
      headers: adminAuthHeader,
      body: JSON.stringify({
        nis: testNIS,
        nama: "Santri Duplikat",
        halqah: "Halqah 1 (Ikhwan)",
        tingkatan: 1,
      }),
    });
    assert(dupNIS.status === 409, "Duplikasi NIS ditolak dengan HTTP 409");

    // Mutasi Santri
    const mutasiRes = await request(`/api/santri/${newSantriId}/mutasi`, {
      method: "PATCH",
      headers: adminAuthHeader,
      body: JSON.stringify({ halqah: "Halqah 2 (Ikhwan)", tingkatan: 2 }),
    });
    assert(mutasiRes.status === 200 && mutasiRes.data.santri.halqah === "Halqah 2 (Ikhwan)", "Mutasi halqah santri berhasil");

    // -----------------------------------------------------------------
    // 5. EVALUASI HARIAN
    // -----------------------------------------------------------------
    console.log("\n[5] TEST EVALUASI HARIAN");

    const evaluasiTarget = await request("/api/evaluasi/target?tingkatan=3", { headers: adminAuthHeader });
    assert(evaluasiTarget.status === 200 && !!evaluasiTarget.data.targetJuz, "Target kurikulum per tingkatan berhasil diperoleh");

    const addEvaluasi = await request("/api/evaluasi", {
      method: "POST",
      headers: adminAuthHeader,
      body: JSON.stringify({
        santriId: newSantriId,
        sesi: "Subuh",
        statusCapaian: "Tuntas",
        penyebab: null,
        catatan: "Setoran lancar",
      }),
    });
    assert(addEvaluasi.status === 201 && addEvaluasi.data.evaluasi.statusCapaian === "Tuntas", "Input evaluasi harian berhasil");

    // -----------------------------------------------------------------
    // 6. ABSENSI USTADZ & GPS
    // -----------------------------------------------------------------
    console.log("\n[6] TEST ABSENSI USTADZ");

    const absensiStatus = await request("/api/absensi/status", { headers: ustadzAuthHeader });
    assert(absensiStatus.status === 200 && "sesiBerjalan" in absensiStatus.data, "Status sesi presensi & jadwal berhasil didapatkan");

    // Admin Manual Override
    const overrideRes = await request("/api/absensi/override", {
      method: "POST",
      headers: adminAuthHeader,
      body: JSON.stringify({
        username: "ahadiat@gmail.com",
        sesi: "Subuh",
        status: "Hadir",
        keterangan: "Presensi manual Admin override untuk pengujian",
      }),
    });
    assert(
      (overrideRes.status === 201 || overrideRes.status === 200) &&
        overrideRes.data?.absensi?.isAdminOverride === true,
      "Admin manual override presensi berhasil",
      `Status: ${overrideRes.status}, data: ${JSON.stringify(overrideRes.data)}`
    );

    // -----------------------------------------------------------------
    // 7. UJIAN TASMI' & LOCK LOGIC
    // -----------------------------------------------------------------
    console.log("\n[7] TEST UJIAN TASMI' & JUMAT LOCK LOGIC");

    const tasmiStatus = await request("/api/tasmi/status", { headers: ustadzAuthHeader });
    assert(tasmiStatus.status === 200 && "pekanan" in tasmiStatus.data, "Status lock Ujian Tasmi' per jenis ujian berhasil dimuat");

    // Input Tasmi' by Admin (Mumtaz >= 90)
    const tasmiAdmin = await request("/api/tasmi", {
      method: "POST",
      headers: adminAuthHeader,
      body: JSON.stringify({
        santriId: newSantriId,
        jenisTasmi: "Per 3 Bulan",
        nilai: 95,
        catatan: "Mumtaz tanpa cela",
      }),
    });
    assert(
      tasmiAdmin.status === 201 &&
      tasmiAdmin.data.tasmi.predikat === "Mumtaz" &&
      tasmiAdmin.data.tasmi.statusKelulusan === "Lulus",
      "Kalkulasi predikat Mumtaz & status Lulus otomatis tepat"
    );

    // -----------------------------------------------------------------
    // 8. SETTINGS & PENGATURAN
    // -----------------------------------------------------------------
    console.log("\n[8] TEST PENGATURAN SISTEM");

    const getSettingsRes = await request("/api/settings", { headers: adminAuthHeader });
    assert(getSettingsRes.status === 200 && "gps_radius_meter" in getSettingsRes.data.settings, "Daftar konfigurasi sistem berhasil dimuat");

    const updateSettingsRes = await request("/api/settings", {
      method: "PUT",
      headers: adminAuthHeader,
      body: JSON.stringify({
        values: {
          tasmi_unlock_periodic: "1",
          gps_radius_meter: "550",
        },
      }),
    });
    assert(
      updateSettingsRes.status === 200 &&
      updateSettingsRes.data.settings.tasmi_unlock_periodic === "1",
      "Update toggle kunci tasmi' periodic & radius GPS berhasil"
    );

    // -----------------------------------------------------------------
    // 9. DASHBOARD STATS
    // -----------------------------------------------------------------
    console.log("\n[9] TEST DASHBOARD ANALYTICS");

    const dashRes = await request("/api/dashboard", { headers: adminAuthHeader });
    assert(
      dashRes.status === 200 &&
      dashRes.data.stats.totalSantri >= 60 &&
      Array.isArray(dashRes.data.capaianHalqah),
      "Statistik dashboard agregat tuntas/sedang/recovery valid"
    );

    // -----------------------------------------------------------------
    // 10. BACKUP & AUDIT TRAIL
    // -----------------------------------------------------------------
    console.log("\n[10] TEST BACKUP & AUDIT LOGS");

    const auditRes = await request("/api/backup/logs", { headers: adminAuthHeader });
    assert(auditRes.status === 200 && auditRes.data.total > 0, "Audit logs mencatat seluruh aktivitas pengujian");

    const backupDump = await request("/api/backup/backup", { headers: adminAuthHeader });
    assert(backupDump.status === 200 && Array.isArray(backupDump.data.users), "Backup JSON dump seluruh database berhasil");

    // Clean up test santri
    await request(`/api/santri/${newSantriId}`, { method: "DELETE", headers: adminAuthHeader });

  } catch (err) {
    console.error("Critical Test Error:", err);
    failed++;
  } finally {
    server.close();
  }

  console.log("\n==========================================================");
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
