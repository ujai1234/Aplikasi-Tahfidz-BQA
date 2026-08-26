"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Download, FileCode2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CardContent } from "@/components/ui/card";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, errorMessage } from "@/lib/api";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BackupButtons() {
  const handleJson = async () => {
    try {
      const blob = await api.backup.downloadJson();
      downloadBlob(
        blob,
        `bqa-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
      toast.success("Backup JSON berhasil diunduh");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleExcel = () => {
    toast.info(
      "Export Excel tersedia melalui menu Laporan & Cetak (unduh JSON untuk arsip lengkap)"
    );
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      <Button onClick={handleExcel}>
        <Download className="size-4" strokeWidth={2} />
        Backup ke Excel
      </Button>
      <Button variant="outline" onClick={handleJson}>
        <FileCode2 className="size-4" strokeWidth={2} />
        Backup ke JSON
      </Button>
    </div>
  );
}

export function ResetPanel() {
  const [confirmText, setConfirmText] = useState("");
  const queryClient = useQueryClient();
  const ready = confirmText.trim().toUpperCase() === "RESET";

  const mutation = useMutation({
    mutationFn: () => api.backup.reset(confirmText.trim().toUpperCase()),
    onSuccess: (res) => {
      toast.success(
        `Data berhasil direset — ${res.dihapus.evaluasi} evaluasi, ${res.dihapus.tasmi} tasmi, ${res.dihapus.presensi} presensi dihapus`
      );
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["backup"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <CardContent className="space-y-4">
      <Banner tone="danger" icon={CircleAlert}>
        <b>Tindakan ini tidak dapat dibatalkan.</b> Lakukan backup terlebih dahulu
        sebelum mereset data.
      </Banner>

      <div className="grid gap-2.5 text-[13px] font-semibold">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" defaultChecked disabled className="accent-primary" />
          Data santri &amp; riwayat evaluasi
        </label>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" defaultChecked disabled className="accent-primary" />
          Data ujian tasmi&apos;
        </label>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" defaultChecked disabled className="accent-primary" />
          Presensi ustadz
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Akun user &amp; pengaturan sistem tetap tersimpan.
      </p>

      <Field label="Konfirmasi" htmlFor="konfirmasi-reset" required>
        <Input
          id="konfirmasi-reset"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder='Ketik "RESET" untuk mengaktifkan tombol'
        />
      </Field>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={!ready || mutation.isPending}
            className="w-full rounded-2xl border-danger bg-danger py-3.5 text-[14.5px] text-white hover:bg-danger/90"
          >
            <Trash2 className="size-4" strokeWidth={2} />
            Reset Semua Data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset seluruh data operasional?</AlertDialogTitle>
            <AlertDialogDescription>
              Data santri, evaluasi, tasmi&apos;, dan presensi akan dihapus permanen.
              Pastikan backup terbaru sudah diunduh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => mutation.mutate()}
            >
              Ya, Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>
  );
}

export function ActivityLogsTable({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<
    Array<{
      id: number;
      username: string;
      action: string;
      detail: string | null;
      createdAt: string;
    }>
  >([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["backup", "logs"] });
  }, [queryClient]);

  return logs;
}
