"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin } from "lucide-react";
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

interface GeoState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export function PresensiCard() {
  const queryClient = useQueryClient();
  const [geo, setGeo] = useState<GeoState | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["absensi", "status"],
    queryFn: () => api.absensi.status(),
    refetchInterval: 60_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["absensi"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Perangkat tidak mendukung GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => setGeoError(err.message || "Gagal mengambil lokasi GPS"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  }, []);

  const presensiMutation = useMutation({
    mutationFn: () => api.absensi.presensi(geo!.latitude, geo!.longitude),
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
        <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-[#c8d6cc] bg-[#fbfdfc] px-4 py-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-info-soft text-info">
            <MapPin className="size-5" strokeWidth={1.9} />
          </span>
          {geo ? (
            <div>
              <p className="text-[13.5px] font-extrabold">Lokasi Terkunci — GPS Aktif</p>
              <p className="font-mono text-[12.5px] text-muted-foreground">
                {geo.latitude.toFixed(6)}, {geo.longitude.toFixed(6)}
              </p>
              {geo.accuracy != null && (
                <p className="text-[11.5px] text-muted-foreground">
                  Akurasi ±{Math.round(geo.accuracy)} m
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[13.5px] font-extrabold">
                {geoError ? "GPS Tidak Tersedia" : "Mencari sinyal GPS…"}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {geoError ??
                    "Izinkan akses lokasi pada browser untuk melakukan presensi"}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-2.5">
          <CheckItem ok={Boolean(geo)}>
            {geo
              ? "Lokasi GPS berhasil dideteksi"
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
                presensiMutation.mutate();
              }}
              disabled={!sesi.open || !geo || presensiMutation.isPending}
              className="w-full rounded-2xl py-3.5 text-[14.5px]"
            >
              <Check className="size-4" strokeWidth={2.5} />
              {presensiMutation.isPending
                ? "Memvalidasi…"
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
