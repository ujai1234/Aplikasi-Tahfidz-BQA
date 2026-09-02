import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pills } from "@/components/ui/pills";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";

export function getPredikat(nilai: number): {
  range: string;
  nama: string;
  lulus: boolean;
  arab: string;
} {
  if (nilai >= 90)
    return { range: "90–100", nama: "Mumtaz", lulus: true, arab: "ممتاز" };
  if (nilai >= 80)
    return { range: "80–89", nama: "Jayyid Jiddan", lulus: true, arab: "جيد جداً" };
  if (nilai >= 70)
    return { range: "70–79", nama: "Jayyid", lulus: true, arab: "جيد" };
  return { range: "< 70", nama: "Rasib", lulus: false, arab: "راسب" };
}

const JENIS_MAP: Record<string, string> = {
  "Pekanan (Jumat)": "Pekanan",
  "Per 3 Bulan": "Per 3 Bulan",
  "Per 6 Bulan (Semester)": "Per 6 Bulan",
};

export function TasmiForm() {
  const { user } = useAuth();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const queryClient = useQueryClient();
  const [nilai, setNilai] = useState(88);
  const [santriId, setSantriId] = useState("");
  const [jenisTasmiOption, setJenisTasmiOption] = useState("Pekanan (Jumat)");
  const predikat = getPredikat(Number.isFinite(nilai) ? nilai : 0);

  const { data: santriData } = useQuery({
    queryKey: ["santri", "for-tasmi"],
    queryFn: () => api.santri.list({ status: "Aktif" }),
  });
  const santriRows = santriData?.data ?? [];
  const selectedSantri = santriRows.find((s) => String(s.id) === santriId);

  const { data: statusData } = useQuery({
    queryKey: ["tasmi", "status"],
    queryFn: () => api.tasmi.status(),
  });

  const selectedJenisKey = JENIS_MAP[jenisTasmiOption] ?? "Pekanan";
  const currentLockStatus =
    selectedJenisKey === "Per 3 Bulan"
      ? statusData?.per3Bulan
      : selectedJenisKey === "Per 6 Bulan"
      ? statusData?.per6Bulan
      : statusData?.pekanan;

  const isLocked = currentLockStatus ? !currentLockStatus.open : false;

  const mutation = useMutation({
    mutationFn: (values: { jenisTasmi: string; penguji: string; catatan: string }) =>
      api.tasmi.create({
        santriId: Number(santriId),
        jenisTasmi: values.jenisTasmi,
        nilai,
        penguji: values.penguji || null,
        catatan: values.catatan || null,
      }),
    onSuccess: (res) => {
      toast.success(
        `Nilai tasmi' ${res.tasmi.namaSantri}: ${res.tasmi.nilai} (${res.tasmi.predikat}) tersimpan`
      );
      queryClient.invalidateQueries({ queryKey: ["tasmi"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSantriId("");
      setNilai(88);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Input Nilai Tasmi&apos;</span>
          {statusData && (
            <Badge variant={statusData.isFriday ? "success" : isLocked ? "danger" : "info"}>
              {statusData.isFriday ? (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3" /> Hari Jumat (Sesi Tasmi Terbuka)
                </span>
              ) : isLocked ? (
                <span className="flex items-center gap-1">
                  <Lock className="size-3" /> Dikunci
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Unlock className="size-3" /> Kunci Terbuka
                </span>
              )}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Nilai 0–100 · predikat &amp; kelulusan ditentukan otomatis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusData && !statusData.isFriday && (
          <Banner
            tone={isLocked ? "warning" : "info"}
            icon={isLocked ? AlertCircle : Unlock}
          >
            {isLocked ? (
              <span>
                <b>Sesi Ujian Dikunci: </b>
                {currentLockStatus?.reason ??
                  "Input Ujian Tasmi' hanya diizinkan pada hari Jumat."}
              </span>
            ) : (
              <span>
                <b>Akses Diizinkan: </b>
                {user?.role === "Admin"
                  ? "Anda dapat menginput Ujian Tasmi' dengan hak akses Admin (Admin Bypass)."
                  : "Ujian Tasmi' Per 3 & 6 Bulan dibuka untuk umum oleh Admin melalui Pengaturan."}
              </span>
            )}
          </Banner>
        )}

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!santriId) {
              toast.warning("Pilih santri terlebih dahulu");
              return;
            }
            if (isLocked) {
              toast.error(currentLockStatus?.reason ?? "Input Ujian Tasmi' sedang dikunci.");
              return;
            }
            const f = new FormData(event.currentTarget);
            mutation.mutate({
              jenisTasmi: selectedJenisKey,
              penguji: String(f.get("penguji") ?? ""),
              catatan: String(f.get("catatan") ?? ""),
            });
          }}
        >
          <Field label="Tanggal Ujian">
            <Input type="date" value={today} readOnly />
          </Field>
          <Field label="Nama Santri" required>
            <Select value={santriId} onValueChange={setSantriId}>
              <SelectTrigger id="santri-tasmi">
                <SelectValue placeholder="Pilih santri…" />
              </SelectTrigger>
              <SelectContent position="popper">
                {santriRows.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nama} — NIS {s.nis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Halqah (otomatis)">
            <Input readOnly value={selectedSantri?.halqah ?? "—"} />
          </Field>
          <Field label="Tingkatan (otomatis)">
            <Input
              readOnly
              value={selectedSantri ? `Tingkat ${selectedSantri.tingkatan}` : "—"}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Jenis Tasmi'" required>
              <Pills
                name="jenisTasmi"
                options={["Pekanan (Jumat)", "Per 3 Bulan", "Per 6 Bulan (Semester)"]}
                value={jenisTasmiOption}
                onChange={setJenisTasmiOption}
              />
            </Field>
          </div>
          <Field
            label="Nilai (0–100)"
            required
            hint={
              <span className="flex flex-wrap items-center gap-1.5">
                Predikat otomatis:
                <Badge variant={predikat.lulus ? "success" : "danger"}>
                  {predikat.nama}
                </Badge>
                <Badge variant={predikat.lulus ? "success" : "danger"}>
                  {predikat.lulus ? "Lulus" : "Tidak Lulus"}
                </Badge>
              </span>
            }
          >
            <Input
              type="number"
              min={0}
              max={100}
              value={nilai}
              onChange={(event) => setNilai(Number(event.target.value))}
              disabled={isLocked}
            />
          </Field>
          <Field label="Penguji">
            <Input name="penguji" placeholder="Nama penguji (opsional)" disabled={isLocked} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Catatan Penguji" htmlFor="catatan-tasmi">
              <textarea
                id="catatan-tasmi"
                name="catatan"
                rows={3}
                disabled={isLocked}
                placeholder="Catatan hasil ujian tasmi'…"
                className="flex min-h-20 w-full rounded-xl border border-line bg-[#fbfdfc] px-3.5 py-2.5 text-[13.5px] text-ink transition-[color,box-shadow] outline-none placeholder:text-[#77877c] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2.5 sm:col-span-2">
            <Button
              type="reset"
              variant="outline"
              onClick={() => {
                setNilai(88);
                setSantriId("");
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending || isLocked}>
              {mutation.isPending ? "Menyimpan…" : isLocked ? "Ujian Dikunci" : "Simpan Nilai Tasmi'"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
