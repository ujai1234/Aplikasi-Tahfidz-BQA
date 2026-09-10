"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { UserCell } from "@/components/ui/user-cell";
import {
  FilterBar,
  FilterDate,
  FilterSearch,
} from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/ui/export-button";
import { useAuth } from "@/components/providers/auth-provider";
import { AddSantriButton, HALQAH_OPTIONS, SantriRowActions } from "./santri-dialogs";
import { api } from "@/lib/api";
import { capaianVariant, initialsOf } from "@/lib/utils";
import { tanggalIndo } from "@/lib/user-utils";

const TINGKATAN_FILTER = [
  "Semua Tingkatan",
  "Tingkat 1",
  "Tingkat 2",
  "Tingkat 3",
  "Tingkat 4",
  "Tingkat 5",
  "Tingkat 6",
];

function MasterPanel() {
  const { user } = useAuth();
  const isUstadz = user?.role === "Ustadz" || user?.role === "Ustadzah";
  
  const [q, setQ] = useState("");
  const [halqah, setHalqah] = useState("");
  const [tingkatan, setTingkatan] = useState("");
  const [status, setStatus] = useState("");

  const activeHalqah = isUstadz ? (user?.halqah || undefined) : (halqah === "" || halqah === "Semua Halqah" ? undefined : halqah);
  const activeTingkatan = isUstadz ? undefined : (tingkatan.startsWith("Tingkat ") ? Number(tingkatan.replace("Tingkat ", "")) : undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["santri", { q, halqah: activeHalqah, tingkatan: activeTingkatan, status }],
    queryFn: () =>
      api.santri.list({
        q: q || undefined,
        halqah: activeHalqah,
        tingkatan: activeTingkatan,
        status: status === "" || status === "Semua Status" ? undefined : (status as "Aktif" | "Tidak Aktif"),
      }),
  });

  const rows = data?.data ?? [];

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b border-line pb-4">
        <CardTitle>Master Santri</CardTitle>
        <CardDescription>
          Daftar unik santri — NIS, halqah, tingkatan &amp; status
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2.5">
          <ExportButton
            label="Export"
            message="Master santri berhasil diekspor"
          />
          <AddSantriButton />
        </CardAction>
      </CardHeader>
      <FilterBar>
        <FilterSearch
          placeholder="Cari NIS / nama santri…"
          label="Cari santri"
          onValueChange={setQ}
        />
        {!isUstadz && (
          <FilterSelect
            label="Filter halqah"
            options={["Semua Halqah", ...HALQAH_OPTIONS]}
            onValueChange={setHalqah}
          />
        )}
        {!isUstadz && (
          <FilterSelect
            label="Filter tingkatan"
            options={TINGKATAN_FILTER}
            onValueChange={setTingkatan}
          />
        )}
        <FilterSelect
          label="Filter status"
          options={["Semua Status", "Aktif", "Tidak Aktif"]}
          onValueChange={setStatus}
        />
      </FilterBar>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>NIS</TableHead>
            <TableHead>Santri</TableHead>
            <TableHead>Halqah</TableHead>
            <TableHead>Tingkatan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Memuat…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Tidak ada santri yang cocok dengan filter
              </TableCell>
            </TableRow>
          ) : (
            rows.map((santri) => (
              <TableRow key={santri.id}>
                <TableCell>{santri.nis}</TableCell>
                <TableCell>
                  <UserCell
                    initials={initialsOf(santri.nama)}
                    name={santri.nama}
                    sub={santri.jenisKelamin}
                  />
                </TableCell>
                <TableCell>{santri.halqah}</TableCell>
                <TableCell>{santri.tingkatan}</TableCell>
                <TableCell>
                  <Badge variant={santri.statusAktif ? "success" : "neutral"}>
                    {santri.statusAktif ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <SantriRowActions santri={santri} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination info={`Menampilkan ${rows.length} dari ${data?.total ?? 0} santri`} />
    </Card>
  );
}

function RiwayatPanel() {
  const { user } = useAuth();
  const isUstadz = user?.role === "Ustadz" || user?.role === "Ustadzah";

  const [tanggal, setTanggal] = useState("");
  const [halqah, setHalqah] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const activeHalqah = isUstadz ? (user?.halqah || undefined) : (halqah === "" || halqah === "Semua Halqah" ? undefined : halqah);

  const { data, isLoading } = useQuery({
    queryKey: ["evaluasi", { tanggal, halqah: activeHalqah, status, q }],
    queryFn: () =>
      api.evaluasi.list({
        tanggal: tanggal || undefined,
        halqah: activeHalqah,
        status: status === "" || status === "Semua Status" ? undefined : status,
        q: q || undefined,
      }),
  });

  const rows = data?.data ?? [];

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b border-line pb-4">
        <CardTitle>Riwayat Evaluasi</CardTitle>
        <CardDescription>Hasil setoran &amp; capaian harian seluruh santri</CardDescription>
        <CardAction>
          <ExportButton label="Export" message="Riwayat evaluasi berhasil diekspor" />
        </CardAction>
      </CardHeader>
      <FilterBar>
        <FilterDate
          label="Filter tanggal"
          value={tanggal}
          onValueChange={setTanggal}
        />
        {!isUstadz && (
          <FilterSelect
            label="Filter halqah"
            options={["Semua Halqah", ...HALQAH_OPTIONS]}
            onValueChange={setHalqah}
          />
        )}
        <FilterSelect
          label="Filter status capaian"
          options={["Semua Status", "Tuntas", "Sedang", "Recovery"]}
          onValueChange={setStatus}
        />
        <FilterSearch
          placeholder="Cari nama santri…"
          label="Cari riwayat evaluasi"
          onValueChange={setQ}
        />
      </FilterBar>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Santri</TableHead>
            <TableHead>Sesi</TableHead>
            <TableHead>Status Capaian</TableHead>
            <TableHead>Penyebab Kendala</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Input Oleh</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Memuat…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Tidak ada catatan evaluasi yang cocok dengan filter
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{tanggalIndo(row.tanggal)}</TableCell>
                <TableCell>
                  {row.namaSantri}
                  <span className="block text-[11.5px] font-medium text-muted-foreground">
                    Tingkat {row.tingkatan} · {row.jalur}
                  </span>
                </TableCell>
                <TableCell>{row.sesi}</TableCell>
                <TableCell>
                  <Badge variant={capaianVariant[row.statusCapaian]}>
                    {row.statusCapaian}
                  </Badge>
                </TableCell>
                <TableCell>{row.penyebab ?? "—"}</TableCell>
                <TableCell>{row.targetJuz ?? "—"}</TableCell>
                <TableCell>{row.createdBy}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination
        info={`Menampilkan ${rows.length} dari ${data?.total ?? 0} catatan evaluasi`}
      />
    </Card>
  );
}

export function DataSantriClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (
    <>
      <PageHeader
        title="Data Santri"
        subtitle={`Assalamu'alaikum, ${user?.nama ?? ""} · Master santri & riwayat evaluasi hafalan`}
      />
      <Tabs
        defaultValue="master"
        onValueChange={() => queryClient.invalidateQueries({ queryKey: ["evaluasi"] })}
      >
        <TabsList>
          <TabsTrigger value="master">Master Santri</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Evaluasi</TabsTrigger>
        </TabsList>
        <TabsContent value="master">
          <MasterPanel />
        </TabsContent>
        <TabsContent value="riwayat">
          <RiwayatPanel />
        </TabsContent>
      </Tabs>
    </>
  );
}
