"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { api, errorMessage, type CapaianStatus, type Sesi } from "@/lib/api";

interface EvaluasiFormValues {
  penyebab: string;
  catatan: string;
}

export function EvaluasiForm() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [santriId, setSantriId] = useState("");
  const [sesi, setSesi] = useState<Sesi>("Maghrib");
  const [statusCapaian, setStatusCapaian] =
    useState<CapaianStatus>("Tuntas");

  const { data: santriData } = useQuery({
    queryKey: ["santri", "for-evaluasi"],
    queryFn: () => api.santri.list({ status: "Aktif" }),
  });
  const santriRows = santriData?.data ?? [];
  const selectedSantri = santriRows.find((s) => String(s.id) === santriId);

  const mutation = useMutation({
    mutationFn: (values: EvaluasiFormValues) =>
      api.evaluasi.create({
        santriId: Number(santriId),
        sesi,
        statusCapaian,
        penyebab:
          statusCapaian === "Tuntas" ? null : values.penyebab || null,
        catatan: values.catatan || null,
      }),
    onSuccess: (res) => {
      toast.success(`Evaluasi ${res.evaluasi.namaSantri} berhasil disimpan`);
      queryClient.invalidateQueries({ queryKey: ["evaluasi"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSantriId("");
      setStatusCapaian("Tuntas");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Evaluasi Harian</CardTitle>
        <CardDescription>
          Halqah {user?.halqah ?? "-"} ·{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!santriId) {
              toast.warning("Pilih santri terlebih dahulu");
              return;
            }
            const f = new FormData(event.currentTarget);
            mutation.mutate({
              penyebab: String(f.get("penyebab") ?? ""),
              catatan: String(f.get("catatan") ?? ""),
            });
          }}
        >
          <Field label="Tanggal">
            <Input type="date" value={today} readOnly />
          </Field>
          <Field label="Sesi" required>
            <Select value={sesi} onValueChange={(v) => setSesi(v as Sesi)}>
              <SelectTrigger id="sesi-evaluasi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="Subuh">Subuh</SelectItem>
                <SelectItem value="Maghrib">Maghrib</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Nama Santri"
              required
              hint="Daftar hanya memuat santri aktif pada halqah Anda."
            >
              <Select value={santriId} onValueChange={setSantriId}>
                <SelectTrigger id="santri-evaluasi">
                  <SelectValue placeholder="Pilih santri…" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {santriRows.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Tidak ada santri tersedia
                    </div>
                  ) : (
                    santriRows.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nama} — NIS {s.nis}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Status Capaian" required>
            <Select
              value={statusCapaian}
              onValueChange={(v) => setStatusCapaian(v as CapaianStatus)}
            >
              <SelectTrigger id="capaian-evaluasi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="Tuntas">Tuntas</SelectItem>
                <SelectItem value="Sedang">Sedang</SelectItem>
                <SelectItem value="Recovery">Recovery</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Penyebab Kendala">
            <Select name="penyebab" defaultValue="">
              <SelectTrigger id="kendala-evaluasi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="">Tidak ada</SelectItem>
                <SelectItem value="Hafalan terbata-bata">Hafalan terbata-bata</SelectItem>
                <SelectItem value="Kurang fokus saat setoran">
                  Kurang fokus saat setoran
                </SelectItem>
                <SelectItem value="Sering izin tidak masuk">
                  Sering izin tidak masuk
                </SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tingkatan (otomatis)">
            <Input
              readOnly
              value={selectedSantri ? `Tingkat ${selectedSantri.tingkatan}` : "—"}
            />
          </Field>
          <Field label="Halqah (otomatis)">
            <Input readOnly value={selectedSantri?.halqah ?? "—"} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Catatan" htmlFor="catatan-evaluasi">
              <textarea
                id="catatan-evaluasi"
                name="catatan"
                rows={3}
                placeholder="Catatan perkembangan setoran hari ini…"
                className="flex min-h-20 w-full rounded-xl border border-line bg-[#fbfdfc] px-3.5 py-2.5 text-[13.5px] text-ink transition-[color,box-shadow] outline-none placeholder:text-[#77877c] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
              />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2.5 sm:col-span-2">
            <Button type="reset" variant="outline" onClick={() => setSantriId("")}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan…" : "Simpan Evaluasi"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
