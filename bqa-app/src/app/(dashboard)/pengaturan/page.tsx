import { PageHeader } from "@/components/ui/page-header";
import { GpsForm, EvaluasiTimeForm, PresensiTimeForm, TasmiLockForm, TentangCard } from "./pengaturan-forms";

export const metadata = { title: "Pengaturan" };

export default function PengaturanPage() {
  return (
    <>
      <PageHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi GPS, waktu presensi, waktu evaluasi & kunci Ujian Tasmi'"
      />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <GpsForm />
        <PresensiTimeForm />
        <EvaluasiTimeForm />
        <TasmiLockForm />
        <TentangCard />
      </div>
    </>
  );
}
