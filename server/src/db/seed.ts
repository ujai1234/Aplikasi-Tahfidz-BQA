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
      username: "zeikun98@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Hudzaifah",
      role: "Admin",
      halqah: null,
      email: "zeikun98@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "hudzaifahnasrullah98@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Ahmad",
      role: "Ustadz",
      halqah: "Halqah 1 (Ikhwan)",
      email: "hudzaifahnasrullah98@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "itsmeqnby@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadzah Indah",
      role: "Ustadzah",
      halqah: "Halqah 2 (Akhwat)",
      email: "itsmeqnby@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "zahid@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Zahid",
      role: "Ustadz",
      halqah: "Halqah 3 (Ikhwan)",
      email: "zahid@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "muminah@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadzah Mu'minah",
      role: "Ustadzah",
      halqah: "Halqah 3 (Akhwat)",
      email: "muminah@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "saif@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Saif",
      role: "Ustadz",
      halqah: "Halqah 4 (Ikhwan)",
      email: "saif@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "dara@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadzah Dara",
      role: "Ustadzah",
      halqah: "Halqah 4 (Akhwat)",
      email: "dara@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "ahadiat@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Hadi",
      role: "Ustadz",
      halqah: "Halqah 6 (Ikhwan)",
      email: "ahadiat@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "khadijah@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadzah Khadijah",
      role: "Ustadzah",
      halqah: "Halqah 1 (Akhwat)",
      email: "khadijah@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "faisal@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Faisal",
      role: "Ustadz",
      halqah: "Halqah 2 (Ikhwan)",
      email: "faisal@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "salman@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadz Salman",
      role: "Ustadz",
      halqah: "Halqah 5 (Ikhwan)",
      email: "salman@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "fatimah@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadzah Fatimah",
      role: "Ustadzah",
      halqah: "Halqah 5 (Akhwat)",
      email: "fatimah@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      username: "aisyah@gmail.com",
      passwordHash: hashPassword("123456"),
      nama: "Ustadzah Aisyah",
      role: "Ustadzah",
      halqah: "Halqah 6 (Akhwat)",
      email: "aisyah@gmail.com",
      lembaga: "Baitul Qur'an Al Ikhwan",
      status: "Aktif",
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
    { nis: "STR-001", nama: "Abdullah Faqih", halqah: "Halqah 1 (Ikhwan)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-002", nama: "Muhammad Fatih", halqah: "Halqah 1 (Ikhwan)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-003", nama: "Rayhan Al-Farisi", halqah: "Halqah 1 (Ikhwan)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-004", nama: "Hamzah Asadullah", halqah: "Halqah 1 (Ikhwan)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-005", nama: "Salman Al-Farisi", halqah: "Halqah 1 (Ikhwan)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-006", nama: "Kholilah Zahwa", halqah: "Halqah 1 (Akhwat)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-007", nama: "Fayez Nabila", halqah: "Halqah 1 (Akhwat)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-008", nama: "Zulfa Syahida", halqah: "Halqah 1 (Akhwat)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-009", nama: "Alika Zahra", halqah: "Halqah 1 (Akhwat)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-010", nama: "Aisyah Humaira", halqah: "Halqah 1 (Akhwat)", tingkatan: 1, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-011", nama: "Zaid bin Tsabit", halqah: "Halqah 2 (Ikhwan)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-012", nama: "Bilal bin Rabah", halqah: "Halqah 2 (Ikhwan)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-013", nama: "Mus'ab bin Umair", halqah: "Halqah 2 (Ikhwan)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-014", nama: "Ammar bin Yasir", halqah: "Halqah 2 (Ikhwan)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-015", nama: "Usamah bin Zaid", halqah: "Halqah 2 (Ikhwan)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-016", nama: "Nabila Azzahra", halqah: "Halqah 2 (Akhwat)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-017", nama: "Khadijah Al-Kubro", halqah: "Halqah 2 (Akhwat)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-018", nama: "Fatima Azzahra", halqah: "Halqah 2 (Akhwat)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-019", nama: "Sumayyah binti Khayyat", halqah: "Halqah 2 (Akhwat)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-020", nama: "Asma binti Abu Bakar", halqah: "Halqah 2 (Akhwat)", tingkatan: 2, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-021", nama: "Azmi Syuhada", halqah: "Halqah 3 (Ikhwan)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-022", nama: "Uwais Al-Qarni", halqah: "Halqah 3 (Ikhwan)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-023", nama: "Hasan Al-Banna", halqah: "Halqah 3 (Ikhwan)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-024", nama: "Husain Ali", halqah: "Halqah 3 (Ikhwan)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-025", nama: "Ahmad Zaki", halqah: "Halqah 3 (Ikhwan)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-026", nama: "Sofi Alma", halqah: "Halqah 3 (Akhwat)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-027", nama: "Zulfa Aulia", halqah: "Halqah 3 (Akhwat)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-028", nama: "Hajar An-Nisa", halqah: "Halqah 3 (Akhwat)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-029", nama: "Maryam Al-Adawiyah", halqah: "Halqah 3 (Akhwat)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-030", nama: "Ruqayyah binti Muhammad", halqah: "Halqah 3 (Akhwat)", tingkatan: 3, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-031", nama: "Muadz bin Jabal", halqah: "Halqah 4 (Ikhwan)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-032", nama: "Abdullah bin Umar", halqah: "Halqah 4 (Ikhwan)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-033", nama: "Sa'ad bin Abi Waqqas", halqah: "Halqah 4 (Ikhwan)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-034", nama: "Abu Ubaidah bin Al-Jarrah", halqah: "Halqah 4 (Ikhwan)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-035", nama: "Talhah bin Ubaidillah", halqah: "Halqah 4 (Ikhwan)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-036", nama: "Ummu Sulaim", halqah: "Halqah 4 (Akhwat)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-037", nama: "Safiyyah binti Abdul Muttalib", halqah: "Halqah 4 (Akhwat)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-038", nama: "Juwairiyah binti Al-Harith", halqah: "Halqah 4 (Akhwat)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-039", nama: "Zainab binti Jahsh", halqah: "Halqah 4 (Akhwat)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-040", nama: "Hafsah binti Umar", halqah: "Halqah 4 (Akhwat)", tingkatan: 4, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-041", nama: "Umar Al-Khattab", halqah: "Halqah 5 (Ikhwan)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-042", nama: "Khalid bin Walid", halqah: "Halqah 5 (Ikhwan)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-043", nama: "Zubair bin Al-Awwam", halqah: "Halqah 5 (Ikhwan)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-044", nama: "Abdurrahman bin Auf", halqah: "Halqah 5 (Ikhwan)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-045", nama: "Said bin Zaid", halqah: "Halqah 5 (Ikhwan)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-046", nama: "Ummu Salamah", halqah: "Halqah 5 (Akhwat)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-047", nama: "Maimunah binti Al-Harith", halqah: "Halqah 5 (Akhwat)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-048", nama: "Saudah binti Zam'ah", halqah: "Halqah 5 (Akhwat)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-049", nama: "Ummu Habibah", halqah: "Halqah 5 (Akhwat)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-050", nama: "Atikah binti Zaid", halqah: "Halqah 5 (Akhwat)", tingkatan: 5, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-051", nama: "Muhammad Hudzaifah", halqah: "Halqah 6 (Ikhwan)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-052", nama: "Luqman Al-Hakim", halqah: "Halqah 6 (Ikhwan)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-053", nama: "Yahya Ayyash", halqah: "Halqah 6 (Ikhwan)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-054", nama: "Tariq bin Ziyad", halqah: "Halqah 6 (Ikhwan)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-055", nama: "Salahuddin Al-Ayyubi", halqah: "Halqah 6 (Ikhwan)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Laki-laki", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-056", nama: "Qonita Inda Robbi", halqah: "Halqah 6 (Akhwat)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-057", nama: "Khansa binti Amr", halqah: "Halqah 6 (Akhwat)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-058", nama: "Nusaybah binti Ka'ab", halqah: "Halqah 6 (Akhwat)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-059", nama: "Asma binti Umais", halqah: "Halqah 6 (Akhwat)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
    { nis: "STR-060", nama: "Shifa binti Abdullah", halqah: "Halqah 6 (Akhwat)", tingkatan: 6, jalur: "Reguler", jenisKelamin: "Perempuan", statusAktif: true, createdAt: nowIso, updatedAt: nowIso },
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
  { nis: "STR-001", sesi: "Maghrib", tanggal: wibDaysAgo(0), status: "Recovery", penyebab: "Hafalan terbata-bata", oleh: "Ustadz Ahmad" },
  { nis: "STR-006", sesi: "Subuh", tanggal: wibDaysAgo(0), status: "Tuntas", penyebab: null, oleh: "Ustadzah Khadijah" },
  { nis: "STR-016", sesi: "Maghrib", tanggal: wibDaysAgo(1), status: "Sedang", penyebab: "Kurang fokus saat setoran", oleh: "Ustadzah Indah" },
  { nis: "STR-021", sesi: "Subuh", tanggal: wibDaysAgo(1), status: "Tuntas", penyebab: null, oleh: "Ustadz Zahid" },
  { nis: "STR-011", sesi: "Subuh", tanggal: wibDaysAgo(1), status: "Sedang", penyebab: "Target pekanan tertunda", oleh: "Ustadz Faisal" },
  { nis: "STR-031", sesi: "Maghrib", tanggal: wibDaysAgo(2), status: "Recovery", penyebab: "Sering izin tidak masuk", oleh: "Ustadz Saif" },
  { nis: "STR-051", sesi: "Maghrib", tanggal: wibDaysAgo(2), status: "Tuntas", penyebab: null, oleh: "Ustadz Hadi" },
  { nis: "STR-002", sesi: "Subuh", tanggal: wibDaysAgo(3), status: "Sedang", penyebab: "Muroja'ah tertunda", oleh: "Ustadz Ahmad" },
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
  { username: "zahid@gmail.com", sesi: "Maghrib", tanggal: now.date, jam: "18:12", status: "Hadir", jarak: 310 },
  { username: "faisal@gmail.com", sesi: "Maghrib", tanggal: now.date, jam: "18:31", status: "Hadir", jarak: 480 },
  { username: "hudzaifahnasrullah98@gmail.com", sesi: "Subuh", tanggal: now.date, jam: "04:52", status: "Hadir", jarak: 120 },
  { username: "itsmeqnby@gmail.com", sesi: "Subuh", tanggal: now.date, jam: "04:47", status: "Hadir", jarak: 85 },
  { username: "khadijah@gmail.com", sesi: "Subuh", tanggal: now.date, jam: "05:10", status: "Izin", jarak: null, keterangan: "Acara keluarga" },
  { username: "hudzaifahnasrullah98@gmail.com", sesi: "Maghrib", tanggal: wibDaysAgo(1), jam: "18:20", status: "Hadir", jarak: 96, override: true },
  { username: "itsmeqnby@gmail.com", sesi: "Maghrib", tanggal: wibDaysAgo(1), jam: "18:25", status: "Hadir", jarak: 110 },
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
      createdBy: seed.override ? "zeikun98@gmail.com" : ustadz.username,
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
  { nis: "2402", tanggal: wibDaysAgo(4), jenis: "Pekanan", nilai: 92, penguji: "Ustadz Ahmad" },
  { nis: "2407", tanggal: wibDaysAgo(4), jenis: "Pekanan", nilai: 84, penguji: "Ustadzah Indah" },
  { nis: "2305", tanggal: wibDaysAgo(4), jenis: "Pekanan", nilai: 76, penguji: "Ustadz Zahid" },
  { nis: "2401", tanggal: wibDaysAgo(11), jenis: "Pekanan", nilai: 65, penguji: "Ustadz Ahmad" },
  { nis: "2318", tanggal: wibDaysAgo(56), jenis: "Per 3 Bulan", nilai: 88, penguji: "Ustadz Zahid" },
  { nis: "2311", tanggal: wibDaysAgo(56), jenis: "Per 6 Bulan", nilai: 95, penguji: "Ustadz Saif" },
  { nis: "2412", tanggal: wibDaysAgo(11), jenis: "Pekanan", nilai: 58, penguji: "Ustadz Faisal" },
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
console.log("Akun demo utama:");
console.log("  Admin    : zeikun98@gmail.com / 123456");
console.log("  Ustadz 1 : hudzaifahnasrullah98@gmail.com / 123456");
console.log("  Ustadzah : itsmeqnby@gmail.com / 123456");
console.log(`WIB server: ${wibNow().toISOString()} (local)`);
console.log("==============================================");
