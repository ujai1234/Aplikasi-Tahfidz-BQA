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
  "students", // MAPPED TO HRIS STUDENTS TABLE
  {
    id: text("id").primaryKey(), // NOW UUID STRING
    nis: text("nis").notNull(),
    nama: text("name").notNull(),
    className: text("class_name").notNull().default("-"),
    halqah: text("halqah"),
    tingkatan: integer("tingkatan"),
    jalur: text("jalur").default("Reguler"),
    jenisKelamin: text("gender").notNull().default("L"), // 'L' or 'P'
    statusAktif: text("status").notNull().default("AKTIF"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    nisIdx: uniqueIndex("master_santri_nis_idx").on(t.nis),
    halqahIdx: index("master_santri_halqah_idx").on(t.halqah),
  })
);

import crypto from "crypto";

export const dataSantri = sqliteTable("tahfidz_evaluations", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tanggal: text("date").notNull(),
    sesi: text("session", { enum: ["Subuh", "Maghrib"] }).notNull(),
    santriId: text("student_id")
      .notNull()
      .references(() => masterSantri.id),
    statusCapaian: text("status", {
      enum: ["Tuntas", "Sedang", "Recovery"],
    }).notNull(),
    penyebab: text("notes"),
    createdBy: text("teacher_name").notNull(),
    juzCompleted: integer("juz_completed").notNull().default(0),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    tanggalIdx: index("tahfidz_eval_date_idx").on(t.tanggal),
  })
);

export const absensiUstadz = sqliteTable("absensi_ustadz", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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

export const dataTasmi = sqliteTable("tahfidz_tasmi", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tanggal: text("date").notNull(),
    santriId: text("student_id")
      .notNull()
      .references(() => masterSantri.id),
    jenisTasmi: text("type", {
      enum: ["Pekanan", "Per 3 Bulan", "Per 6 Bulan"],
    }).notNull(),
    nilai: integer("score").notNull(),
    predikat: text("predicate").notNull(),
    statusKelulusan: integer("passed", { mode: 'boolean' }).notNull(),
    penguji: text("examiner_name"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    tanggalIdx: index("tahfidz_tasmi_date_idx").on(t.tanggal),
  })
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const auditLogs = sqliteTable("tahfidz_audit_logs", {
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
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
