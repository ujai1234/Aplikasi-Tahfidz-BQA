import type { Metadata } from "next";
import {
  Award,
  ChartPie,
  ClipboardList,
  Clock,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Banner } from "@/components/ui/banner";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { ReportActions } from "./report-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan & Cetak" };

const iconTone: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  gold: "bg-gold-soft text-gold-ink",
  info: "bg-info-soft text-info",
  purple: "bg-purple-soft text-purple",
};

function ReportCard({
  icon: Icon,
  tone,
  title,
  kind,
  description,
  children,
}: {
  icon: LucideIcon;
  tone: keyof typeof iconTone;
  title: string;
  kind: "santri" | "tasmi" | "evaluasi" | "presensi";
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardContent>
        <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              iconTone[tone]
            )}
          >
            <Icon className="size-5" strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="font-display text-[15px] font-extrabold tracking-tight text-ink">
              {title}
            </h3>
            <p className="text-xs font-medium text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="grid content-start gap-3.5">{children}</div>
        <ReportActions title={title} kind={kind} />
      </CardContent>
    </Card>
  );
}

export default function LaporanPage() {
  return (
    <>
      <PageHeader
        title="Laporan & Cetak"
        subtitle="Rekap & cetak laporan pesantren"
      />

      <Banner tone="info" icon={ChartPie}>
        <b>Pusat laporan.</b> Atur filter terlebih dahulu, lalu cetak sebagai PDF atau
        export ke Excel. Kepala Pesantren memiliki akses <b>view-only</b> ke seluruh
        laporan.
      </Banner>

      <div className="grid items-stretch gap-5 md:grid-cols-2">
        <ReportCard
          icon={Users}
          tone="primary"
          title="Rekap Data Santri"
          kind="santri"
          description="Master santri per halqah & tingkatan"
        >
          <Field label="Halqah">
            <FilterSelect
              label="Halqah laporan santri"
              options={[
                "Semua Halqah",
                "Al-Fatih",
                "Al-Baqarah",
                "An-Nahl",
                "Maryam",
                "Yasin",
                "Thaha",
              ]}
              className="w-full"
            />
          </Field>
          <Field label="Tingkatan">
            <FilterSelect
              label="Tingkatan laporan santri"
              options={["Semua", "1", "2", "3", "4", "5", "6"]}
              className="w-full"
            />
          </Field>
          <Field label="Status">
            <FilterSelect
              label="Status laporan santri"
              options={["Semua", "Aktif", "Tidak Aktif"]}
              className="w-full"
            />
          </Field>
        </ReportCard>

        <ReportCard
          icon={Award}
          tone="gold"
          title="Rekap Ujian Tasmi'"
          kind="tasmi"
          description="Nilai, predikat & kelulusan per santri/halqah"
        >
          <Field label="Halqah">
            <FilterSelect
              label="Halqah laporan tasmi"
              options={[
                "Semua Halqah",
                "Al-Fatih",
                "Al-Baqarah",
                "An-Nahl",
                "Maryam",
                "Yasin",
                "Thaha",
              ]}
              className="w-full"
            />
          </Field>
          <Field label="Jenis Tasmi'">
            <FilterSelect
              label="Jenis laporan tasmi"
              options={["Semua Jenis", "Pekanan", "Per 3 Bulan", "Per 6 Bulan"]}
              className="w-full"
            />
          </Field>
          <Field label="Kelulusan">
            <FilterSelect
              label="Kelulusan laporan tasmi"
              options={["Semua Kelulusan", "Lulus", "Tidak Lulus"]}
              className="w-full"
            />
          </Field>
        </ReportCard>

        <ReportCard
          icon={ClipboardList}
          tone="info"
          title="Laporan Evaluasi Harian"
          kind="evaluasi"
          description="Rekap capaian santri per periode"
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Tanggal Awal">
              <Input type="date" defaultValue="2026-08-01" className="w-full" />
            </Field>
            <Field label="Tanggal Akhir">
              <Input type="date" defaultValue="2026-08-25" className="w-full" />
            </Field>
          </div>
          <Field label="Halqah">
            <FilterSelect
              label="Halqah laporan evaluasi"
              options={[
                "Semua Halqah",
                "Al-Fatih",
                "Al-Baqarah",
                "An-Nahl",
                "Maryam",
                "Yasin",
                "Thaha",
              ]}
              className="w-full"
            />
          </Field>
          <Field label="Status Capaian">
            <FilterSelect
              label="Status laporan evaluasi"
              options={["Semua Status", "Tuntas", "Sedang", "Recovery"]}
              className="w-full"
            />
          </Field>
        </ReportCard>

        <ReportCard
          icon={Clock}
          tone="purple"
          title="Laporan Presensi Ustadz"
          kind="presensi"
          description="Rekap kehadiran, izin & sakit"
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Tanggal Awal">
              <Input type="date" defaultValue="2026-08-01" className="w-full" />
            </Field>
            <Field label="Tanggal Akhir">
              <Input type="date" defaultValue="2026-08-25" className="w-full" />
            </Field>
          </div>
          <Field label="Sesi">
            <FilterSelect
              label="Sesi laporan presensi"
              options={["Semua Sesi", "Subuh", "Maghrib"]}
              className="w-full"
            />
          </Field>
          <Field label="Status">
            <FilterSelect
              label="Status laporan presensi"
              options={["Semua Status", "Hadir", "Izin", "Sakit"]}
              className="w-full"
            />
          </Field>
        </ReportCard>
      </div>
    </>
  );
}
