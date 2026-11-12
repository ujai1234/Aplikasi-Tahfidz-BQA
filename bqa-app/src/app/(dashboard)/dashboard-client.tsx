"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkMore } from "@/components/ui/link-more";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCell } from "@/components/ui/user-cell";
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
import { api, type DashboardData } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { capaianVariant, initialsOf, presensiVariant } from "@/lib/utils";
import { tanggalIndo } from "@/lib/user-utils";

function tanggalIndoFormat(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type PresensiRow = DashboardData["presensiTerbaru"][number];

function PresensiRowsTable({
  rows,
  showDate,
  emptyMessage,
}: {
  rows: PresensiRow[];
  showDate: boolean;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm font-medium text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ustadz / Halqah</TableHead>
          <TableHead>{showDate ? "Tanggal & Jam" : "Jam"}</TableHead>
          <TableHead>Sesi</TableHead>
          <TableHead>Validasi / Keterangan</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={row.id ?? `${row.tanggal}-${row.jam}-${row.nama}-${idx}`}>
            <TableCell>
              <UserCell
                initials={initialsOf(row.nama)}
                name={row.nama}
                sub={row.halqah}
              />
            </TableCell>
            <TableCell className="tabular-nums text-[13px] font-medium text-ink">
              {showDate ? (
                <span>
                  {tanggalIndo(row.tanggal)} ·{" "}
                  <span className="text-muted-foreground">{row.jam} WIB</span>
                </span>
              ) : (
                <span>{row.jam} WIB</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{row.sesi}</Badge>
            </TableCell>
            <TableCell className="text-[12.5px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-1.5">
                {row.isAdminOverride && (
                  <Badge variant="gold">Override Admin</Badge>
                )}
                {row.jarak && row.jarak !== "—" && (
                  <span className="tabular-nums font-medium text-ink">
                    {row.jarak}
                  </span>
                )}
                {row.lokasiValidasi === true && (
                  <Badge variant="success">GPS Valid</Badge>
                )}
                {row.lokasiValidasi === false && !row.isAdminOverride && (
                  <Badge variant="outline">Luar Radius</Badge>
                )}
                {row.keterangan && (
                  <span className="text-xs text-slate-600">{row.keterangan}</span>
                )}
                {!row.isAdminOverride &&
                  (!row.jarak || row.jarak === "—") &&
                  row.lokasiValidasi == null &&
                  !row.keterangan && <span>—</span>}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={presensiVariant[row.status] ?? "neutral"}>
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DashboardClient() {
  const { user, isAdmin, isKepsek } = useAuth();
  const isSupervisor = isAdmin || isKepsek;
  const todayFormatted = useMemo(() => tanggalIndoFormat(new Date()), []);
  const [selectedPresensiTab, setSelectedPresensiTab] = useState<string | null>(null);
  const [selectedInputTab, setSelectedInputTab] = useState<string | null>(null);

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

  const {
    stats,
    persentaseCapaian,
    rekapPredikat,
    presensiBanner,
    capaianHalqah = [],
    distribusiHalqah = [],
    santriPerluPerhatian,
    evaluasiTerbaru = [],
    tasmiTerbaru = [],
    rekapUstadz = [],
    presensiHariIni = [],
    presensiTerbaru = [],
    rekapPresensiBulanIni = [],
    bulanIniLabel = "Bulan Ini",
    sesi,
  } = data;
  const isPresensiOpen = presensiBanner?.open ?? false;
  const hasBulanIniActivity = rekapPresensiBulanIni.some(
    (item) => item.totalHadir > 0 || item.izin > 0 || item.sakit > 0
  );
  const defaultPresensiTab =
    presensiHariIni.length > 0
      ? "hari-ini"
      : presensiTerbaru.length > 0
        ? "terbaru"
        : hasBulanIniActivity
          ? "rekap"
          : "hari-ini";
  const activePresensiTab = selectedPresensiTab ?? defaultPresensiTab;

  const defaultInputTab =
    evaluasiTerbaru.length > 0
      ? "evaluasi"
      : tasmiTerbaru.length > 0
        ? "tasmi"
        : rekapUstadz.length > 0
          ? "ustadz"
          : "evaluasi";
  const activeInputTab = selectedInputTab ?? defaultInputTab;
  const distMap = new Map(distribusiHalqah.map((d) => [d.name, d]));

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

      {/* Presensi Ustadz Summary & Sesi Strip */}
      <div className="grid gap-3.5 md:grid-cols-3">
        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between p-4.5">
            <div className="space-y-1">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
                Presensi Ustadz Hari Ini
              </p>
              <p className="font-display text-2xl font-black text-ink">
                {stats.presensiHadir}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  / {stats.presensiTotal}
                </span>
              </p>
              <p className="text-[11.5px] font-medium text-muted-foreground">
                Subuh {stats.presensiSubuh} · Maghrib {stats.presensiMaghrib}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UserCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
                  Sesi Subuh
                </p>
                {isPresensiOpen && presensiBanner?.sesi === "Subuh" && (
                  <Badge variant="success">Sedang Buka</Badge>
                )}
              </div>
              <p className="font-display text-lg font-extrabold text-ink tabular-nums">
                {sesi?.subuh?.mulai ?? "04:45"} – {sesi?.subuh?.selesai ?? "06:30"} WIB
              </p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">
                {sesi?.subuh?.hadir ?? stats.presensiSubuh} ustadz hadir hari ini
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <Sun className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-line bg-card shadow-2xs transition-all hover:shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">
                  Sesi Maghrib
                </p>
                {isPresensiOpen && presensiBanner?.sesi === "Maghrib" && (
                  <Badge variant="success">Sedang Buka</Badge>
                )}
              </div>
              <p className="font-display text-lg font-extrabold text-ink tabular-nums">
                {sesi?.maghrib?.mulai ?? "17:45"} – {sesi?.maghrib?.selesai ?? "19:30"} WIB
              </p>
              <p className="text-[11.5px] font-semibold text-muted-foreground">
                {sesi?.maghrib?.hadir ?? stats.presensiMaghrib} ustadz hadir hari ini
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Moon className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Presensi Ustadz */}
      <Card className="gap-0 overflow-hidden border-line bg-card pb-0 shadow-2xs">
        <CardHeader className="border-b border-line bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="size-4.5 shrink-0 text-emerald-700" />
            <div>
              <CardTitle>
                {isSupervisor
                  ? "Data Presensi Ustadz & Ustadzah"
                  : "Data Presensi Kehadiran Anda"}
              </CardTitle>
              <CardDescription>
                {isSupervisor
                  ? "Daftar ustadz yang sudah absen hari ini, riwayat presensi terbaru, dan rekap bulan berjalan"
                  : "Catatan presensi kehadiran pribadi hari ini dan bulan berjalan"}
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <LinkMore href="/absensi">Kelola Presensi</LinkMore>
          </CardAction>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs
            value={activePresensiTab}
            onValueChange={setSelectedPresensiTab}
            className="gap-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4.5 py-2.5">
              <TabsList>
                <TabsTrigger value="hari-ini">
                  Hari Ini ({presensiHariIni.length})
                </TabsTrigger>
                <TabsTrigger value="terbaru">
                  Riwayat Terbaru ({presensiTerbaru.length})
                </TabsTrigger>
                <TabsTrigger value="rekap">
                  Rekap {bulanIniLabel} ({rekapPresensiBulanIni.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="hari-ini" className="mt-0">
              <PresensiRowsTable
                rows={presensiHariIni}
                showDate={false}
                emptyMessage="Belum ada ustadz yang melakukan presensi pada hari ini."
              />
            </TabsContent>

            <TabsContent value="terbaru" className="mt-0">
              <PresensiRowsTable
                rows={presensiTerbaru}
                showDate={true}
                emptyMessage="Belum ada data presensi ustadz yang tercatat."
              />
            </TabsContent>

            <TabsContent value="rekap" className="mt-0">
              {rekapPresensiBulanIni.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-muted-foreground">
                  Belum ada data rekap presensi untuk {bulanIniLabel}.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ustadz / Halqah</TableHead>
                      <TableHead className="text-center">Subuh</TableHead>
                      <TableHead className="text-center">Maghrib</TableHead>
                      <TableHead className="text-center">Izin / Sakit</TableHead>
                      <TableHead className="text-center">Total Hadir</TableHead>
                      <TableHead>Absen Terakhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapPresensiBulanIni.map((item) => (
                      <TableRow key={item.username}>
                        <TableCell>
                          <UserCell
                            initials={initialsOf(item.nama)}
                            name={item.nama}
                            sub={item.halqah}
                          />
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold text-ink">
                          {item.subuhHadir}x
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold text-ink">
                          {item.maghribHadir}x
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {item.izin} / {item.sakit}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.totalHadir > 0 ? "success" : "neutral"}>
                            {item.totalHadir}x Hadir
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12.5px] text-muted-foreground">
                          {item.terakhirAbsen ? (
                            <span className="font-medium text-ink">
                              {tanggalIndo(item.terakhirAbsen)}
                              {item.terakhirJam ? ` · ${item.terakhirJam}` : ""}
                              {item.terakhirSesi ? ` (${item.terakhirSesi})` : ""}
                            </span>
                          ) : (
                            <span>Belum ada</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Middle Row: Two Charts */}
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <PersentaseTargetChart data={persentaseCapaian} />
        <RekapTasmiChart data={rekapPredikat} />
      </div>

      {/* Progres per Halqah */}
      {capaianHalqah.length > 0 && (
        <Card className="border-line bg-card shadow-2xs">
          <CardHeader className="border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Layers className="size-4.5 text-emerald-700 shrink-0" />
              <div>
                <CardTitle>Capaian &amp; Sebaran Santri per Halqah</CardTitle>
                <CardDescription>
                  Rekap status target santri dan jumlah anggota tiap halqah
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <LinkMore href="/data-santri">Data Santri</LinkMore>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {capaianHalqah.map((item) => {
                const dist = distMap.get(item.name);
                const totalSantri = item.totalSantri ?? dist?.total ?? 0;
                const totalEvaluasi = item.totalEvaluasi ?? 0;
                const tuntas = item.tuntas ?? 0;
                const sedang = item.sedang ?? 0;
                const recovery = item.recovery ?? 0;
                return (
                  <div
                    key={item.name}
                    className="rounded-xl border border-line bg-slate-50/50 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-ink truncate">
                        {item.name}
                      </span>
                      <Badge variant={totalEvaluasi > 0 ? "success" : "neutral"}>
                        {item.value}% Tuntas
                      </Badge>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11.5px] text-muted-foreground">
                      <span className="font-medium text-ink">
                        {totalSantri} santri{dist ? ` (${dist.percent}%)` : ""}
                      </span>
                      <span className="tabular-nums">
                        {totalEvaluasi > 0
                          ? `${tuntas} Tuntas · ${sedang} Sedang · ${recovery} Recovery`
                          : "Belum ada evaluasi"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Input Ustadz: Evaluasi, Tasmi', dan Aktivitas Halqah */}
      <Card className="border-line bg-card shadow-2xs">
        <CardHeader className="border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4.5 text-emerald-700 shrink-0" />
            <div>
              <CardTitle>Data Input Ustadz (Evaluasi &amp; Ujian Tasmi&apos;)</CardTitle>
              <CardDescription>
                Terhubung langsung dengan evaluasi harian dan penilaian tasmi&apos; yang diinput ustadz
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <div className="flex items-center gap-3">
              <LinkMore href="/evaluasi">Evaluasi</LinkMore>
              <LinkMore href="/tasmi">Tasmi&apos;</LinkMore>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={activeInputTab}
            onValueChange={setSelectedInputTab}
            className="gap-0"
          >
            <div className="border-b border-line px-6 py-3">
              <TabsList>
                <TabsTrigger value="evaluasi">
                  Evaluasi Terbaru ({evaluasiTerbaru.length})
                </TabsTrigger>
                <TabsTrigger value="tasmi">
                  Ujian Tasmi&apos; ({tasmiTerbaru.length})
                </TabsTrigger>
                <TabsTrigger value="ustadz">
                  {isSupervisor ? "Aktivitas Halqah & Ustadz" : "Ringkasan Halqah"} ({rekapUstadz.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="evaluasi" className="mt-0">
              {evaluasiTerbaru.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-muted-foreground">
                  Belum ada data evaluasi hafalan yang diinput ustadz.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Santri / Halqah</TableHead>
                      <TableHead>Tanggal &amp; Sesi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kendala &amp; Catatan</TableHead>
                      <TableHead>Diinput Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluasiTerbaru.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-bold text-ink">{row.namaSantri}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {row.halqah} · Tingkat {row.tingkatan}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12.5px] tabular-nums">
                          <span className="font-medium text-ink">
                            {tanggalIndo(row.tanggal)}
                          </span>{" "}
                          <Badge variant="outline" className="ml-1">
                            {row.sesi}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={capaianVariant[row.statusCapaian] ?? "neutral"}>
                            {row.statusCapaian}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-[12.5px] text-slate-600">
                          {row.penyebab || row.catatan ? (
                            <div className="space-y-0.5">
                              {row.penyebab && (
                                <div className="font-medium text-ink">{row.penyebab}</div>
                              )}
                              {row.catatan && (
                                <div className="text-xs text-muted-foreground">{row.catatan}</div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-[12.5px] font-medium text-slate-700">
                          {row.createdBy || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="tasmi" className="mt-0">
              {tasmiTerbaru.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-muted-foreground">
                  Belum ada data ujian tasmi&apos; yang diinput ustadz.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Santri / Halqah</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis Ujian</TableHead>
                      <TableHead className="text-center">Nilai</TableHead>
                      <TableHead>Predikat</TableHead>
                      <TableHead>Kelulusan</TableHead>
                      <TableHead>Penguji</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasmiTerbaru.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-bold text-ink">{row.namaSantri}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {row.halqah} · Tingkat {row.tingkatan}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12.5px] tabular-nums font-medium text-ink">
                          {tanggalIndo(row.tanggal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.jenisTasmi}</Badge>
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-bold text-ink">
                          {row.nilai}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.predikat === "Mumtaz"
                                ? "success"
                                : row.predikat === "Jayyid Jiddan"
                                  ? "info"
                                  : row.predikat === "Jayyid"
                                    ? "warning"
                                    : "danger"
                            }
                          >
                            {row.predikat}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.statusKelulusan === "Lulus" ? "success" : "danger"}>
                            {row.statusKelulusan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12.5px] font-medium text-slate-700">
                          {row.penguji || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="ustadz" className="mt-0">
              {rekapUstadz.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-muted-foreground">
                  Belum ada data aktivitas ustadz / halqah.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ustadz / Halqah</TableHead>
                      <TableHead className="text-center">Santri</TableHead>
                      <TableHead className="text-center">Tuntas / Perhatian</TableHead>
                      <TableHead className="text-center">Input Eval</TableHead>
                      <TableHead className="text-center">Input Tasmi&apos;</TableHead>
                      <TableHead className="text-center">Presensi</TableHead>
                      <TableHead>Input Terakhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapUstadz.map((item) => (
                      <TableRow key={item.username}>
                        <TableCell>
                          <UserCell
                            initials={initialsOf(item.nama)}
                            name={item.nama}
                            sub={item.halqah}
                          />
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold text-ink">
                          {item.totalSantri}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-[12.5px]">
                          <span className="font-semibold text-emerald-700">
                            {item.tuntasCount}
                          </span>
                          {" / "}
                          <span className="font-semibold text-amber-700">
                            {item.perluPerhatianCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold text-ink">
                          {item.evaluasiCount}
                        </TableCell>
                        <TableCell className="text-center tabular-nums font-semibold text-ink">
                          {item.tasmiCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.presensiBulanIni > 0 ? "success" : "neutral"}>
                            {item.presensiBulanIni}x Hadir
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[12.5px] text-muted-foreground">
                          {item.terakhirInput ? (
                            <span className="font-medium text-ink">
                              {tanggalIndo(item.terakhirInput)}
                            </span>
                          ) : (
                            <span>Belum ada</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bottom Table: Santri Perlu Perhatian Khusus */}
      <Card className="overflow-hidden border-line bg-card shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-slate-50/50 p-4.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4.5 text-rose-600 shrink-0" />
            <div>
              <h2 className="text-[14.5px] font-bold text-ink">
                Santri Perlu Perhatian Khusus (Sedang / Recovery)
              </h2>
              <p className="text-xs text-muted-foreground">
                Daftar santri yang belum tuntas target kurikulum ({santriPerluPerhatian.length} santri)
              </p>
            </div>
          </div>
          <LinkMore href="/evaluasi">Kelola Evaluasi</LinkMore>
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
