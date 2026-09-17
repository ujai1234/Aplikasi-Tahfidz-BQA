CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`nama` text NOT NULL,
	`role` text NOT NULL,
	`halqah` text,
	`email` text,
	`lembaga` text,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);

CREATE TABLE `absensi_ustadz` (
	`id` text PRIMARY KEY NOT NULL,
	`tanggal` text NOT NULL,
	`jam` text NOT NULL,
	`username` text NOT NULL,
	`nama` text NOT NULL,
	`sesi` text NOT NULL,
	`halqah` text,
	`status` text NOT NULL,
	`jarak_meter` integer,
	`lokasi_validasi` integer DEFAULT false NOT NULL,
	`keterangan` text,
	`is_admin_override` integer DEFAULT false NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
CREATE INDEX `absensi_tanggal_idx` ON `absensi_ustadz` (`tanggal`);
CREATE INDEX `absensi_username_idx` ON `absensi_ustadz` (`username`);

CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);

CREATE TABLE `tahfidz_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`username` text NOT NULL,
	`action` text NOT NULL,
	`detail` text,
	`created_at` text NOT NULL
);
