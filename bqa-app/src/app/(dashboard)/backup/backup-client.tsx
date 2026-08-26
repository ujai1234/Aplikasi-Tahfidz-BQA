"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, HardDriveDownload, ShieldCheck, TriangleAlert } from "lucide-react";
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
import { BackupButtons, ResetPanel } from "./backup-actions";
import { api } from "@/lib/api";

export function BackupClient() {
  const [limit] = useState(8);

  const { data, isLoading } = useQuery({
    queryKey: ["backup", "logs", limit],
    queryFn: () => api.backup.logs(),
    refetchInterval: 30_000,
  });

  const rows = data?.data.slice(0, limit) ?? [];

  return (
    <>
      <PageHeader
        title="Backup & Reset"
        subtitle="Backup data sistem & reset data (admin only)"
      />

      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="border-b border-line pb-4">
            <div className="col-start-1 row-span-2 flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <HardDriveDownload className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <CardTitle>Backup Data</CardTitle>
                <CardDescription>
                  Ekspor seluruh data santri, tasmi&apos;, presensi &amp; pengaturan
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <Badge variant="success">
                <ShieldCheck className="size-3.5" />
                Aman
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid content-start gap-4">
            <p className="text-xs leading-relaxed font-medium text-muted-foreground">
              Backup mencakup tabel <b className="text-ink">master_santri</b>,{" "}
              <b className="text-ink">data_santri</b>,{" "}
              <b className="text-ink">absensi_ustadz</b>,{" "}
              <b className="text-ink">data_tasmi</b>, dan{" "}
              <b className="text-ink">settings</b>. Password user tidak ikut diekspor
              demi keamanan.
            </p>
            <BackupButtons />
          </CardContent>
        </Card>

        <Card className="h-full border-danger/30">
          <CardHeader className="border-b border-line pb-4">
            <div className="col-start-1 row-span-2 flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger">
                <TriangleAlert className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <CardTitle>Reset Data</CardTitle>
                <CardDescription>
                  Hapus seluruh data operasional — permanen
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <Badge variant="danger">Bahaya</Badge>
            </CardAction>
          </CardHeader>
          <ResetPanel />
        </Card>
      </div>

      <Card className="gap-4 pb-0">
        <CardHeader className="border-b border-line pb-4">
          <div className="col-start-1 row-span-2 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-soft text-purple">
              <History className="size-5" strokeWidth={1.9} />
            </span>
            <div>
              <CardTitle>Log Aktivitas Terbaru</CardTitle>
              <CardDescription>Audit trail — siapa melakukan apa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aktivitas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Memuat…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Belum ada log aktivitas
                </TableCell>
              </TableRow>
            ) : (
              rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{log.createdAt}</TableCell>
                  <TableCell className="font-semibold">{log.username}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-ink">{log.action}</span>
                    {log.detail ? (
                      <span className="block text-[11.5px] font-medium text-muted-foreground">
                        {log.detail}
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <p className="px-(--card-spacing) pb-4 text-[11.5px] font-medium text-muted-foreground">
          Menampilkan {rows.length} aktivitas terbaru dari total {data?.total ?? 0} log.
        </p>
      </Card>
    </>
  );
}
