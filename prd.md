# 📄 PRD — Project Requirements Document

## Sistem Manajemen Pesantren (Tahfidz & Absensi Guru)

**Pesantren Baitul Qur'an Al-Ikhwan**

---

## 1. Overview

Aplikasi ini adalah sistem manajemen terpadu berbasis web untuk pesantren yang menggabungkan **manajemen hafalan (Tahfidz)** dan **absensi guru/ustadz**. Sistem dirancang untuk menggantikan pengelolaan data yang masih berbasis spreadsheet (Google Sheets) dengan aplikasi yang lebih aman, terstruktur, dan mudah digunakan.

**Masalah Utama yang Diselesaikan**

- **Data Santri & Evaluasi** – Data santri, riwayat evaluasi, dan capaian hafalan masih tersebar di Excel, menyulitkan monitoring perkembangan.
- **Absensi Ustadz Manual** – Presensi kehadiran ustadz/ustadzah dicatat secara manual, tanpa validasi lokasi dan waktu, sehingga rawan kecurangan dan sulit dilacak.
- **Ujian Tasmi'** – Pencatatan nilai ujian hafalan (tasmi') belum terintegrasi dengan data santri.
- **Laporan Terpisah** – Laporan kehadiran ustadz, evaluasi santri, dan rekapitulasi tasmi' tidak terintegrasi.
- **Manajemen User** – Belum ada sistem otentikasi dan role-based access yang jelas.

**Tujuan Utama**

- Menyediakan platform tunggal untuk mengelola data santri, absensi ustadz, evaluasi hafalan, dan ujian tasmi'.
- Menerapkan absensi ustadz berbasis **GPS** dan **jadwal waktu** untuk memastikan kehadiran di area pesantren.
- Memudahkan ustadz/ustadzah dalam menginput evaluasi harian dan hasil tasmi'.
- Memberikan dashboard dan laporan real-time untuk admin dan kepala pesantren.
- Mengamankan akses dengan autentikasi berbasis **role** (Admin, Ustadz, Ustadzah, Kepala Pesantren).

---

## 2. Requirements

### Fungsional

#### Manajemen User & Autentikasi

- Sistem menyimpan data user: **username, password (hash), nama, role (Admin, Ustadz, Ustadzah, Kepsek), halqah, email, lembaga, status (Aktif/Nonaktif)**.
- Admin dapat melakukan **CRUD** user, serta mengaktifkan/nonaktifkan akun.
- Login menggunakan username atau email + password.
- Setelah login, sistem menyimpan **sesi JWT** dan role-based access untuk setiap halaman/fungsi.

#### Manajemen Santri

- **Master Santri** – daftar unik santri dengan NIS, nama, halqah, tingkatan, status (Aktif/Tidak Aktif).
- **Data Santri** – riwayat evaluasi harian/periodik: ID, tanggal, nama, tingkatan, halqah, status capaian (Tuntas/Sedang/Recovery), penyebab kendala, target juz, catatan, created by.
- Admin dapat melihat semua santri, ustadz/ustadzah hanya melihat santri di halqah-nya.
- Fitur **pindah halqah** untuk memutasi santri antar kelompok.

#### Evaluasi Harian Santri

- Ustadz/ustadzah dapat menginput evaluasi harian untuk santri di halqah-nya.
- **Validasi waktu** – evaluasi hanya dapat diinput pada sesi Subuh (05:00–07:00) atau Maghrib (18:30–20:30), Senin–Kamis (kecuali admin override).
- Form input: tanggal, nama santri (dropdown + tambah manual), tingkatan, halqah, jalur (Reguler/Akselerasi/Khusus), status capaian, penyebab kendala, catatan.
- Sistem otomatis menampilkan target kurikulum berdasarkan tingkatan.

#### Absensi Ustadz (Kehadiran)

- Ustadz/ustadzah melakukan presensi melalui form yang dilengkapi **GPS** (mengunci lokasi).
- Validasi **radius** – presensi hanya diterima jika jarak dari pesantren ≤ radius yang ditentukan (default 500 m).
- **Jadwal sesi** – presensi dibuka pada sesi Subuh (04:30–06:00) dan Maghrib (18:00–20.00) hari Senin–Jumat (kecuali Sabtu-Minggu libur). Hari Jumat berlaku sesi khusus (04.30–21.00).
- Proteksi **duplikasi** – satu user hanya bisa presensi 1x per sesi per hari.
- **Admin override** – admin dapat melakukan presensi untuk ustadz lain tanpa batasan GPS/waktu.
- Riwayat presensi menampilkan tanggal, jam, nama, sesi, halqah, status (Hadir/Izin/Sakit), jarak GPS, lokasi validasi, keterangan.

#### Ujian Tasmi' (Hafalan)

- Santri dapat mengikuti ujian tasmi' dengan tahapan: **Pekanan (Jumat)**, **Per 3 Bulan**, atau **Per 6 Bulan (Semester)**.
- Input nilai angka (0–100), sistem otomatis menentukan **predikat Arab** (Mumtaz, Jayyid Jiddan, Jayyid, Rasib) dan **status kelulusan** (KKM ≥ 70).
- Catatan penguji dan created by dicatat.
- Rekapitulasi tasmi' dapat difilter per santri/halqah dan dicetak.

#### Dashboard & Laporan

- **Dashboard Admin** – total santri, tuntas/sedang/recovery, rekap presensi ustadz hari ini, grafik persentase capaian, grafik distribusi halqah, daftar santri perlu perhatian.
- **Dashboard Ustadz** – status presensi pribadi (Subuh/Maghrib), statistik santri di halqah-nya.
- **Laporan** – rekap data santri (bisa difilter dan dicetak), rekap tasmi', laporan evaluasi.
- Admin dapat melakukan **backup data** (ke spreadsheet baru) dan **reset data** (hapus semua data santri, tasmi', presensi).

#### Pengaturan Sistem (Admin)

- **GPS** – atur radius presensi, koordinat pesantren.
- **Waktu Presensi** – atur jam mulai dan selesai untuk sesi Subuh & Maghrib.
- **Waktu Evaluasi** – atur jam untuk input evaluasi (Subuh & Maghrib, Senin–Kamis).
- Semua pengaturan disimpan di database (bukan properties).

#### Non-Fungsional

- **Single Tenant** – satu pesantren, multiple user dengan role.
- **Mobile-Friendly** – akses via HP untuk input jurnal dan absensi.
- **Role-Based Access** – Admin (full akses), Ustadz/Ustadzah (akses data halqah sendiri + input), Kepala Pesantren (view semua laporan).
- **Keamanan** – password di-hash, sesi JWT, validasi input ketat, sanitasi output.
- **Audit Trail** – mencatat siapa yang membuat/mengubah data (opsional).
- **Perhitungan Akurat** – tidak ada rounding error pada angka.

---

## 3. Core Features

| Modul                 | Deskripsi                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Dashboard**         | Ringkasan statistik santri, presensi ustadz hari ini, grafik capaian, daftar santri perlu perhatian. |
| **Manajemen User**    | CRUD user, aktif/nonaktifkan, role & halqah assignment.                                              |
| **Data Santri**       | Lihat dan filter data santri (Master & riwayat evaluasi), pindah halqah, edit, hapus.                |
| **Input Evaluasi**    | Form evaluasi harian dengan validasi waktu, dropdown santri, target kurikulum otomatis.              |
| **Absensi Ustadz**    | Presensi dengan GPS, validasi radius & waktu, riwayat, admin override.                               |
| **Ujian Tasmi'**      | Input nilai, predikat otomatis, rekapitulasi, hapus (admin).                                         |
| **Laporan & Cetak**   | Cetak rekap santri, tasmi', dan presensi (PDF/Excel).                                                |
| **Pengaturan Sistem** | Konfigurasi GPS, waktu presensi, waktu evaluasi.                                                     |
| **Backup & Reset**    | Backup seluruh data ke file, reset data (admin only).                                                |

---

## 4. User Flow

### Admin

1. Login → Dashboard.
2. Kelola user (CRUD, aktif/nonaktifkan).
3. Lihat dan kelola data santri (Master, riwayat evaluasi, mutasi halqah).
4. Lakukan presensi manual untuk ustadz (override) jika diperlukan.
5. Pantau jurnal/evaluasi yang diinput ustadz.
6. Lihat rekap tasmi' dan laporan.
7. Atur pengaturan sistem (GPS, waktu).
8. Backup atau reset data.

### Ustadz / Ustadzah

1. Login → Dashboard (terbatas).
2. Lihat statistik santri di halqah-nya.
3. Melakukan presensi kehadiran (dengan GPS) pada sesi yang dibuka.
4. Input evaluasi harian untuk santri di halqah-nya (jika waktu dibuka).
5. Input ujian tasmi' untuk santri di halqah-nya.
6. Lihat riwayat presensi dan rekap pribadi.

### Kepala Pesantren

1. Login → Dashboard (view-only).
2. Lihat ringkasan kehadiran ustadz dan capaian santri.
3. Lihat laporan evaluasi, tasmi', dan presensi semua ustadz.
4. Tidak dapat menginput atau mengubah data.

### Sistem (Otomatis)

- Menghitung status capaian santri berdasarkan evaluasi.
- Menentukan predikat dan kelulusan tasmi' berdasarkan nilai.
- Menyimpan log aktivitas (created by, updated at).
- Mengirim notifikasi jika ada ustadz yang belum input evaluasi (opsional).

---

## 5. Arsitektur Aplikasi

Aplikasi dibangun dengan arsitektur **full-stack web app** dengan pemisahan frontend dan backend.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React + Vite + TypeScript (SPA)                   │   │
│  │  Tailwind CSS + shadcn/ui + Recharts               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS (REST API)
┌─────────────────────────▼───────────────────────────────────┐
│                       Backend (Server)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                           │   │
│  │  - Auth Middleware (JWT)                          │   │
│  │  - Role-based Access Control (RBAC)              │   │
│  │  - Validasi input (Zod)                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Database Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SQLite (better-sqlite3) + Drizzle ORM             │   │
│  │  - Single file, mudah backup                       │   │
│  │  - Type-safe queries                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Komponen Utama**

- **Authentication** – login, JWT, middleware role.
- **User Management** – CRUD user, hashing password.
- **Santri Engine** – manajemen MasterSantri & DataSantri, filter halqah.
- **Absensi Engine** – GPS validation, time validation, duplication check, admin override.
- **Tasmi' Engine** – perhitungan predikat & kelulusan, CRUD.
- **Settings Engine** – penyimpanan konfigurasi GPS & waktu.
- **Report Generator** – export PDF/Excel.
- **Audit Logger** – pencatatan aktivitas (opsional).

---

## 6. Database Schema (Ringkasan)

**Tabel Utama**:

| Tabel            | Deskripsi                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`          | Autentikasi & data user (id, username, password_hash, nama, role, halqah, email, lembaga, status, created_at, updated_at)                         |
| `master_santri`  | Data santri unik (id, nis, nama, halqah, tingkatan, status_aktif, created_at, updated_at)                                                         |
| `data_santri`    | Riwayat evaluasi (id, tanggal, nama_santri, tingkatan, halqah, status_capaian, penyebab, target_juz, catatan, created_by, created_at)             |
| `absensi_ustadz` | Presensi ustadz (id, tanggal, jam, username, nama, sesi, halqah, status, jarak_meter, lokasi_validasi, keterangan, is_admin_override, created_at) |
| `data_tasmi`     | Ujian tasmi' (id, tanggal, nama_santri, halqah, tingkatan, jenis_tasmi, nilai, predikat, status_kelulusan, catatan, created_by, created_at)       |
| `settings`       | Konfigurasi sistem (key, value, updated_at) – untuk GPS, waktu presensi, waktu evaluasi                                                           |
| `audit_logs`     | (Opsional) Log aktivitas user (id, user_id, action, timestamp, details)                                                                           |

**Relasi**:

- `users.halqah` → nama halqah (string, tidak ada foreign key karena halqah dinamis).
- `master_santri.halqah` → referensi ke halqah.
- `data_santri.nama_santri` → referensi ke `master_santri.nama` (bisa pakai NIS untuk lebih akurat).
- `absensi_ustadz.username` → referensi ke `users.username`.
- `data_tasmi.nama_santri` → referensi ke `master_santri.nama`.

**Index**:

- `users.username` (unique)
- `master_santri.nis` (unique)
- `data_santri.tanggal`, `halqah`
- `absensi_ustadz.tanggal`, `username`
- `data_tasmi.tanggal`, `halqah`

---

## 7. Tech Stack (Realisasi)

| Layer                  | Teknologi                    | Keterangan                                 |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| **Frontend Framework** | React + Vite + TypeScript    | SPA cepat, hot reload, type-safe           |
| **Styling**            | Tailwind CSS                 | Utility-first, responsif                   |
| **UI Components**      | shadcn/ui + Lucide Icons     | Komponen aksesibel, kustomizable           |
| **State Management**   | React Context + useReducer   | State global untuk user & notifikasi       |
| **Data Fetching**      | TanStack Query (React Query) | Caching, re-fetch, error handling          |
| **Chart**              | Recharts                     | Visualisasi dashboard                      |
| **Backend API**        | Express.js + TypeScript      | REST API, middleware CORS, JWT             |
| **ORM**                | Drizzle ORM                  | Type-safe SQL, migrasi mudah               |
| **Database**           | SQLite (better-sqlite3)      | File-based, ringan, tanpa service terpisah |
| **Authentication**     | bcrypt + JWT                 | Hash password, token-based session         |
| **Validation**         | Zod                          | Validasi input di server & client          |
| **PDF Generation**     | @react-pdf/renderer          | Slip gaji, laporan PDF                     |
| **Excel Export**       | SheetJS (xlsx)               | Export data ke Excel                       |
| **Logging**            | Winston / Pino               | Log aktivitas server                       |
| **Deployment**         | Docker + Coolify / VPS       | Siap deploy, mudah scaling                 |
| **Version Control**    | Git + GitHub                 | Manajemen kode                             |

---

## 8. Keamanan & Performa

- **Autentikasi** – JWT dengan masa berlaku 24 jam, refresh token opsional.
- **Otorisasi** – Middleware di setiap endpoint memeriksa role pengguna.
- **Validasi Input** – Menggunakan Zod untuk memastikan tipe & format data.
- **Sanitasi Output** – Menghindari XSS dengan escaping otomatis di React.
- **Rate Limiting** – Membatasi request per IP untuk mencegah brute force.
- **Database** – Menggunakan prepared statements (via Drizzle) untuk mencegah SQL injection.
- **Backup** – Admin dapat melakukan backup data ke file SQLite atau JSON.
- **Audit Trail** – Mencatat setiap perubahan data penting (opsional).
- **Performa** – Index di database, caching query dengan React Query, lazy loading halaman.
