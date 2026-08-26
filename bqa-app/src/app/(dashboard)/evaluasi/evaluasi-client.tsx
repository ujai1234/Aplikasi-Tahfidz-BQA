"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";
import { Banner } from "@/components/ui/banner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Ornament } from "@/components/ui/ornament";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkMore } from "@/components/ui/link-more";
import { EvaluasiForm } from "./evaluasi-form";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { capaianVariant } from "@/lib/utils";
import { tanggalIndo } from "@/lib/user-utils";

const TARGET_KURIKULUM = [
  { tingkat: 1, nama: "Juz 'Amma", detail: "Juz 30 · 37 surat pendek", target: "Juz 30" },
  { tingkat: 2, nama: "Juz Tabarak", detail: "Juz 29 · 39 surat", target: "Juz 29" },
  { tingkat: 3, nama: "Juz Qad Sami'a", detail: "Juz 28 · 9 surat", target: "Juz 28" },
  { tingkat: 4, nama: "Juz Lanjutan", detail: "Juz 27 · Adz-Dzariyat", target: "Juz 27" },
  { tingkat: 5, nama: "Juz Lanjutan", detail: "Juz 26 · Al-Ahqaf", target: "Juz 26" },
  { tingkat: 6, nama: "Juz Lanjutan", detail: "Juz 25 · Fussilat", target: "Juz 25" },
];

function evaluasiWindowOpen(
  sesi: "Subuh" | "Maghrib",
  settings: Record<string, string>
): boolean {
  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60_000);
  const day = now.getUTCDay();
  const time = `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes()
  ).padStart(2, "0")}`;
  if (day === 0 || day === 5 || day === 6) return false;
  const mulai = settings[`evaluasi_${sesi.toLowerCase()}_mulai`];
  const selesai = settings[`evaluasi_${sesi.toLowerCase()}_selesai`];
  if (!mulai || !selesai) return false;
  return time >= mulai && time <= selesai;
}

export function EvaluasiClient() {
  const { user, isAdmin, isKepsek } = useAuth();
  const [limit, setLimit] = useState(5);

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.settings.get(),
  });
  const settings = settingsData?.settings ?? {};

  const { data, isLoading } = useQuery({
    queryKey: ["evaluasi", { limit }],
    queryFn: () => api.evaluasi.list({ limit }),
  });

  const rows = data?.data ?? [];
  const subuhOpen = evaluasiWindowOpen("Subuh", settings);
  const maghribOpen = evaluasiWindowOpen("Maghrib", settings);

  return (
    <>
      <PageHeader
        title="Evaluasi Harian"
        subtitle={`Assalamu'alaikum, ${user?.nama ?? ""} · Input evaluasi hafalan santri halqah Anda`}
      />

      <Banner tone="info" icon={Clock}>
        <b>Validasi waktu aktif.</b> Evaluasi hanya dapat diinput pada sesi{" "}
        <b>
          Subuh {settings.evaluasi_subuh_mulai ?? "05:00"}–
          {settings.evaluasi_subuh_selesai ?? "07:00"}
        </b>{" "}
        atau{" "}
        <b>
          Maghrib {settings.evaluasi_maghrib_mulai ?? "18:30"}–
          {settings.evaluasi_maghrib_selesai ?? "20:30"}
        </b>
        , hari Senin–Kamis.{" "}
        <Badge variant={subuhOpen ? "success" : "neutral"} className="mx-1">
          {subuhOpen && <LiveDot />} Subuh: {subuhOpen ? "Dibuka" : "Ditutup"}
        </Badge>
        <Badge variant={maghribOpen ? "success" : "neutral"} className="mx-1">
          {maghribOpen && <LiveDot />} Maghrib: {maghribOpen ? "Dibuka" : "Ditutup"}
        </Badge>
        {isAdmin && (
          <Badge variant="gold" className="mx-1">
            Admin bebas waktu
          </Badge>
        )}
      </Banner>

      {!isKepsek ? (
        <div className="grid items-stretch gap-5 lg:grid-cols-[1.5fr_1fr]">
          <EvaluasiForm />

          <Card className="h-full">
            <CardHeader className="border-b border-line pb-4">
              <CardTitle>Target Kurikulum</CardTitle>
              <CardDescription>Target hafalan per tingkatan</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-[13px]">
                {TARGET_KURIKULUM.map((item) => (
                  <li key={item.tingkat} className="flex items-center gap-3">
                    <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary-soft font-display text-[12.5px] font-extrabold text-primary-dark">
                      {item.tingkat}
                    </span>
                    <span>
                      {item.nama}
                      <span className="block text-[11.5px] text-muted-foreground">{item.detail}</span>
                    </span>
                    <b className="ml-auto font-extrabold whitespace-nowrap">{item.target}</b>
                  </li>
                ))}
              </ul>
              <Ornament className="my-5" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Target ditampilkan otomatis oleh sistem berdasarkan tingkatan santri yang
                dipilih pada form evaluasi.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="gap-4 pb-0">
        <CardHeader className="border-b border-line pb-4">
          <CardTitle>Evaluasi Terbaru{user?.halqah ? ` — Halqah ${user.halqah}` : ""}</CardTitle>
          <CardDescription>Catatan evaluasi terakhir yang diinput</CardDescription>
          <CardAction>
            <LinkMore href="/data-santri">Lihat semua</LinkMore>
          </CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Santri</TableHead>
              <TableHead>Sesi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Input Oleh</TableHead>
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
                  Belum ada catatan evaluasi
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{tanggalIndo(row.tanggal)}</TableCell>
                  <TableCell>{row.namaSantri}</TableCell>
                  <TableCell>{row.sesi}</TableCell>
                  <TableCell>
                    <Badge variant={capaianVariant[row.statusCapaian]}>
                      {row.statusCapaian}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.catatan ?? "—"}</TableCell>
                  <TableCell>{row.createdBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
