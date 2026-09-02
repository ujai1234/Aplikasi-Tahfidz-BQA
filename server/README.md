# BQA Tahfidz API

REST API **Sistem Tahfidz & Absensi Ustadz** — Pesantren Baitul Qur'an Al-Ikhwan.
Dibangun sesuai PRD: Express + TypeScript, Drizzle ORM + SQLite (better-sqlite3),
JWT (24 jam), bcrypt hashing, validasi Zod, rate limiting, audit trail.

## Menjalankan

```bash
cd server
npm install
cp .env.example .env      # lalu isi JWT_SECRET

npm run db:push           # buat tabel SQLite
npm run db:seed           # isi data demo (tambah --force untuk seed ulang)
npm run dev               # http://localhost:4000/api
```

## Akun Demo (Default Seed)

| Role | Username (Email) | Password | Nama | Halqah |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `zeikun98@gmail.com` | `123456` | Ustadz Hudzaifah | Semua (Full Akses) |
| **Ustadz** | `hudzaifahnasrullah98@gmail.com` | `123456` | Ustadz Ahmad | Halqah 1 (Ikhwan) |
| **Ustadzah** | `itsmeqnby@gmail.com` | `123456` | Ustadzah Indah | Halqah 2 (Akhwat) |
| **Ustadz** | `zahid@gmail.com` | `123456` | Ustadz Zahid | Halqah 3 (Ikhwan) |
| **Ustadzah** | `muminah@gmail.com` | `123456` | Ustadzah Mu'minah | Halqah 3 (Akhwat) |
| **Ustadz** | `saif@gmail.com` | `123456` | Ustadz Saif | Halqah 4 (Ikhwan) |
| **Ustadzah** | `dara@gmail.com` | `123456` | Ustadzah Dara | Halqah 4 (Akhwat) |
| **Ustadz** | `ahadiat@gmail.com` | `123456` | Ustadz Hadi | Halqah 6 (Ikhwan) |
| **Ustadzah** | `khadijah@gmail.com` | `123456` | Ustadzah Khadijah | Halqah 1 (Akhwat) |
| **Ustadz** | `faisal@gmail.com` | `123456` | Ustadz Faisal | Halqah 2 (Ikhwan) |
| **Ustadz** | `salman@gmail.com` | `123456` | Ustadz Salman | Halqah 5 (Ikhwan) |
| **Ustadzah** | `fatimah@gmail.com` | `123456` | Ustadzah Fatimah | Halqah 5 (Akhwat) |
| **Ustadzah** | `aisyah@gmail.com` | `123456` | Ustadzah Aisyah | Halqah 6 (Akhwat) |

## Endpoint

Auth header: `Authorization: Bearer <token>` (kecuali login).

### Auth
| Method | Path | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| POST | `/api/auth/login` | publik (rate limit 10/15m) | `{ usernameOrEmail, password }` → `{ token, user }` |
| GET | `/api/auth/me` | semua | profil + `serverTime` WIB |

### Users (Admin)
| Method | Path | Keterangan |
| ------ | ---- | ---------- |
| GET | `/api/users?role=&halqah=&status=&q=` | daftar + filter |
| POST | `/api/users` | tambah user |
| GET/PUT/DELETE | `/api/users/:id` | detail / ubah (opsi `password`) / hapus |
| PATCH | `/api/users/:id/status` | `{ status: "Aktif"|"Nonaktif" }` |

### Santri
| Method | Path | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| GET | `/api/santri?halqah=&tingkatan=&status=&q=` | semua (ustadz → halqah sendiri) | master santri |
| GET | `/api/santri/:id` | semua | detail + 20 riwayat evaluasi |
| POST | `/api/santri` | admin | tambah (NIS unik) |
| PUT | `/api/santri/:id` | admin | ubah |
| PATCH | `/api/santri/:id/mutasi` | admin | `{ halqah, tingkatan? }` |
| DELETE | `/api/santri/:id` | admin | hapus + riwayat terkait |

### Evaluasi Harian (`data_santri`)
| Method | Path | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| GET | `/api/evaluasi?tanggal=&halqah=&status=&q=&limit=` | semua (scoped) | riwayat |
| POST | `/api/evaluasi` | ustadz/admin | validasi sesi Subuh 05–07 / Maghrib 18.30–20.30, Senin–Kamis (admin bypass) |
| DELETE | `/api/evaluasi/:id` | admin | hapus catatan |
| GET | `/api/evaluasi/target?tingkatan=` | semua | target kurikulum otomatis |

### Absensi Ustadz (`absensi_ustadz`)
| Method | Path | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| GET | `/api/absensi/status` | semua | sesi berjalan + presensi saya hari ini |
| GET | `/api/absensi?tanggal=&sesi=&status=&limit=` | semua (ustadz → miliknya) | riwayat |
| POST | `/api/absensi/presensi` | ustadz/admin | `{ latitude, longitude }` — cek jadwal (Sen–Jum, Jumat khusus), radius ≤ 500 m (haversine), anti-duplikasi 1x/sesi/hari |
| POST | `/api/absensi/izin` | ustadz/admin | `{ status: "Izin"|"Sakit", keterangan }` |
| POST | `/api/absensi/override` | admin | presensi manual `{ username, sesi, status, keterangan? }` tanpa GPS/waktu |

### Tasmi' (`data_tasmi`)
| Method | Path | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| GET | `/api/tasmi?halqah=&jenis=&kelulusan=&q=&limit=` | semua (scoped) | rekap + `lulus`, `persenLulus`, `rataRata` |
| POST | `/api/tasmi` | ustadz/admin | `{ santriId, jenisTasmi, nilai }` → predikat & kelulusan otomatis (KKM 70) |
| DELETE | `/api/tasmi/:id` | admin | hapus |

### Settings (disimpan di DB)
| Method | Path | Akses |
| ------ | ---- | ----- |
| GET | `/api/settings` | semua |
| PUT | `/api/settings` | admin — `{ values: { gps_radius_meter: "500", ... } }` |

Key: `gps_radius_meter`, `gps_latitude`, `gps_longitude`, `presensi_subuh_mulai/selesai`,
`presensi_maghrib_mulai/selesai`, `presensi_jumat_mulai/selesai`,
`evaluasi_subuh_mulai/selesai`, `evaluasi_maghrib_mulai/selesai`.

### Dashboard, Backup & Audit
| Method | Path | Akses | Keterangan |
| ------ | ---- | ----- | ---------- |
| GET | `/api/dashboard` | semua (scoped) | stats, capaianHalqah, distribusiHalqah, santriPerluPerhatian, presensiTerbaru, sesi |
| GET | `/api/backup/backup` | admin | unduh JSON seluruh data |
| POST | `/api/backup/reset` | admin | `{ konfirmasi: "RESET" }` — hapus evaluasi/tasmi/presensi |
| GET | `/api/backup/logs` | admin | 100 audit trail terakhir |

## Integrasi Frontend

Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api` di `bqa-app/.env.local`.
Login di frontend memakai endpoint ini; bila backend mati, frontend otomatis
fallback ke mode demo. Dashboard juga otomatis memakai data API bila tersedia.
