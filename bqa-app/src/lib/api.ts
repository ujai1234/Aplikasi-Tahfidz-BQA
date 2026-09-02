const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type Role = "Admin" | "Ustadz" | "Ustadzah" | "Kepsek";
export type CapaianStatus = "Tuntas" | "Sedang" | "Recovery";
export type PresensiStatus = "Hadir" | "Izin" | "Sakit";
export type Sesi = "Subuh" | "Maghrib";

export interface PublicUser {
  id: number;
  username: string;
  nama: string;
  role: Role;
  halqah: string | null;
  email: string | null;
  lembaga: string | null;
  status: "Aktif" | "Nonaktif";
}

export interface Santri {
  id: number;
  nis: string;
  nama: string;
  halqah: string;
  tingkatan: number;
  jalur: "Reguler" | "Akselerasi" | "Khusus";
  jenisKelamin: "Laki-laki" | "Perempuan";
  statusAktif: boolean;
}

export interface Evaluasi {
  id: number;
  tanggal: string;
  sesi: Sesi;
  santriId: number;
  namaSantri: string;
  tingkatan: number;
  halqah: string;
  jalur: string;
  statusCapaian: CapaianStatus;
  penyebab: string | null;
  targetJuz: string | null;
  catatan: string | null;
  createdBy: string;
}

export interface Absensi {
  id: number;
  tanggal: string;
  jam: string;
  username: string;
  nama: string;
  sesi: Sesi;
  halqah: string | null;
  status: PresensiStatus;
  jarakMeter: number | null;
  lokasiValidasi: boolean;
  keterangan: string | null;
  isAdminOverride: boolean;
  createdBy: string;
}

export interface Tasmi {
  id: number;
  tanggal: string;
  santriId: number;
  namaSantri: string;
  halqah: string;
  tingkatan: number;
  jenisTasmi: "Pekanan" | "Per 3 Bulan" | "Per 6 Bulan";
  nilai: number;
  predikat: string;
  statusKelulusan: "Lulus" | "Tidak Lulus";
  catatan: string | null;
  penguji: string | null;
  createdBy: string;
}

export interface DashboardData {
  stats: {
    totalSantri: number;
    tuntas: number;
    sedang: number;
    recovery: number;
    lulusTasmiPercent: number;
    tasmiLulus?: number;
    testedTasmiCount?: number;
    presensiHadir: number;
    presensiTotal: number;
    presensiSubuh: number;
    presensiMaghrib: number;
  };
  persentaseCapaian?: Array<{
    name: string;
    count: number;
    percent: number;
    color: string;
  }>;
  rekapPredikat?: Array<{
    name: string;
    count: number;
  }>;
  presensiBanner?: {
    open: boolean;
    message: string;
    sesi: Sesi | null;
  };
  capaianHalqah: Array<{ name: string; value: number }>;
  distribusiHalqah: Array<{ name: string; total: number; percent: number }>;
  santriPerluPerhatian: Array<{
    nis: string;
    nama: string;
    halqah: string;
    tingkat: number;
    status: CapaianStatus;
    kendala: string;
    target: string;
    catatan?: string;
  }>;
  presensiTerbaru: Array<{
    tanggal: string;
    jam: string;
    nama: string;
    halqah: string;
    sesi: Sesi;
    status: PresensiStatus;
    jarak: string;
  }>;
  sesi: {
    subuh: { mulai: string; selesai: string; hadir: number };
    maghrib: { mulai: string; selesai: string; hadir: number };
  };
}

export interface AbsensiStatus {
  serverDate: string;
  serverTime: string;
  sesiBerjalan: { open: boolean; sesi: Sesi | null; reason: string | null };
  presensiHariIni: Array<{
    sesi: Sesi;
    status: PresensiStatus;
    jam: string;
    jarakMeter: number | null;
  }>;
  jadwal: {
    subuh: { mulai: string; selesai: string };
    maghrib: { mulai: string; selesai: string };
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "bqa_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    throw new ApiError(
      (data?.error as string) ?? "Terjadi kesalahan pada server",
      res.status,
      data?.details
    );
  }
  return data as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== null) {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export const api = {
  auth: {
    async login(usernameOrEmail: string, password: string) {
      const data = await request<{ token: string; user: PublicUser }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ usernameOrEmail, password }) }
      );
      setToken(data.token);
      return data;
    },
    me() {
      return request<{ user: PublicUser; serverTime: string }>("/auth/me");
    },
  },

  users: {
    list(query: { role?: string; halqah?: string; status?: string; q?: string } = {}) {
      return request<{ total: number; data: PublicUser[] }>(
        `/users${qs(query)}`
      );
    },
    create(body: {
      username: string;
      password: string;
      nama: string;
      role: Role;
      halqah?: string | null;
      email?: string | null;
      lembaga?: string | null;
    }) {
      return request<{ user: PublicUser }>("/users", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    update(
      id: number,
      body: {
        nama?: string;
        role?: Role;
        halqah?: string | null;
        email?: string | null;
        lembaga?: string | null;
        password?: string;
      }
    ) {
      return request<{ user: PublicUser }>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    setStatus(id: number, status: "Aktif" | "Nonaktif") {
      return request<{ user: PublicUser }>(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    remove(id: number) {
      return request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" });
    },
  },

  santri: {
    list(
      query: {
        halqah?: string;
        tingkatan?: number;
        status?: "Aktif" | "Tidak Aktif";
        q?: string;
      } = {}
    ) {
      return request<{ total: number; data: Santri[] }>(`/santri${qs(query)}`);
    },
    create(body: {
      nis: string;
      nama: string;
      halqah: string;
      tingkatan: number;
      jalur?: string;
      jenisKelamin?: string;
    }) {
      return request<{ santri: Santri }>("/santri", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    update(
      id: number,
      body: Partial<{
        nama: string;
        halqah: string;
        tingkatan: number;
        jalur: string;
        jenisKelamin: string;
        statusAktif: boolean;
      }>
    ) {
      return request<{ santri: Santri }>(`/santri/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    mutasi(id: number, body: { halqah: string; tingkatan?: number }) {
      return request<{ santri: Santri }>(`/santri/${id}/mutasi`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    remove(id: number) {
      return request<{ ok: boolean }>(`/santri/${id}`, { method: "DELETE" });
    },
  },

  evaluasi: {
    list(
      query: {
        tanggal?: string;
        halqah?: string;
        status?: string;
        q?: string;
        limit?: number;
      } = {}
    ) {
      return request<{ total: number; data: Evaluasi[] }>(
        `/evaluasi${qs(query)}`
      );
    },
    create(body: {
      santriId: number;
      sesi: Sesi;
      statusCapaian: CapaianStatus;
      penyebab?: string | null;
      catatan?: string | null;
    }) {
      return request<{ evaluasi: Evaluasi }>("/evaluasi", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    remove(id: number) {
      return request<{ ok: boolean }>(`/evaluasi/${id}`, { method: "DELETE" });
    },
    target(tingkatan: number) {
      return request<{ tingkatan: number; targetJuz: string; keterangan: string }>(
        `/evaluasi/target?tingkatan=${tingkatan}`
      );
    },
  },

  absensi: {
    status() {
      return request<AbsensiStatus>("/absensi/status");
    },
    list(
      query: {
        tanggal?: string;
        sesi?: string;
        status?: string;
        limit?: number;
      } = {}
    ) {
      return request<{ total: number; data: Absensi[] }>(`/absensi${qs(query)}`);
    },
    presensi(latitude: number, longitude: number, keterangan?: string) {
      return request<{ absensi: Absensi; pesan: string }>("/absensi/presensi", {
        method: "POST",
        body: JSON.stringify({ latitude, longitude, keterangan }),
      });
    },
    izin(status: "Izin" | "Sakit", keterangan: string) {
      return request<{ absensi: Absensi }>("/absensi/izin", {
        method: "POST",
        body: JSON.stringify({ status, keterangan }),
      });
    },
    override(body: {
      username: string;
      sesi: Sesi;
      status: PresensiStatus;
      keterangan?: string;
    }) {
      return request<{ absensi: Absensi }>("/absensi/override", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },

  tasmi: {
    status() {
      return request<{
        isFriday: boolean;
        periodicUnlocked: boolean;
        pekanan: { open: boolean; reason: string | null };
        per3Bulan: { open: boolean; reason: string | null };
        per6Bulan: { open: boolean; reason: string | null };
      }>("/tasmi/status");
    },
    list(
      query: {
        halqah?: string;
        jenis?: string;
        kelulusan?: string;
        q?: string;
        limit?: number;
      } = {}
    ) {
      return request<{
        total: number;
        lulus: number;
        persenLulus: number;
        rataRata: number;
        data: Tasmi[];
      }>(`/tasmi${qs(query)}`);
    },
    create(body: {
      santriId: number;
      jenisTasmi: string;
      nilai: number;
      catatan?: string | null;
      penguji?: string | null;
    }) {
      return request<{ tasmi: Tasmi }>("/tasmi", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    remove(id: number) {
      return request<{ ok: boolean }>(`/tasmi/${id}`, { method: "DELETE" });
    },
  },

  settings: {
    get() {
      return request<{ settings: Record<string, string>; keys: string[] }>(
        "/settings"
      );
    },
    update(values: Record<string, string>) {
      return request<{
        settings: Record<string, string>;
        changed: string[];
      }>("/settings", {
        method: "PUT",
        body: JSON.stringify({ values }),
      });
    },
  },

  dashboard() {
    return request<DashboardData>("/dashboard");
  },

  backup: {
    logs() {
      return request<{
        total: number;
        data: Array<{
          id: number;
          username: string;
          action: string;
          detail: string | null;
          createdAt: string;
        }>;
      }>("/backup/logs");
    },
    reset(konfirmasi: string) {
      return request<{ ok: boolean; dihapus: Record<string, number> }>(
        "/backup/reset",
        { method: "POST", body: JSON.stringify({ konfirmasi }) }
      );
    },
    downloadJson() {
      return fetch(`${API_URL}/backup/backup`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then(async (res) => {
        if (!res.ok) throw new ApiError("Backup gagal", res.status);
        return res.blob();
      });
    },
  },
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error)
    return err.message || "Koneksi ke server gagal — pastikan backend berjalan";
  return "Terjadi kesalahan yang tidak diketahui";
}
