"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle2, Percent, Star, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ornament } from "@/components/ui/ornament";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  FilterBar,
  FilterSearch,
} from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/ui/export-button";
import { TasmiForm, getPredikat } from "./tasmi-form";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { tanggalIndo } from "@/lib/user-utils";

const PREDIKAT_LIST = [
  getPredikat(95),
  getPredikat(85),
  getPredikat(75),
  getPredikat(50),
];

const HALQAH_OPTIONS = [
  "Al-Fatih",
  "Al-Baqarah",
  "An-Nahl",
  "Maryam",
  "Yasin",
  "Thaha",
];

function MiniStat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Award;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm" className="animate-fade-up transition-all hover:-translate-y-0.5 hover:shadow-card">
      <CardContent className="flex items-center gap-3.5">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-[18px]" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight font-extrabold text-ink">{value}</p>
          <p className="truncate text-[11.5px] font-bold text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TasmiClient() {
  const { user } = useAuth();
  const [halqah, setHalqah] = useState("");
  const [jenis, setJenis] = useState("");
  const [kelulusan, setKelulusan] = useState("");
  const [q, setQ] = useState("");

  const JENIS_FILTER: Record<string, string> = {
    "Pekanan (Jumat)": "Pekanan",
    "Per 3 Bulan": "Per 3 Bulan",
    "Per 6 Bulan": "Per 6 Bulan",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["tasmi", { halqah, jenis, kelulusan, q }],
    queryFn: () =>
      api.tasmi.list({
        halqah: halqah === "" || halqah === "Semua Halqah" ? undefined : halqah,
        jenis: jenis === "" || jenis === "Semua Jenis" ? undefined : (JENIS_FILTER[jenis] ?? jenis),
        kelulusan:
          kelulusan === "" || kelulusan === "Semua Kelulusan" ? undefined : kelulusan,
        q: q || undefined,
      }),
  });

  const rows = data?.data ?? [];
  const mumtaz = rows.filter((r) => r.predikat === "Mumtaz").length;

  return (
    <>
      <PageHeader
        title="Ujian Tasmi'"
        subtitle={`Assalamu'alaikum, ${user?.nama ?? ""} · Input nilai & rekapitulasi ujian hafalan`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          icon={Award}
          tone="bg-primary-soft text-primary"
          label="Total Ujian"
          value={String(data?.total ?? 0)}
        />
        <MiniStat
          icon={CheckCircle2}
          tone="bg-success-soft text-success"
          label={`Lulus · ${data?.persenLulus ?? 0}%`}
          value={String(data?.lulus ?? 0)}
        />
        <MiniStat
          icon={TrendingUp}
          tone="bg-info-soft text-info"
          label="Rata-rata Nilai"
          value={String(data?.rataRata ?? 0)}
        />
        <MiniStat
          icon={Star}
          tone="bg-gold-soft text-gold-ink"
          label="Predikat Mumtaz"
          value={String(mumtaz)}
        />
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-[1.5fr_1fr]">
        <TasmiForm />

        <Card className="h-full">
          <CardHeader className="border-b border-line pb-4">
            <CardTitle>Ketentuan Predikat</CardTitle>
            <CardDescription>Penentuan otomatis berdasarkan nilai</CardDescription>
            <CardAction>
              <Percent className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-[13px]">
              {PREDIKAT_LIST.map((predikat) => (
                <li key={predikat.nama} className="flex items-center gap-2.5">
                  <span className="w-16 shrink-0 font-display font-extrabold text-primary-dark">
                    {predikat.range}
                  </span>
                  {predikat.nama}
                  <Badge variant={predikat.lulus ? "success" : "danger"}>
                    {predikat.lulus ? "Lulus" : "Tidak Lulus"}
                  </Badge>
                  <span className="font-arabic ml-auto text-[15px] text-muted-foreground">
                    {predikat.arab}
                  </span>
                </li>
              ))}
            </ul>
            <Ornament className="my-5" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <b>KKM 70</b> — santri dengan nilai ≥ 70 dinyatakan <b>LULUS</b> pada
              tahapan tasmi&apos; yang diikuti. Rekapitulasi dapat difilter per
              santri/halqah dan dicetak melalui menu Laporan.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b border-line pb-4">
          <CardTitle>Rekapitulasi Tasmi&apos;</CardTitle>
          <CardDescription>Seluruh hasil ujian tasmi&apos; santri</CardDescription>
          <CardAction className="flex flex-wrap gap-2.5">
            <ExportButton label="Cetak" message="Rekap tasmi' dikirim ke printer" />
            <ExportButton label="Export" message="Rekap tasmi' berhasil diekspor" />
          </CardAction>
        </CardHeader>
        <FilterBar>
          <FilterSelect
            label="Filter halqah"
            options={["Semua Halqah", ...HALQAH_OPTIONS]}
            onValueChange={setHalqah}
          />
          <FilterSelect
            label="Filter jenis tasmi"
            options={["Semua Jenis", "Pekanan (Jumat)", "Per 3 Bulan", "Per 6 Bulan"]}
            onValueChange={setJenis}
          />
          <FilterSelect
            label="Filter kelulusan"
            options={["Semua Kelulusan", "Lulus", "Tidak Lulus"]}
            onValueChange={setKelulusan}
          />
          <FilterSearch
            placeholder="Cari nama santri…"
            label="Cari rekap tasmi"
            onValueChange={setQ}
          />
        </FilterBar>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Santri</TableHead>
              <TableHead>Halqah</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Nilai</TableHead>
              <TableHead>Predikat</TableHead>
              <TableHead>Kelulusan</TableHead>
              <TableHead>Penguji</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Memuat…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Tidak ada hasil ujian tasmi&apos;
                </TableCell>
              </TableRow>
            ) : (
              rows.map((record) => {
                const predikat = getPredikat(record.nilai);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{tanggalIndo(record.tanggal)}</TableCell>
                    <TableCell>
                      {record.namaSantri}
                      <span className="block text-[11.5px] font-medium text-muted-foreground">
                        Tingkat {record.tingkatan}
                      </span>
                    </TableCell>
                    <TableCell>{record.halqah}</TableCell>
                    <TableCell>{record.jenisTasmi}</TableCell>
                    <TableCell>
                      <b>{record.nilai}</b>
                    </TableCell>
                    <TableCell>
                      <Badge variant={predikat.lulus ? "success" : "danger"}>
                        {record.predikat}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.statusKelulusan === "Lulus" ? "success" : "danger"}>
                        {record.statusKelulusan}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.penguji ?? record.createdBy}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Pagination info={`Menampilkan ${rows.length} dari ${data?.total ?? 0} hasil ujian`} />
      </Card>
    </>
  );
}
