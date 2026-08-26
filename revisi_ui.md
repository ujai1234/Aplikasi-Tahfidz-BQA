## PROMPT REVISI UI/UX – TAHFIDZ APP (BAITUL QUR'AN AL-IKHWAN)

### KONTEKS

Aplikasi manajemen pesantren untuk mengelola data santri, evaluasi hafalan, absensi ustadz, ujian tasmi', dan laporan. Target pengguna: Admin, Ustadz/Ustadzah, Kepala Pesantren. Aplikasi harus memiliki tampilan yang **elegan, Islami, modern, minimalis, dan tidak terlihat seperti template generik**.

###  DESIGN SYSTEM

#### Warna (Palette)

- **Primary:** `#065f46` (dark emerald)
- **Primary Light:** `#047857` (emerald)
- **Accent:** `#d97706` (gold/emas)
- **Accent Light:** `#fbbf24` (gold muda)
- **Background:** `#faf9f6` (cream soft)
- **Surface:** `#ffffff` (putih)
- **Text:** `#1e293b` (slate-800)
- **Text Muted:** `#64748b` (slate-500)
- **Border:** `#e2e8f0` (slate-200)
- **Success:** `#059669`
- **Warning:** `#d97706`
- **Danger:** `#dc2626`

#### Tipografi

- **Latin:** `'Plus Jakarta Sans', system-ui, sans-serif`
- **Arabic (heading/Islamic elements):** `'Amiri', 'Noto Naskh Arabic', serif`
- **Skala:**  
  - Heading: `text-3xl` / `text-2xl` / `text-xl`  
  - Subheading: `text-sm font-semibold uppercase tracking-wider`  
  - Body: `text-sm` / `text-xs`  
  - Statistik angka: `text-3xl font-extrabold`

#### Shadow &amp; Border

- **Card:** `shadow-xl` dengan `border-l-4 border-[#d97706]` (garis emas di kiri)  
- **Hover:** `translate-y-[-4px]` + shadow `2xl`  
- **Transisi:** `transition-all duration-200 ease-out`

#### Spacing

- **Card padding:** `p-6` atau `p-8`  
- **Grid gap:** `gap-6`  
- **Section margin:** `mb-8`

---

### KOMPONEN GLOBAL YANG HARUS DIBUAT

1. **IslamicCard** – card dengan border emas kiri, background putih, shadow dalam, rounded-2xl
2. **StatusBadge** – untuk status (Tuntas, Sedang, Recovery, Hadir, Izin, Sakit, Lulus, Belum Lulus)
  - Warna: hijau (Tuntas/Lulus/Hadir), kuning (Sedang/Izin), merah (Recovery/Sakit/Belum Lulus)  
  - Icon kecil di samping teks
3. **IslamicDivider** – garis tipis emas dengan motif geometris (atau teks bismillah)
4. **SalamGreeting** – menampilkan "Assalamu'alaikum, [Nama User]" + waktu (pagi/siang/sore) + role badge
5. **ActionButton** – tombol dengan icon + teks, warna emas untuk primary, emerald untuk success, slate untuk secondary
6. **SidebarItem** – menu dengan icon + teks, active state berwarna emas dengan background transparan

---

### 📄 HALAMAN YANG HARUS DIREVISI

#### 1. Login Page

- **Background:** gradient dari emerald-900 ke navy-900 dengan **pattern geometris Islami** (opacity 10%)  
- **Card:** glassmorphism (backdrop blur), border emas di atas, shadow-2xl  
- **Logo:** icon Al-Qur'an atau masjid dengan warna emas  
- **Field:** username/email + password, dengan icon di kiri  
- **Tombol:** "Masuk" berwarna emas dengan hover lebih gelap  
- **Footer:** teks "Baitul Qur'an Al-Ikhwan" dengan font arabic dan tahun

#### 2. Dashboard (Admin)

- **Header:** SalamGreeting + tanggal + role badge (Admin)  
- **4 Stat Cards:** Total Santri, Tuntas, Sedang, Recovery – masing-masing dengan icon tematik dan border emas  
- **Row 2:**  
  - Kiri: Donut Chart (persentase capaian) dengan legend di bawah  
  - Kanan: Bar Chart (distribusi santri per halqah)
- **Row 3:** Tabel "Santri Perlu Perhatian" dengan kolom: Nama, Halqah, Status, Penyebab, Catatan – menggunakan StatusBadge  
- **Banner Presensi:** di atas dashboard (untuk ustadz) atau di bawah stat cards (untuk admin) dengan status waktu (buka/tutup) dan tombol aksi

#### 3. Data Santri

- **Filter bar:** search (nama santri) + dropdown Halqah + dropdown Status Capaian – dalam satu baris rapi  
- **Tabel:** kolom Periode, Nama, Tingkatan, Halqah, Jalur, Status (badge), Catatan, Aksi (edit, pindah halqah, hapus)  
- **Aksi:** menggunakan icon dengan tooltip  
- **Pagination** di bawah  
- **Tombol "Tambah Santri"** di atas tabel (untuk admin)

#### 4. Evaluasi Harian (Form)

- **2 kolom:** kiri form, kanan target kurikulum (sticky)  
- **Form:**  
  - Tanggal (date picker)  
  - Sesi (auto, dengan badge waktu)  
  - Nama Santri (dropdown + search, dengan opsi tambah manual)  
  - Tingkatan (auto, dengan indikator progress)  
  - Halqah (auto)  
  - Jalur (radio button: Reguler, Akselerasi, Khusus)  
  - Status Capaian (dropdown dengan warna)  
  - Catatan (textarea)
- **Target Kurikulum (kanan):**  
  - Judul "Target Kurikulum" dengan icon book  
  - List per tingkatan dengan progress bar (misal: Juz 30, Juz 29, dst.)
- **Tombol Simpan** – emerald dengan icon save, efek ripple

#### 5. Absensi Ustadz

- **Banner status:** di atas halaman (hijau = dibuka, merah = tutup, kuning = menunggu) dengan ikon dan teks  
- **Tombol "Presensi Sekarang"** – dengan animasi pulsing jika GPS aktif  
- **Tabel riwayat:** kolom Tanggal, Jam, Nama, Sesi, Status (badge), Jarak GPS, Lokasi Validasi, Keterangan, Aksi (hapus untuk admin)  
- **Filter:** date range + sesi  
- **Admin override:** tombol "Absenkan Ustadz" (untuk admin) yang membuka modal dengan dropdown ustadz

#### 6. Ujian Tasmi'

- **Form input:** Tanggal, Tahapan (dropdown), Nama Santri (dropdown), Nilai (0-100), Catatan  
- **Predikat &amp; status kelulusan** muncul otomatis setelah input nilai (tampilkan di samping field)  
- **Tabel rekap:** kolom Tanggal, Nama, Halqah, Tahapan, Nilai, Predikat (dengan font arabic), Status (badge), Aksi (hapus untuk admin)  
- **Tombol "Cetak Rekap"** di atas tabel

#### 7. Manajemen User (Admin Only)

- **Tabel:** Username, Nama, Role (badge), Halqah, Email, Status (Aktif/Nonaktif), Aksi (edit, hapus)  
- **Tombol "Tambah User"** di atas tabel  
- **Modal tambah/edit** dengan field lengkap (password disembunyikan saat edit)

#### 8. Pengaturan Sistem (Admin Only)

- **3 section:**  
  - GPS: radius, latitude, longitude  
  - Waktu Presensi: start/end Subuh &amp; Maghrib  
  - Waktu Evaluasi: start/end Subuh &amp; Maghrib (Senin-Kamis)
- **Tombol simpan** per section  
- **Area Backup &amp; Reset** di bawah dengan tombol terpisah dan peringatan

#### 9. Profil &amp; Laporan

- **Profil:** form edit nama, email, lembaga  
- **Laporan:** tabel data santri (mirip Data Santri) dengan tombol cetak (PDF/Excel)

---

### 🧭 SIDEBAR &amp; NAVIGASI

- **Sidebar:** lebar 260px, background emerald-900, teks putih  
- **Menu:**  
  - 🏠 Dashboard  
  - 👥 Data Santri  
  - 📝 Evaluasi Harian  
  - 📍 Absensi Ustadz  
  - 📖 Ujian Tasmi'  
  - ⚙️ Manajemen User (hanya admin)  
  - 📊 Laporan &amp; Cetak  
  - 🛠️ Pengaturan (hanya admin)
- **Footer sidebar:** foto profil user (inisial) + nama + role + tombol logout

---

### 🎯 INTERAKSI &amp; ANIMASI

- **Hover card:** naik 4px + shadow lebih besar  
- **Tombol:** efek scale (0.95) saat diklik  
- **Sidebar:** active state dengan background emerald-700 dan border kanan emas  
- **Toast:** muncul dari kanan atas, slide in, otomatis hilang setelah 4s  
- **Modal:** fade in + scale, backdrop blur  
- **Loading:** skeleton untuk tabel, spinner untuk tombol  
- **GPS:** animasi pulsing pada icon lokasi saat mencari sinyal

---

### 🧪 TEKNOLOGI YANG DIGUNAKAN

- **Framework:** React + TypeScript + Vite  
- **Styling:** Tailwind CSS (dengan konfigurasi custom)  
- **UI Components:** shadcn/ui (Card, Button, Input, Select, Table, Dialog, Badge, etc.)  
- **Icons:** Lucide React  
- **Chart:** Recharts  
- **Form:** React Hook Form + Zod  
- **State:** React Context + useReducer

---

### 📋 CATATAN TAMBAHAN

- **Responsif:** Mobile-first, sidebar collapse di tablet, menu hamburger di mobile.  
- **Aksesibilitas:** Gunakan semantic HTML, aria-label, dan keyboard navigation.  
- **Islamic touch:** Tambahkan kaligrafi "بسم الله الرحمن الرحيم" di header atau footer, gunakan pattern geometris halus sebagai background di beberapa section.

---

