"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";
import { CheckItem } from "@/components/ui/check-item";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";
import { api, errorMessage } from "@/lib/api";
import { getAccurateCurrentPosition, calculateHaversineDistance } from "@/lib/geo";

interface GeoState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export function PresensiCard() {
  const queryClient = useQueryClient();
  const [geo, setGeo] = useState<GeoState | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);

  const { data: status, isLoading } = useQuery({
    queryKey: ["absensi", "status"],
    queryFn: () => api.absensi.status(),
    refetchInterval: 60_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["absensi"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  const detectLocation = useCallback(async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Perangkat atau browser tidak mendukung akses GPS.");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    try {
      const coords = await getAccurateCurrentPosition({
        targetAccuracyMeters: 25,
        maxWaitMs: 5000,
        timeoutMs: 12000,
        onProgress: (posCoords, acc) => {
          setGeo({
            latitude: posCoords.latitude,
            longitude: posCoords.longitude,
            accuracy: acc,
          });
        },
      });
      setGeo({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
      setIsLocating(false);
    } catch (err: unknown) {
      setIsLocating(false);
      const msg = err instanceof Error ? err.message : "Gagal mengambil lokasi GPS";
      setGeoError(msg);
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const presensiMutation = useMutation({
    mutationFn: () =>
      api.absensi.presensi(
        geo!.latitude,
        geo!.longitude,
        undefined,
        geo?.accuracy
      ),
    onSuccess: (res) => {
      toast.success(res.pesan);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const izinMutation = useMutation({
    mutationFn: (keterangan: string) => api.absensi.izin("Izin", keterangan),
    onSuccess: () => {
      toast.success("Pengajuan izin tercatat");
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isLoading || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Presensi Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="animate-pulse text-sm text-muted-foreground">Memuat status sesi…</p>
        </CardContent>
      </Card>
    );
  }

  const sesi = status.sesiBerjalan;
  const sudahPresensiSesiIni = sesi.sesi
    ? status.presensiHariIni.some((p) => p.sesi === sesi.sesi)
    : false;

  const geofence = status.geofence ?? {
    latitude: -6.1286195,
    longitude: 106.9648116,
    radiusMeter: 200,
  };

  const rawDistance = geo
    ? calculateHaversineDistance(
        geo.latitude,
        geo.longitude,
        geofence.latitude,
        geofence.longitude
      )
    : null;

  const MAX_ACCURACY_DISCOUNT = 80;
  const accuracyDiscount = geo?.accuracy
    ? Math.min(Math.round(geo.accuracy), MAX_ACCURACY_DISCOUNT)
    : 0;
  const effectiveDistance =
    rawDistance !== null ? Math.max(0, rawDistance - accuracyDiscount) : null;
  const isWithinRadius =
    effectiveDistance !== null
      ? effectiveDistance <= geofence.radiusMeter
      : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presensi Kehadiran</CardTitle>
        <CardDescription>
          {new Date(`${status.serverDate}T00:00:00`).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {status.serverTime} WIB
        </CardDescription>
        <CardAction>
          {sesi.open && sesi.sesi ? (
            <Badge variant="success">
              <LiveDot />
              Sesi {sesi.sesi} Berlangsung
            </Badge>
          ) : (
            <Badge variant="neutral">Sesi Ditutup</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-dashed border-[#c8d6cc] bg-[#fbfdfc] px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                isLocating
                  ? "bg-amber-100 text-amber-700"
                  : geo && isWithinRadius
                    ? "bg-emerald-100 text-emerald-700"
                    : geo
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
              }`}
            >
              {isLocating ? (
                <RefreshCw className="size-5 animate-spin" />
              ) : (
                <MapPin className="size-5" strokeWidth={1.9} />
              )}
            </span>
            {isLocating ? (
              <div>
                <p className="text-[13.5px] font-extrabold text-foreground">
                  Mengunci Satelit GPS Presisi…
                </p>
                <p className="text-[11.5px] text-muted-foreground">
                  {geo?.accuracy
                    ? `Sinyal terdeteksi (akurasi ±${Math.round(geo.accuracy)}m), mengoptimalkan…`
                    : "Menghubungkan ke satelit GPS perangkat…"}
                </p>
              </div>
            ) : geo ? (
              <div>
                <p className="text-[13.5px] font-extrabold text-foreground">
                  Lokasi Terkunci — GPS Presisi
                </p>
                <p className="font-mono text-[12.5px] text-muted-foreground">
                  {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] mt-0.5">
                  <span
                    className={
                      isWithinRadius
                        ? "font-bold text-emerald-700"
                        : "font-bold text-rose-600"
                    }
                  >
                    {isWithinRadius
                      ? `✓ Dalam Radius Pesantren (~${rawDistance}m)`
                      : `✗ Di Luar Radius Pesantren (~${rawDistance}m)`}
                  </span>
                  {geo.accuracy != null && (
                    <span className="text-muted-foreground">
                      · Akurasi ±{Math.round(geo.accuracy)}m
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[13.5px] font-extrabold text-rose-700">
                  GPS Belum Terdeteksi
                </p>
                <p className="text-[11.5px] text-muted-foreground">
                  {geoError ?? "Izinkan akses lokasi (pilih Akurat/Tepat) pada browser Anda"}
                </p>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detectLocation}
            disabled={isLocating}
            className="shrink-0 text-xs cursor-pointer"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isLocating ? "animate-spin" : ""}`} />
            {isLocating ? "Mencari..." : "Segarkan"}
          </Button>
        </div>

        {geoError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>Panduan Cepat Jika Lokasi Bermasalah:</span>
            </div>
            <p className="text-[11.5px] text-rose-700">
              1. Pastikan izin lokasi browser diset ke <strong>&quot;Akurat / Tepat&quot; (Precise)</strong>, bukan perkiraan.
            </p>
            <p className="text-[11.5px] text-rose-700">
              2. Nyalakan Wi-Fi di HP untuk membantu satelit saat di dalam ruangan/masjid.
            </p>
            <p className="text-[11.5px] text-rose-700">
              3. Buka Google Maps selama 3 detik hingga titik biru tepat, lalu kembali dan tekan tombol <strong>Segarkan</strong>.
            </p>
          </div>
        )}

        {geo && !isWithinRadius && !isLocating && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
              <AlertCircle className="size-4 shrink-0 text-amber-600" />
              <span>Sudah di Lingkungan Pesantren Tapi Terbaca di Luar?</span>
            </div>
            <p className="text-[11.5px] text-amber-700">
              • Buka <strong>Google Maps</strong> sebentar selama 3–5 detik agar satelit GPS HP Anda mengunci titik tepat.
            </p>
            <p className="text-[11.5px] text-amber-700">
              • Nyalakan <strong>Wi-Fi</strong> di HP untuk membantu triangulasi posisi saat berada di dalam ruangan kelas atau masjid.
            </p>
            <p className="text-[11.5px] text-amber-700">
              • Setelah itu, kembali ke sini dan tekan tombol <strong>Segarkan</strong> di atas.
            </p>
          </div>
        )}

        <div className="grid gap-2.5">
          <CheckItem ok={Boolean(geo) && isWithinRadius}>
            {geo
              ? isWithinRadius
                ? `Berada di wilayah pesantren (~${rawDistance}m dari pusat, batas ${geofence.radiusMeter}m)`
                : `Di luar radius pesantren: ~${rawDistance}m (Batas ${geofence.radiusMeter}m)`
              : "Menunggu deteksi lokasi GPS"}
          </CheckItem>
          <CheckItem ok={sesi.open}>
            {sesi.open
              ? `Sesi ${sesi.sesi} dibuka saat ini`
              : (sesi.reason ?? "Di luar jadwal sesi")}
          </CheckItem>
          {sudahPresensiSesiIni ? (
            <CheckItem ok>
              Presensi sesi {sesi.sesi} tercatat pukul{" "}
              {
                status.presensiHariIni.find(
                  (p) => p.sesi === sesi.sesi
                )?.jam
              }{" "}
              — selesai
            </CheckItem>
          ) : (
            <CheckItem ok={false}>Belum melakukan presensi pada sesi ini</CheckItem>
          )}
        </div>

        {sudahPresensiSesiIni ? (
          <Button
            variant="secondary"
            disabled
            className="w-full rounded-2xl py-3.5 text-[14.5px]"
          >
            <Check className="size-4" strokeWidth={2.5} />
            Presensi Tercatat — Alhamdulillah
          </Button>
        ) : (
          <>
            <Button
              onClick={() => {
                if (!geo) {
                  toast.warning("Lokasi GPS belum terdeteksi");
                  return;
                }
                if (!isWithinRadius) {
                  toast.error(
                    `Di luar radius pesantren: ~${rawDistance}m dari pusat (batas ${geofence.radiusMeter}m)`
                  );
                  return;
                }
                presensiMutation.mutate();
              }}
              disabled={
                !sesi.open ||
                !geo ||
                isLocating ||
                !isWithinRadius ||
                presensiMutation.isPending
              }
              className="w-full rounded-2xl py-3.5 text-[14.5px]"
            >
              <Check className="size-4" strokeWidth={2.5} />
              {presensiMutation.isPending
                ? "Memvalidasi…"
                : isLocating
                  ? "Mengunci Satelit GPS Presisi…"
                  : !isWithinRadius && geo
                    ? `Di Luar Radius Pesantren (~${rawDistance}m)`
                    : sesi.open
                      ? `Presensi Hadir — Sesi ${sesi.sesi}`
                      : "Presensi Tutup"}
            </Button>
            {sesi.open && (
              <Button
                variant="outline"
                disabled={izinMutation.isPending}
                className="w-full rounded-2xl"
                onClick={() => {
                  const keterangan = window.prompt(
                    "Keterangan izin (min. 3 karakter):"
                  );
                  if (keterangan && keterangan.trim().length >= 3) {
                    izinMutation.mutate(keterangan.trim());
                  }
                }}
              >
                Ajukan Izin
              </Button>
            )}
          </>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Satu presensi per sesi per hari · Senin–Jumat · Jumat: sesi khusus
          04:30–21:00
        </p>
      </CardContent>
    </Card>
  );
}

export function OverrideForm() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [sesi, setSesi] = useState("Maghrib");
  const [status, setStatus] = useState("Hadir");

  const { data: userData } = useQuery({
    queryKey: ["users", "for-override"],
    queryFn: () =>
      api.users.list({ role: undefined, status: "Aktif" }),
  });
  const ustadzRows = (userData?.data ?? []).filter(
    (u) => u.role === "Ustadz" || u.role === "Ustadzah"
  );

  useEffect(() => {
    if (!username && ustadzRows.length > 0) {
      setUsername(String(ustadzRows[0]!.username));
    }
  }, [ustadzRows, username]);

  const mutation = useMutation({
    mutationFn: (keterangan: string | null) =>
      api.absensi.override({
        username,
        sesi: sesi as "Subuh" | "Maghrib",
        status: status as "Hadir" | "Izin" | "Sakit",
        ...(keterangan ? { keterangan } : {}),
      }),
    onSuccess: (res) => {
      toast.success(`Presensi manual untuk ${res.absensi.nama} tersimpan`);
      queryClient.invalidateQueries({ queryKey: ["absensi"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        mutation.mutate(String(f.get("keterangan") ?? "") || null);
      }}
    >
      <Field label="Nama Ustadz/Ustadzah" required>
        <Select value={username} onValueChange={setUsername}>
          <SelectTrigger id="ustadz-override">
            <SelectValue placeholder="Pilih ustadz…" />
          </SelectTrigger>
          <SelectContent position="popper">
            {ustadzRows.map((u) => (
              <SelectItem key={u.id} value={u.username}>
                {u.nama}
                {u.halqah ? ` — ${u.halqah}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sesi" required>
          <Select value={sesi} onValueChange={setSesi}>
            <SelectTrigger id="override-sesi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="Subuh">Subuh</SelectItem>
              <SelectItem value="Maghrib">Maghrib</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status" required>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="override-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="Hadir">Hadir</SelectItem>
              <SelectItem value="Izin">Izin</SelectItem>
              <SelectItem value="Sakit">Sakit</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Keterangan" htmlFor="override-keterangan">
        <Input id="override-keterangan" name="keterangan" placeholder="mis. tugas luar pesantren" />
      </Field>
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Menyimpan…" : "Simpan Presensi Manual"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Override tanpa batasan GPS &amp; waktu — seluruh presensi manual tercatat pada
        audit trail.
      </p>
    </form>
  );
}
