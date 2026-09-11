"use client";

import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  api,
  errorMessage,
  type Absensi,
  type Evaluasi,
  type Santri,
  type Tasmi,
} from "@/lib/api";

type Kind = "santri" | "tasmi" | "evaluasi" | "presensi";

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(";"),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(";")),
  ].join("\n");
}

async function fetchData(
  kind: Kind
): Promise<Array<Record<string, unknown>>> {
  switch (kind) {
    case "santri": {
      const res = await api.santri.list();
      return res.data.map((s: Santri) => ({
        NIS: s.nis,
        Nama: s.nama,
        Halqah: s.halqah,
        Tingkatan: s.tingkatan,
        Jalur: s.jalur,
        "Jenis Kelamin": s.jenisKelamin,
        Status: s.statusAktif ? "Aktif" : "Tidak Aktif",
      }));
    }
    case "tasmi": {
      const res = await api.tasmi.list({ limit: 200 });
      return res.data.map((t: Tasmi) => ({
        Tanggal: t.tanggal,
        Santri: t.namaSantri,
        Halqah: t.halqah,
        Tingkatan: t.tingkatan,
        Jenis: t.jenisTasmi,
        Nilai: t.nilai,
        Predikat: t.predikat,
        Kelulusan: t.statusKelulusan,
        Penguji: t.penguji ?? "",
      }));
    }
    case "evaluasi": {
      const res = await api.evaluasi.list({ limit: 200 });
      return res.data.map((e: Evaluasi) => ({
        Tanggal: e.tanggal,
        Sesi: e.sesi,
        Santri: e.namaSantri,
        Tingkatan: e.tingkatan,
        Halqah: e.halqah,
        Status: e.statusCapaian,
        Penyebab: e.penyebab ?? "",
        Target: e.targetJuz ?? "",
        "Input Oleh": e.createdBy,
      }));
    }
    case "presensi": {
      const res = await api.absensi.list({ limit: 200 });
      return res.data.map((a: Absensi) => ({
        Tanggal: a.tanggal,
        Jam: a.jam,
        Nama: a.nama,
        Halqah: a.halqah ?? "",
        Sesi: a.sesi,
        Status: a.status,
        Jarak: a.jarakMeter != null ? `${a.jarakMeter} m` : "",
        Validasi: a.lokasiValidasi ? "Valid" : "",
        Keterangan: a.keterangan ?? "",
        Override: a.isAdminOverride ? "Ya" : "",
      }));
    }
  }
}

export function ReportActions({ title, kind }: { title: string; kind: Kind }) {
  const exportCsv = async () => {
    // Open a blank window synchronously for iOS Safari bypass (optional for CSV, but safe)
    // Actually for CSV, appending to DOM is usually enough. Let's just append.
    try {
      toast.info(`Menyiapkan laporan "${title}"…`);
      const rows = await fetchData(kind);
      if (rows.length === 0) {
        toast.warning("Tidak ada data untuk diekspor");
        return;
      }
      const csv = "\uFEFF" + toCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Laporan "${title}" berhasil diekspor (${rows.length} baris)`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const cetakPdf = () => {
    // Safari iOS requires window.open to be synchronous with the user interaction.
    // So we open it BEFORE the async fetchData.
    let win: Window | null = null;
    try {
      win = window.open("", "_blank");
      if (!win) {
        toast.error("Popup diblokir — izinkan popup pada browser Anda untuk mencetak");
        return;
      }
      win.document.write("<html><body><p style='font-family:sans-serif;'>Menyiapkan data cetak...</p></body></html>");
      
      // Do the async fetch inside an IIFE so the outer function remains sync
      (async () => {
        try {
          toast.info(`Membuka pratinjau cetak "${title}"…`);
          const rows = await fetchData(kind);
          
          if (rows.length === 0) {
            toast.warning("Tidak ada data untuk dicetak");
            if (win) win.close();
            return;
          }
          const headers = Object.keys(rows[0]!);
          
          // Overwrite the loading text
          if (win) {
            win.document.open();
            win.document.write(`<html dir="ltr"><head><title>${title}</title>
              <style>
                body{font-family:system-ui,sans-serif;padding:24px}
                h1{font-size:18px;margin-bottom:4px}
                p{color:#666;font-size:12px;margin-top:0}
                table{border-collapse:collapse;width:100%;font-size:11px}
                th,td{border:1px solid #ccc;padding:5px 8px;text-align:left}
                th{background:#f0f4f2}
              </style></head><body>
              <h1>${title}</h1>
              <p>Pesantren Baitul Qur'an Al-Ikhwan · Dicetak ${new Date().toLocaleString("id-ID")}</p>
              <table><thead><tr>${headers
                .map((h) => `<th>${h}</th>`)
                .join("")}</tr></thead><tbody>${rows
              .map(
                (row) =>
                  `<tr>${headers.map((h) => `<td>${String(row[h] ?? "")}</td>`).join("")}</tr>`
              )
              .join("")}</tbody></table>
              <script>window.onload=()=>window.print()</script>
              </body></html>`);
            win.document.close();
          }
        } catch (err) {
          if (win) win.close();
          toast.error(errorMessage(err));
        }
      })();
    } catch (err) {
      if (win) win.close();
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="mt-4 flex gap-2.5">
      <Button variant="outline" className="flex-1" onClick={exportCsv}>
        Excel
      </Button>
      <Button className="flex-1" onClick={cetakPdf}>
        <Printer className="size-4" strokeWidth={2} />
        Cetak PDF
      </Button>
    </div>
  );
}
