"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock3,
  Lock,
  Sparkles,
  Unlock,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PersentaseTargetChart } from "@/components/dashboard/persentase-target-chart";
import { RekapTasmiChart } from "@/components/dashboard/rekap-tasmi-chart";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { capaianVariant } from "@/lib/utils";

function tanggalIndoFormat(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DashboardClient() {
  const { user } = useAuth();
  const todayFormatted = useMemo(() => tanggalIndoFormat(new Date()), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.dashboard(),
  });

  if (isLoading || !data) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <p className="animate-pulse text-sm font-semibold text-muted-foreground">
          Memuat data Dashboard Overview…
        </p>
      </div>
    );
  }

  if (isError) return null;

  const { stats, persentaseCapaian, rekapPredikat, presensiBanner, santriPerluPerhatian } = data;
  const isPresensiOpen = presensiBanner?.open ?? false;

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.nama ? `Assalamu'alaikum, ${user.nama}` : "Monitoring & Evaluasi Tahfidz"}
            {user?.halqah ? ` · ${user.halqah}` : ""}
          </p>
        </div>

        {/* Date Chip */}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
          <Calendar className="size-3.5 text-emerald-600" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Presensi Status Alert Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-2xs transition-all ${
          isPresensiOpen
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
            : "border-rose-200 bg-rose-50/80 text-rose-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isPresensiOpen ? (
            <Unlock className="size-4.5 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="size-4.5 text-rose-600 shrink-0" />
          )}
          <p className="text-[13px] font-semibold">
            {presensiBanner?.message ?? "Presensi kehadiran sesi ustadz."}
          </p>
        </div>

        <Link
          href="/absensi"
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
            isPresensiOpen
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-rose-200/90 text-rose-800 hover:bg-rose-300"
          }`}
        >
          {isPresensiOpen ? (
            <>
              <Unlock className="size-3.5" />
              <span>Presensi Sekarang</span>
            </>
          ) : (
            <>
              <Lock className="size-3.5" />
              <span>Presensi Ditutup</span>
            </>
          )}
        </Link>
      </div>

      {/* 5 Metric Summary Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Santri */}
        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between p-4.5">
            <div className="space-y-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                Total Santri
              </p>
              <p className="font-display text-2xl font-black text-ink">
                {stats.totalSantri}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Tuntas Target */}
        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between p-4.5">
            <div className="space-y-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600">
                Tuntas Target
              </p>
              <p className="font-display text-2xl font-black text-emerald-600">
                {stats.tuntas}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Sedang Process */}
        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between p-4.5">
            <div className="space-y-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600">
                Sedang Process
              </p>
              <p className="font-display text-2xl font-black text-amber-600">
                {stats.sedang}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock3 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Recovery */}
        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between p-4.5">
            <div className="space-y-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-rose-600">
                Recovery
              </p>
              <p className="font-display text-2xl font-black text-rose-600">
                {stats.recovery}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700">
              <AlertTriangle className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Lulus Tasmi' */}
        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between p-4.5">
            <div className="space-y-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600">
                Lulus Tasmi&apos;
              </p>
              <p className="font-display text-2xl font-black text-blue-600">
                {stats.lulusTasmiPercent}%
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <Award className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Two Charts */}
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <PersentaseTargetChart data={persentaseCapaian} />
        <RekapTasmiChart data={rekapPredikat} />
      </div>

      {/* Bottom Table: Santri Perlu Perhatian Khusus */}
      <Card className="overflow-hidden border-line bg-card shadow-2xs">
        <div className="border-b border-line bg-slate-50/50 p-4.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4.5 text-rose-600 shrink-0" />
            <div>
              <h2 className="text-[14.5px] font-bold text-ink">
                Santri Perlu Perhatian Khusus (Sedang / Recovery)
              </h2>
              <p className="text-xs text-muted-foreground">
                Daftar santri yang belum tuntas target kurikulum
              </p>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <TableHead className="py-3">Nama Santri</TableHead>
              <TableHead className="py-3">Halqah</TableHead>
              <TableHead className="py-3">Status</TableHead>
              <TableHead className="py-3">Penyebab Kendala</TableHead>
              <TableHead className="py-3">Catatan Pembimbing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {santriPerluPerhatian.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm font-semibold text-slate-500">
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="size-4 text-emerald-500" />
                    Semua santri tuntas target 🎉
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              santriPerluPerhatian.map((santri) => (
                <TableRow key={santri.nis} className="text-[13px] hover:bg-slate-50/60">
                  <TableCell className="font-bold text-ink">
                    {santri.nama}
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      NIS: {santri.nis} · Tingkat {santri.tingkat}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">{santri.halqah}</TableCell>
                  <TableCell>
                    <Badge variant={capaianVariant[santri.status] ?? "neutral"}>
                      {santri.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 max-w-xs">{santri.kendala || "-"}</TableCell>
                  <TableCell className="text-slate-600 max-w-xs">{santri.catatan || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
