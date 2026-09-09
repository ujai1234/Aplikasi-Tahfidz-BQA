import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    nama: text("nama").notNull(),
    role: text("role", { enum: ["Admin", "Ustadz", "Ustadzah", "Kepsek"] }).notNull(),
    halqah: text("halqah"),
    email: text("email"),
    lembaga: text("lembaga"),
    status: text("status", { enum: ["Aktif", "Nonaktif"] })
      .notNull()
      .default("Aktif"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

export const masterSantri = sqliteTable(
  "master_santri",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nis: text("nis").notNull(),
    nama: text("nama").notNull(),
    halqah: text("halqah").notNull(),
    tingkatan: integer("tingkatan").notNull(),
    jalur: text("jalur", { enum: ["Reguler", "Akselerasi", "Khusus"] })
      .notNull()
      .default("Reguler"),
    jenisKelamin: text("jenis_kelamin", {
      enum: ["Laki-laki", "Perempuan"],
    })
      .notNull()
      .default("Laki-laki"),
    statusAktif: integer("status_aktif", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    nisIdx: uniqueIndex("master_santri_nis_idx").on(t.nis),
    halqahIdx: index("master_santri_halqah_idx").on(t.halqah),
  })
);

export const dataSantri = sqliteTable(
  "data_santri",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tanggal: text("tanggal").notNull(),
    sesi: text("sesi", { enum: ["Subuh", "Maghrib"] }).notNull(),
    santriId: integer("santri_id")
      .notNull()
      .references(() => masterSantri.id),
    namaSantri: text("nama_santri").notNull(),
    tingkatan: integer("tingkatan").notNull(),
    halqah: text("halqah").notNull(),
    jalur: text("jalur").notNull().default("Reguler"),
    statusCapaian: text("status_capaian", {
      enum: ["Tuntas", "Sedang", "Recovery"],
    }).notNull(),
    penyebab: text("penyebab"),
    targetJuz: text("target_juz"),
    catatan: text("catatan"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    tanggalIdx: index("data_santri_tanggal_idx").on(t.tanggal),
    halqahIdx: index("data_santri_halqah_idx").on(t.halqah),
  })
);

export const absensiUstadz = sqliteTable(
  "absensi_ustadz",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tanggal: text("tanggal").notNull(),
    jam: text("jam").notNull(),
    username: text("username").notNull(),
    nama: text("nama").notNull(),
    sesi: text("sesi", { enum: ["Subuh", "Maghrib"] }).notNull(),
    halqah: text("halqah"),
    status: text("status", { enum: ["Hadir", "Izin", "Sakit"] }).notNull(),
    jarakMeter: integer("jarak_meter"),
    lokasiValidasi: integer("lokasi_validasi", { mode: "boolean" })
      .notNull()
      .default(false),
    keterangan: text("keterangan"),
    isAdminOverride: integer("is_admin_override", { mode: "boolean" })
      .notNull()
      .default(false),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    tanggalIdx: index("absensi_tanggal_idx").on(t.tanggal),
    usernameIdx: index("absensi_username_idx").on(t.username),
  })
);

export const dataTasmi = sqliteTable(
  "data_tasmi",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tanggal: text("tanggal").notNull(),
    santriId: integer("santri_id")
      .notNull()
      .references(() => masterSantri.id),
    namaSantri: text("nama_santri").notNull(),
    halqah: text("halqah").notNull(),
    tingkatan: integer("tingkatan").notNull(),
    jenisTasmi: text("jenis_tasmi", {
      enum: ["Pekanan", "Per 3 Bulan", "Per 6 Bulan"],
    }).notNull(),
    nilai: integer("nilai").notNull(),
    predikat: text("predikat").notNull(),
    statusKelulusan: text("status_kelulusan", {
      enum: ["Lulus", "Tidak Lulus"],
    }).notNull(),
    catatan: text("catatan"),
    penguji: text("penguji"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    tanggalIdx: index("data_tasmi_tanggal_idx").on(t.tanggal),
    halqahIdx: index("data_tasmi_halqah_idx").on(t.halqah),
  })
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  username: text("username").notNull(),
  action: text("action").notNull(),
  detail: text("detail"),
  createdAt: text("created_at").notNull(),
});

// --- BETTER AUTH TABLES ---
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId').notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId').notNull().references(() => user.id),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull()
});
