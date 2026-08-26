import { db, sqlite } from "./index";
import {
  absensiUstadz,
  dataSantri,
  dataTasmi,
  masterSantri,
  settings,
  users,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { SETTING_DEFAULTS } from "../lib/settings";
import { hitungPredikat } from "../lib/tasmi";
import { wibDaysAgo, wibNow, wibParts } from "../lib/wib";

const force = process.argv.includes("--force");
const existing = db.select({ id: users.id }).from(users).all().length;

if (existing > 0 && !force) {
  console.log("Database sudah berisi data. Gunakan --force untuk seed ulang:");
  console.log("  npm run db:seed -- --force");
  process.exit(0);
}

if (force) {
  sqlite.exec(`
    DELETE FROM audit_logs;
    DELETE FROM data_santri;
    DELETE FROM data_tasmi;
    DELETE FROM absensi_ustadz;
    DELETE FROM master_santri;
    DELETE FROM users;
    DELETE FROM settings;
  `);
}

const now = wibParts();
const nowIso = now.timestamp;

console.log("Menyematkan pengaturan sistem…");
for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
  db.insert(settings)
    .values({ key, value, updatedAt: nowIso })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

console.log("Menyematkan users…");
const userRows = db
  .insert(users)
  .values([
    {
      username: "ahmad.fauzi",
      passwordHash: hashPassword("admin123"),
      nama: "Ahmad Fauzi, S.Pd.",
      role: "Admin",
      halqah: null,
      email: "admin@bqa.sch.id",
      lembaga: "Yayasan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "kepsek",
      passwordHash: hashPassword("kepsek123"),
      nama: "KH. Abdullah Syafiq",
      role: "Kepsek",
      halqah: null,
      email: "kepsek@bqa.sch.id",
      lembaga: null,
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "hasan.basri",
      passwordHash: hashPassword("ustadz123"),
      nama: "Ust. Hasan Basri",
      role: "Ustadz",
      halqah: "Al-Fatih",
      email: "hasan.basri@bqa.sch.id",
      lembaga: "Tahfidz",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "maryam.s",
      passwordHash: hashPassword("ustadz123"),
      nama: "Ustzh. Maryam Shaleha",
      role: "Ustadzah",
      halqah: "An-Nahl",
      email: "maryam.s@bqa.sch.id",
      lembaga: "Tahfidz",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "ali.ridho",
      passwordHash: hashPassword("ustadz123"),
      nama: "Ust. Ali Ridho",
      role: "Ustadz",
      halqah: "Yasin",
      email: "ali.ridho@bqa.sch.id",
      lembaga: "Tahfidz",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "syafiq.i",
      passwordHash: hashPassword("ustadz123"),
      nama: "Ust. Syafiq",
      role: "Ustadz",
      halqah: "Al-Baqarah",
      email: "syafiq.i@bqa.sch.id",
      lembaga: "Tahfidz",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "khadijah.a",
      passwordHash: hashPassword("ustadz123"),
      nama: "Ustzh. Khadijah",
      role: "Ustadzah",
      halqah: "Thaha",
      email: "khadijah.a@bqa.sch.id",
      lembaga: "Tahfidz",
      status: "Nonaktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ])
  .returning()
  .all();

const byUsername = new Map(userRows.map((u) => [u.username, u]));

console.log("Menyematkan master santri…");
const santriRows = db
  .insert(masterSantri)
  .values([
    { nis: "2401", nama: "Abdurrahman Hakim", halqah: "Al-Fatih", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2402", nama: "Aisyah Rahmadani", halqah: "Al-Fatih", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2407", nama: "Zaid Abdullah", halqah: "An-Nahl", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2318", nama: "Fatih Al-Ghifari", halqah: "Yasin", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2412", nama: "Ibrahim Musa", halqah: "Al-Baqarah", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2305", nama: "Umar Sayyid", halqah: "Maryam", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2311", nama: "Khadijah Az-Zahra", halqah: "Thaha", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: false, createdAt: nowIso, updatedAt: nowIso },
    { nis: "2419", nama: "Yusuf Al-Qardhawi", halqah: "Thaha", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
  ])
  .returning()
  .all();

const byNis = new Map(santriRows.map((s) => [s.nis, s]));

console.log("Menyematkan evaluasi harian…");
type EvaluasiSeed = {
  nis: string;
  sesi: "Subuh" | "Maghrib";
  tanggal: string;
  status: "Tuntas" | "Sedang" | "Recovery";
  penyebab: string | null;
  oleh: string;
};
const evaluasiSeeds: EvaluasiSeed[] = [
  { nis: "2401", sesi: "Maghrib", tanggal: wibDaysAgo(0), status: "Recovery", penyebab: "Hafalan terbata-bata", oleh: "Ust. Hasan Basri" },
  { nis: "2402", sesi: "Subuh", tanggal: wibDaysAgo(0), status: "Tuntas", penyebab: null, oleh: "Ust. Hasan Basri" },
  { nis: "2407", sesi: "Maghrib", tanggal: wibDaysAgo(1), status: "Sedang", penyebab: "Kurang fokus saat setoran", oleh: "Ustzh. Maryam Shaleha" },
  { nis: "2305", sesi: "Subuh", tanggal: wibDaysAgo(1), status: "Tuntas", penyebab: null, oleh: "Ust. Ali Ridho" },
  { nis: "2412", sesi: "Subuh", tanggal: wibDaysAgo(1), status: "Sedang", penyebab: "Target pekanan tertunda", oleh: "Ust. Syafiq" },
  { nis: "2318", sesi: "Maghrib", tanggal: wibDaysAgo(2), status: "Recovery", penyebab: "Sering izin tidak masuk", oleh: "Ust. Ali Ridho" },
  { nis: "2419", sesi: "Maghrib", tanggal: wibDaysAgo(2), status: "Tuntas", penyebab: null, oleh: "Ust. Syafiq" },
  { nis: "2401", sesi: "Subuh", tanggal: wibDaysAgo(3), status: "Sedang", penyebab: "Muroja'ah tertunda", oleh: "Ust. Hasan Basri" },
];

for (const seed of evaluasiSeeds) {
  const santri = byNis.get(seed.nis);
  const ustadz = [...byUsername.values()].find((u) => u.nama === seed.oleh);
  if (!santri) continue;
  db.insert(dataSantri)
    .values({
      tanggal: seed.tanggal,
      sesi: seed.sesi,
      santriId: santri.id,
      namaSantri: santri.nama,
      tingkatan: santri.tingkatan,
      halqah: santri.halqah,
      jalur: santri.jalur,
      statusCapaian: seed.status,
      penyebab: seed.penyebab,
      targetJuz: `Juz ${Math.max(25, 31 - santri.tingkatan)}`,
      catatan: null,
      createdBy: seed.oleh,
      createdAt: nowIso,
    })
    .run();
  void ustadz;
}

console.log("Menyematkan presensi ustadz…");
type AbsensiSeed = {
  username: string;
  sesi: "Subuh" | "Maghrib";
  tanggal: string;
  jam: string;
  status: "Hadir" | "Izin" | "Sakit";
  jarak: number | null;
  override?: boolean;
  keterangan?: string | null;
};
const absensiSeeds: AbsensiSeed[] = [
  { username: "ali.ridho", sesi: "Maghrib", tanggal: now.date, jam: "18:12", status: "Hadir", jarak: 310 },
  { username: "syafiq.i", sesi: "Maghrib", tanggal: now.date, jam: "18:31", status: "Hadir", jarak: 480 },
  { username: "hasan.basri", sesi: "Subuh", tanggal: now.date, jam: "04:52", status: "Hadir", jarak: 120 },
  { username: "maryam.s", sesi: "Subuh", tanggal: now.date, jam: "04:47", status: "Hadir", jarak: 85 },
  { username: "khadijah.a", sesi: "Subuh", tanggal: now.date, jam: "05:10", status: "Izin", jarak: null, keterangan: "Acara keluarga" },
  { username: "hasan.basri", sesi: "Maghrib", tanggal: wibDaysAgo(1), jam: "18:20", status: "Hadir", jarak: 96, override: true },
  { username: "maryam.s", sesi: "Maghrib", tanggal: wibDaysAgo(1), jam: "18:25", status: "Hadir", jarak: 110 },
];

for (const seed of absensiSeeds) {
  const ustadz = byUsername.get(seed.username);
  if (!ustadz) continue;
  db.insert(absensiUstadz)
    .values({
      tanggal: seed.tanggal,
      jam: seed.jam,
      username: ustadz.username,
      nama: ustadz.nama,
      sesi: seed.sesi,
      halqah: ustadz.halqah,
      status: seed.status,
      jarakMeter: seed.jarak,
      lokasiValidasi: seed.jarak != null,
      keterangan: seed.keterangan ?? null,
      isAdminOverride: seed.override ?? false,
      createdBy: seed.override ? "ahmad.fauzi" : ustadz.username,
      createdAt: nowIso,
    })
    .run();
}

console.log("Menyematkan ujian tasmi'…");
type TasmiSeed = {
  nis: string;
  tanggal: string;
  jenis: "Pekanan" | "Per 3 Bulan" | "Per 6 Bulan";
  nilai: number;
  penguji: string;
};
const tasmiSeeds: TasmiSeed[] = [
  { nis: "2402", tanggal: wibDaysAgo(4), jenis: "Pekanan", nilai: 92, penguji: "Ust. Hasan Basri" },
  { nis: "2407", tanggal: wibDaysAgo(4), jenis: "Pekanan", nilai: 84, penguji: "Ustzh. Maryam Shaleha" },
  { nis: "2305", tanggal: wibDaysAgo(4), jenis: "Pekanan", nilai: 76, penguji: "Ust. Ali Ridho" },
  { nis: "2401", tanggal: wibDaysAgo(11), jenis: "Pekanan", nilai: 65, penguji: "Ust. Hasan Basri" },
  { nis: "2318", tanggal: wibDaysAgo(56), jenis: "Per 3 Bulan", nilai: 88, penguji: "Ust. Ali Ridho" },
  { nis: "2311", tanggal: wibDaysAgo(56), jenis: "Per 6 Bulan", nilai: 95, penguji: "Ust. Syafiq" },
  { nis: "2412", tanggal: wibDaysAgo(11), jenis: "Pekanan", nilai: 58, penguji: "Ust. Syafiq" },
];

for (const seed of tasmiSeeds) {
  const santri = byNis.get(seed.nis);
  if (!santri) continue;
  const { predikat, lulus } = hitungPredikat(seed.nilai);
  db.insert(dataTasmi)
    .values({
      tanggal: seed.tanggal,
      santriId: santri.id,
      namaSantri: santri.nama,
      halqah: santri.halqah,
      tingkatan: santri.tingkatan,
      jenisTasmi: seed.jenis,
      nilai: seed.nilai,
      predikat,
      statusKelulusan: lulus ? "Lulus" : "Tidak Lulus",
      catatan: null,
      penguji: seed.penguji,
      createdBy: seed.penguji,
      createdAt: nowIso,
    })
    .run();
}

console.log("==============================================");
console.log("Seed selesai!");
console.log("Akun demo:");
console.log("  Admin    : ahmad.fauzi / admin123");
console.log("  Kepsek   : kepsek / kepsek123");
console.log("  Ustadz   : hasan.basri / ustadz123 (Al-Fatih)");
console.log("  Ustadzah : maryam.s / ustadz123 (An-Nahl)");
console.log(`WIB server: ${wibNow().toISOString()} (local)`);
console.log("==============================================");
