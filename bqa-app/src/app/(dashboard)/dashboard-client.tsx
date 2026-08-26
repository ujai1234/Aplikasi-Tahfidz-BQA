"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CircleAlert, Clock, MapPin, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveDot } from "@/components/ui/live-dot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkMore } from "@/components/ui/link-more";
import { UserCell } from "@/components/ui/user-cell";
import { CapaianChart } from "@/components/dashboard/capaian-chart";
import { DistribusiDonut } from "@/components/dashboard/distribusi-donut";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { capaianVariant, initialsOf, presensiVariant } from "@/lib/utils";

function tanggalIndo(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SesiStrip({
  sesi,
}: {
  sesi: { subuh: { mulai: string; selesai: string; hadir: number }; maghrib: { mulai: string; selesai: string; hadir: number } };
}) {
  const items = [
    { key: "Subuh", ...sesi.subuh, done: true },
    { key: "Maghrib", ...sesi.maghrib, done: false },
  ];

  return (
    <Card>
      <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-[#fbfdfc] px-4 py-3"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <CalendarClock className="size-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ink">Sesi {item.key}</p>
              <p className="text-xs font-medium text-muted-foreground">
                {item.mulai} – {item.selesai} WIB
              </p>
            </div>
            <Badge variant={item.hadir > 0 ? "success" : "neutral"} className="ml-auto">
              {item.done ? (
                item.hadir > 0 ? (
                  "Selesai"
                ) : (
                  "Ditutup"
                )
              ) : item.hadir > 0 ? (
                <>
                  <LiveDot />
                  Berlangsung
                </>
              ) : (
                "Belum dibuka"
              )}
            </Badge>
            <p className="ml-auto text-xs font-medium text-muted-foreground md:ml-0">
              <b className="text-sm font-extrabold text-ink">{item.hadir}</b> hadir
            </p>
          </div>
        ))}
        <p className="flex items-start gap-2 text-xs leading-relaxed font-medium text-muted-foreground md:max-w-56">
          <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.9} />
          Radius validasi ≤ 500 m dari koordinat pesantren. Jumat: sesi khusus
          04:30 – 21:00.
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardClient() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.dashboard(),
  });

  if (isLoading || !data) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <p className="animate-pulse text-sm font-semibold text-muted-foreground">
          Memuat data dashboard…
        </p>
      </div>
    );
  }

  if (isError) return null;

  const { stats, sesi } = data;
  const total = stats.totalSantri || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Assalamu'alaikum, ${user?.nama ?? ""} · ${tanggalIndo(
          new Date().toISOString().slice(0, 10)
        )}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Users}
          tone="primary"
          value={String(stats.totalSantri)}
          label="Total Santri Aktif"
          delay={0}
        />
        <StatCard
          icon={UserCheck}
          tone="success"
          value={String(stats.tuntas)}
          label="Tuntas"
          progress={pct(stats.tuntas)}
          footer={`${pct(stats.tuntas)}% dari total santri`}
          delay={60}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          value={String(stats.sedang)}
          label="Sedang Proses"
          progress={pct(stats.sedang)}
          footer={`${pct(stats.sedang)}% dari total santri`}
          delay={120}
        />
        <StatCard
          icon={CircleAlert}
          tone="danger"
          value={String(stats.recovery)}
          label="Recovery"
          progress={pct(stats.recovery)}
          footer={`${pct(stats.recovery)}% dari total santri`}
          delay={180}
        />
        <StatCard
          icon={MapPin}
          tone="info"
          value={`${stats.presensiHadir}/${stats.presensiTotal}`}
          label="Presensi Ustadz Hari Ini"
          footer={`Subuh ${stats.presensiSubuh} · Maghrib ${stats.presensiMaghrib}`}
          delay={240}
        />
      </section>

      <SesiStrip sesi={sesi} />

      <section className="grid items-stretch gap-5 lg:grid-cols-[1.6fr_1fr]">
        <CapaianChart data={data.capaianHalqah} />
        <DistribusiDonut data={data.distribusiHalqah} />
      </section>

      <section className="grid items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="gap-4 pb-0">
          <CardHeader className="border-b border-line pb-4">
            <CardTitle>Santri Perlu Perhatian</CardTitle>
            <CardDescription>Status recovery &amp; kendala hafalan terbaru</CardDescription>
            <CardAction>
              <LinkMore href="/data-santri">Lihat semua</LinkMore>
            </CardAction>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Santri</TableHead>
                <TableHead>Halqah</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kendala</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.santriPerluPerhatian.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Tidak ada santri yang perlu perhatian — Alhamdulillah
                  </TableCell>
                </TableRow>
              ) : (
                data.santriPerluPerhatian.map((santri) => (
                  <TableRow key={santri.nis}>
                    <TableCell>
                      <UserCell
                        initials={initialsOf(santri.nama)}
                        name={santri.nama}
                        sub={`NIS ${santri.nis}`}
                      />
                    </TableCell>
                    <TableCell>{santri.halqah}</TableCell>
                    <TableCell>{santri.tingkat}</TableCell>
                    <TableCell>
                      <Badge variant={capaianVariant[santri.status]}>
                        {santri.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{santri.kendala}</TableCell>
                    <TableCell>{santri.target}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="gap-4 pb-0">
          <CardHeader className="border-b border-line pb-4">
            <CardTitle>Presensi Terbaru</CardTitle>
            <CardDescription>Kehadiran ustadz dengan validasi GPS</CardDescription>
            <CardAction>
              <LinkMore href="/absensi">Riwayat lengkap</LinkMore>
            </CardAction>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Jarak</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.presensiTerbaru.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Belum ada presensi hari ini
                  </TableCell>
                </TableRow>
              ) : (
                data.presensiTerbaru.map((row) => (
                  <TableRow key={`${row.nama}-${row.sesi}`}>
                    <TableCell>
                      <UserCell
                        initials={initialsOf(row.nama)}
                        name={row.nama}
                        sub={row.halqah}
                      />
                    </TableCell>
                    <TableCell>{row.sesi}</TableCell>
                    <TableCell>{row.jam}</TableCell>
                    <TableCell>{row.jarak}</TableCell>
                    <TableCell>
                      <Badge variant={presensiVariant[row.status]}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </>
  );
}
