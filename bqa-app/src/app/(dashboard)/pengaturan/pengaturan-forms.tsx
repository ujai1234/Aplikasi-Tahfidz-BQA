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
} from "lucide-react";
import { toast } from "sonner";
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

export function GpsForm() {
  const { values, setValues, save, saving } = useSettingsForm([
    "gps_radius_meter",
    "gps_latitude",
    "gps_longitude",
  ]);

  return (
    <Card className="h-full">
      <FormHeader
        icon={MapPin}
        tone="bg-primary-soft text-primary"
        title="GPS & Lokasi Presensi"
        description="Validasi radius & titik koordinat pesantren"
      />
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Field
            label="Radius Presensi (meter)"
            htmlFor="radius"
            required
            hint="Presensi hanya diterima jika jarak dari koordinat pesantren ≤ radius ini."
          >
            <Input
              id="radius"
              type="number"
              min={50}
              max={2000}
              value={values.gps_radius_meter ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, gps_radius_meter: e.target.value }))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Latitude" required>
              <Input
                value={values.gps_latitude ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, gps_latitude: e.target.value }))}
              />
            </Field>
            <Field label="Longitude" required>
              <Input
                value={values.gps_longitude ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, gps_longitude: e.target.value }))}
              />
            </Field>
          </div>
          <SaveButton label="Simpan Pengaturan GPS" saving={saving} />
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
          <p className="text-xs leading-relaxed text-muted-foreground">
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
