export type CapaianStatus = "Tuntas" | "Sedang" | "Recovery";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold"
  | "purple"
  | "neutral";

export type Sesi = "Subuh" | "Maghrib";

export type PresensiStatus = "Hadir" | "Izin" | "Sakit";

export type Role = "Admin" | "Ustadz" | "Ustadzah" | "Kepsek";

export interface HalqahCapaian {
  name: string;
  value: number;
}

export interface DistribusiHalqah {
  name: string;
  total: number;
  percent: number;
  color: string;
}

export interface SantriPerhatian {
  nis: string;
  nama: string;
  halqah: string;
  tingkat: number;
  status: CapaianStatus;
  kendala: string;
  target: string;
}

export interface PresensiRow {
  tanggal: string;
  jam: string;
  nama: string;
  halqah: string;
  sesi: Sesi;
  status: PresensiStatus;
  jarak: string;
  valid?: boolean;
  override?: boolean;
  keterangan?: string;
}

export interface MasterSantri {
  nis: string;
  nama: string;
  jenisKelamin: string;
  halqah: string;
  tingkat: number;
  aktif: boolean;
}

export interface RiwayatEvaluasi {
  tanggal: string;
  nama: string;
  halqah: string;
  tingkat: number;
  status: CapaianStatus;
  kendala: string;
  target: string;
  oleh: string;
}

export interface EvaluasiTerbaru {
  tanggal: string;
  nama: string;
  sesi: Sesi;
  status: CapaianStatus;
  catatan: string;
  oleh: string;
}

export interface TargetKurikulum {
  tingkat: number;
  nama: string;
  detail: string;
  target: string;
}

export interface TasmiRecord {
  tanggal: string;
  nama: string;
  nis: string;
  halqah: string;
  jenis: string;
  nilai: number;
  penguji: string;
}

export interface Predikat {
  range: string;
  nama: string;
  lulus: boolean;
  arab: string;
  variant: BadgeVariant;
}

export interface UserAccount {
  inisial: string;
  nama: string;
  email: string;
  username: string;
  role: Role;
  halqah: string;
  lembaga: string;
  aktif: boolean;
}

export interface BackupRecord {
  tanggal: string;
  jenis: "Excel" | "JSON";
  ukuran: string;
  oleh: string;
}

export interface ActivityLog {
  waktu: string;
  user: string;
  aktivitas: string;
}
