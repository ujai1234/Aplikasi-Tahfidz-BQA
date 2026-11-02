"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleAlert,
  Clock3,
  ClipboardCheck,
  Info,
  KeyRound,
  MapPin,
  Crosshair,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { InteractiveMapPreview } from "@/components/interactive-map-preview";
import { getAccurateCurrentPosition } from "@/lib/geo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CheckItem } from "@/components/ui/check-item";
import {
  api,
  errorMessage,
} from "@/lib/api";

function FormHeader({
  icon: Icon,
  tone,
  title,
  description,
  badge,
}: {
  icon: typeof MapPin;
  tone: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <CardHeader className="border-b border-line pb-4">
      <div className="col-start-1 row-span-2 flex items-center gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {badge ? <span className="ml-auto self-start">{badge}</span> : null}
      </div>
    </CardHeader>
  );
}

function useSettingsForm(keys: string[]) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => api.settings.get() });

  useEffect(() => {
    if (data) {
      setValues((prev) => {
        const next = { ...prev };
        for (const key of keys) next[key] = data.settings[key] ?? "";
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => api.settings.update(values),
    onSuccess: () => {
      toast.success("Pengaturan berhasil disimpan & langsung berlaku");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return { values, setValues, save: mutation.mutate, saving: mutation.isPending };
}

function SaveButton({
  label,
  saving,
}: {
  label: string;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={saving}>
        {saving ? "Menyimpan…" : label}
      </Button>
    </div>
  );
}

const RADIUS_OPTIONS = [50, 100, 150, 200, 250, 300, 500];

export function GpsForm() {
  const { values, setValues, save, saving } = useSettingsForm([
    "gps_radius_meter",
    "gps_latitude",
    "gps_longitude",
  ]);

  const [isDetecting, setIsDetecting] = useState(false);

  const currentLat = parseFloat(values.gps_latitude || "-6.1286195");
  const currentLng = parseFloat(values.gps_longitude || "106.9648116");
  const currentRadius = parseInt(values.gps_radius_meter || "200", 10);

  const handleLocationChange = (lat: number, lng: number) => {
    setValues((v) => ({
      ...v,
      gps_latitude: lat.toFixed(7),
      gps_longitude: lng.toFixed(7),
    }));
  };

  const handleRadiusSelect = (radius: number) => {
    setValues((v) => ({
      ...v,
      gps_radius_meter: String(radius),
    }));
  };

  const handleDetectGPS = async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Browser tidak mendukung geolokasi GPS.");
      return;
    }

    setIsDetecting(true);
    try {
      const coords = await getAccurateCurrentPosition({
        targetAccuracyMeters: 20,
        maxWaitMs: 5000,
        timeoutMs: 12000,
      });
      const lat = parseFloat(coords.latitude.toFixed(7));
      const lng = parseFloat(coords.longitude.toFixed(7));
      setValues((v) => ({
        ...v,
        gps_latitude: String(lat),
        gps_longitude: String(lng),
      }));
      setIsDetecting(false);
      toast.success(
        `Titik pusat GPS berhasil diperbarui: ${lat}, ${lng} (akurasi ±${Math.round(coords.accuracy ?? 0)}m)`
      );
    } catch (err: unknown) {
      setIsDetecting(false);
      const msg = err instanceof Error ? err.message : "Gagal mendeteksi GPS";
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setValues((v) => ({
      ...v,
      gps_latitude: "-6.1286195",
      gps_longitude: "106.9648116",
      gps_radius_meter: "200",
    }));
    toast.info("Koordinat dikembalikan ke standar Kampus Pesantren (200m).");
  };

  return (
    <Card className="h-full">
      <FormHeader
        icon={MapPin}
        tone="bg-primary-soft text-primary"
        title="GPS & Lokasi Presensi"
        description="Validasi radius & titik koordinat pesantren (Baitul Qur'an Al-Ikhwan)"
      />
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          {/* Interactive Map Component */}
          <InteractiveMapPreview
            latitude={isNaN(currentLat) ? -6.1286195 : currentLat}
            longitude={isNaN(currentLng) ? 106.9648116 : currentLng}
            radiusMeters={isNaN(currentRadius) ? 200 : currentRadius}
            onLocationChange={handleLocationChange}
          />

          {/* Quick Radius Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Radius Toleransi Presensi
              </label>
              <span className="font-mono text-xs font-bold text-primary">
                {currentRadius} Meter
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {RADIUS_OPTIONS.map((r) => {
                const isSelected = currentRadius === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRadiusSelect(r)}
                    className={`rounded-xl py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-sm ring-2 ring-primary/40"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {r}m
                  </button>
                );
              })}
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              Rekomendasi: <strong>200m – 250m</strong> agar mencakup seluruh gedung asrama, masjid, dan ruang kelas tahfidz.
            </p>
          </div>

          {/* Lat, Lng Inputs & GPS Buttons */}
          <div className="rounded-xl border border-dashed border-border p-3.5 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Ubah Titik Koordinat Pusat
              </span>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetecting}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer font-medium disabled:opacity-50"
              >
                {isDetecting ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Crosshair className="size-3.5" />
                )}
                <span>{isDetecting ? "Mendeteksi..." : "Gunakan GPS Saat Ini"}</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Latitude" required>
                <Input
                  value={values.gps_latitude ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, gps_latitude: e.target.value }))
                  }
                  placeholder="-6.1286195"
                />
              </Field>
              <Field label="Longitude" required>
                <Input
                  value={values.gps_longitude ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, gps_longitude: e.target.value }))
                  }
                  placeholder="106.9648116"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset Standar (200m)</span>
            </button>
            <SaveButton label="Simpan Pengaturan GPS" saving={saving} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PresensiTimeForm() {
  const { values, setValues, save, saving } = useSettingsForm([
    "presensi_subuh_mulai",
    "presensi_subuh_selesai",
    "presensi_maghrib_mulai",
    "presensi_maghrib_selesai",
  ]);

  const field = (key: string) => ({
    type: "time" as const,
    value: values[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Card className="h-full">
      <FormHeader
        icon={Clock3}
        tone="bg-info-soft text-info"
        title="Waktu Presensi"
        description="Jadwal sesi Subuh & Maghrib (Senin–Jumat)"
      />
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subuh — Mulai">
              <Input {...field("presensi_subuh_mulai")} />
            </Field>
            <Field label="Subuh — Selesai">
              <Input {...field("presensi_subuh_selesai")} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Maghrib — Mulai">
              <Input {...field("presensi_maghrib_mulai")} />
            </Field>
            <Field label="Maghrib — Selesai">
              <Input {...field("presensi_maghrib_selesai")} />
            </Field>
          </div>
          <p className="text-[11.5px] font-medium text-slate-500 mt-3 border-t pt-3">
            Sabtu–Minggu libur. Hari Jumat berlaku sesi khusus (jam diatur terpisah:
            presensi_jumat_mulai / presensi_jumat_selesai).
          </p>
          <SaveButton label="Simpan Waktu Presensi" saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

export function EvaluasiTimeForm() {
  const { values, setValues, save, saving } = useSettingsForm([
    "evaluasi_subuh_mulai",
    "evaluasi_subuh_selesai",
    "evaluasi_maghrib_mulai",
    "evaluasi_maghrib_selesai",
  ]);

  const field = (key: string) => ({
    type: "time" as const,
    value: values[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <Card className="h-full">
      <FormHeader
        icon={ClipboardCheck}
        tone="bg-success-soft text-success"
        title="Waktu Evaluasi"
        description="Jendela waktu input evaluasi harian"
      />
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subuh — Mulai">
              <Input {...field("evaluasi_subuh_mulai")} />
            </Field>
            <Field label="Subuh — Selesai">
              <Input {...field("evaluasi_subuh_selesai")} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Maghrib — Mulai">
              <Input {...field("evaluasi_maghrib_mulai")} />
            </Field>
            <Field label="Maghrib — Selesai">
              <Input {...field("evaluasi_maghrib_selesai")} />
            </Field>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Input evaluasi hanya aktif hari Senin–Kamis. Di luar sesi ini hanya Admin yang
            dapat menginput.
          </p>
          <SaveButton label="Simpan Waktu Evaluasi" saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

export function TasmiLockForm() {
  const { values, setValues, save, saving } = useSettingsForm([
    "tasmi_unlock_periodic",
  ]);

  const isUnlocked = values.tasmi_unlock_periodic === "1";

  return (
    <Card className="h-full">
      <FormHeader
        icon={KeyRound}
        tone="bg-gold-soft text-gold-ink"
        title="Kunci Ujian Tasmi'"
        description="Kontrol akses Ujian Tasmi' 3 Bulanan & 6 Bulanan"
      />
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Akses Di Luar Hari Jumat
            </label>
            <div className="flex items-center justify-between rounded-xl border border-line bg-[#fbfdfc] p-3.5">
              <div className="space-y-0.5">
                <p className="text-[13.5px] font-bold text-ink">
                  Buka Kunci Ujian Periodic (3 & 6 Bulan)
                </p>
                <p className="text-xs text-muted-foreground">
                  Izinkan penginputan Ujian Tasmi&apos; Per 3 Bulan dan Per 6 Bulan pada hari selain Jumat.
                </p>
              </div>
              <Button
                type="button"
                variant={isUnlocked ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setValues((v) => ({
                    ...v,
                    tasmi_unlock_periodic: isUnlocked ? "0" : "1",
                  }))
                }
              >
                {isUnlocked ? "Terbuka (Aktif)" : "Terkunci (Nonaktif)"}
              </Button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            <b>Catatan:</b> Ujian Tasmi&apos; Pekanan tetap hanya dibuka pada hari Jumat. Sakelar ini khusus untuk memberikan kelonggaran penginputan ujian 3 bulanan dan 6 bulanan di luar hari Jumat.
          </p>

          <SaveButton label="Simpan Pengaturan Tasmi'" saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

export function TentangCard() {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => api.settings.get() });

  return (
    <Card className="lg:col-span-2">
      <FormHeader
        icon={Info}
        tone="bg-gold-soft text-gold-ink"
        title="Tentang Pengaturan"
        description={`Ketentuan penyimpanan konfigurasi · ${data?.keys.length ?? 0} key aktif`}
      />
      <CardContent className="grid content-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-2.5">
          <CheckItem ok>
            Disimpan di tabel <b>&nbsp;settings&nbsp;</b> pada database (bukan file
            properties)
          </CheckItem>
          <CheckItem ok>Perubahan langsung berlaku tanpa restart aplikasi</CheckItem>
          <CheckItem ok>Setiap perubahan tercatat pada audit trail</CheckItem>
          <p className="text-xs leading-relaxed font-medium text-muted-foreground">
            Konfigurasi mencakup radius GPS, koordinat pesantren, jadwal presensi
            (Subuh/Maghrib/Jumat), dan jendela waktu evaluasi harian.
          </p>
        </div>
        <div className="space-y-4">
          <Banner tone="warning" icon={CircleAlert}>
            Khusus Admin — perubahan langsung berlaku untuk seluruh user dan dicatat
            pada audit trail.
          </Banner>
          <div className="rounded-xl border border-line bg-[#fbfdfc] px-4 py-3 text-xs leading-relaxed font-medium text-muted-foreground">
            Setiap perubahan pengaturan akan muncul pada menu{" "}
            <b className="text-ink">Backup &amp; Reset → Log Aktivitas</b> sehingga
            dapat diaudit kapan pun.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
