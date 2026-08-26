"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  FilterDate,
  FilterSearch,
} from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/ui/export-button";
import { OverrideForm, PresensiCard } from "./absensi-actions";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import { presensiVariant } from "@/lib/utils";
import { tanggalIndo } from "@/lib/user-utils";

export function AbsensiClient() {
  const { user, isAdmin } = useAuth();
  const [tanggal, setTanggal] = useState("");
  const [sesi, setSesi] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["absensi", "list", { tanggal, sesi, status }],
    queryFn: () =>
      api.absensi.list({
        tanggal: tanggal || undefined,
        sesi: sesi === "" || sesi === "Semua Sesi" ? undefined : sesi,
        status: status === "" || status === "Semua Status" ? undefined : status,
      }),
  });

  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Absensi Ustadz"
        subtitle={`Assalamu'alaikum, ${user?.nama ?? ""} · Presensi kehadiran berbasis GPS & jadwal sesi`}
      />

      <div className="grid items-stretch gap-5 lg:grid-cols-[1.5fr_1fr]">
        <PresensiCard />

        {isAdmin ? (
          <Card className="h-full">
            <CardHeader className="border-b border-line pb-4">
              <CardTitle>Admin Override</CardTitle>
              <CardDescription>Presensi manual untuk ustadz/ustadzah</CardDescription>
              <CardAction>
                <Badge variant="gold">Admin</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <OverrideForm />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b border-line pb-4">
          <CardTitle>Riwayat Presensi</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Seluruh catatan kehadiran ustadz & ustadzah"
              : "Riwayat presensi pribadi Anda"}
          </CardDescription>
          <CardAction>
            <ExportButton
              label="Export"
              message="Riwayat presensi berhasil diekspor"
            />
          </CardAction>
        </CardHeader>
        <FilterBar>
          <FilterDate
            label="Filter tanggal"
            value={tanggal}
            onValueChange={setTanggal}
          />
          <FilterSelect
            label="Filter sesi"
            options={["Semua Sesi", "Subuh", "Maghrib"]}
            onValueChange={setSesi}
          />
          <FilterSelect
            label="Filter status"
            options={["Semua Status", "Hadir", "Izin", "Sakit"]}
            onValueChange={setStatus}
          />
        </FilterBar>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Sesi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jarak</TableHead>
              <TableHead>Validasi</TableHead>
              <TableHead>Keterangan</TableHead>
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
                  Tidak ada catatan presensi
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{tanggalIndo(row.tanggal)}</TableCell>
                  <TableCell>{row.jam}</TableCell>
                  <TableCell>
                    <span className="leading-tight">
                      {row.nama}
                      <span className="block text-[11.5px] font-medium text-muted-foreground">
                        {row.halqah ?? "—"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{row.sesi}</TableCell>
                  <TableCell>
                    <Badge variant={presensiVariant[row.status]}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {row.jarakMeter != null ? `${row.jarakMeter} m` : "—"}
                  </TableCell>
                  <TableCell>
                    {row.lokasiValidasi ? (
                      <Badge variant="success">Valid</Badge>
                    ) : (
                      <span>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.isAdminOverride ? (
                      <Badge variant="gold">Override Admin</Badge>
                    ) : (
                      (row.keterangan ?? "—")
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination info={`Menampilkan ${rows.length} catatan presensi`} />
      </Card>
    </>
  );
}
