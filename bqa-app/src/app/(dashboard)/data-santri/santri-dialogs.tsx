"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Santri } from "@/lib/api";
import { api, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pills } from "@/components/ui/pills";
import { ActionButton } from "@/components/ui/action-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TINGKATAN = ["Tingkat 1", "Tingkat 2", "Tingkat 3", "Tingkat 4", "Tingkat 5", "Tingkat 6"];

export const HALQAH_OPTIONS = [
  "Al-Fatih",
  "Al-Baqarah",
  "An-Nahl",
  "Maryam",
  "Yasin",
  "Thaha",
];

function tingkatanValue(t: string): number {
  return Number(t.replace("Tingkat ", ""));
}

export function AddSantriButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.santri.create,
    onSuccess: (res) => {
      toast.success(`Santri ${res.santri.nama} berhasil ditambahkan`);
      queryClient.invalidateQueries({ queryKey: ["santri"] });
      setOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" strokeWidth={2} />
          Tambah Santri
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Santri Baru</DialogTitle>
          <DialogDescription>
            Lengkapi data master santri — NIS bersifat unik.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            mutation.mutate({
              nis: String(f.get("nis") ?? "").trim(),
              nama: String(f.get("nama") ?? "").trim(),
              halqah: String(f.get("halqah") ?? HALQAH_OPTIONS[0]),
              tingkatan: tingkatanValue(String(f.get("tingkatan") ?? TINGKATAN[0])),
              jenisKelamin: String(f.get("jenisKelamin") ?? "Laki-laki"),
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NIS" required>
              <Input name="nis" required placeholder="mis. 2425" inputMode="numeric" />
            </Field>
            <Field label="Nama Lengkap" required>
              <Input name="nama" required placeholder="Nama santri" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Halqah" required>
              <Select name="halqah" defaultValue={HALQAH_OPTIONS[0]}>
                <SelectTrigger id="halqah-dialog">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {HALQAH_OPTIONS.map((halqah) => (
                    <SelectItem key={halqah} value={halqah}>
                      {halqah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tingkatan" required>
              <Select name="tingkatan" defaultValue={TINGKATAN[0]}>
                <SelectTrigger id="tingkat-dialog">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {TINGKATAN.map((tingkat) => (
                    <SelectItem key={tingkat} value={tingkat}>
                      {tingkat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Jenis Kelamin" required>
            <Pills name="jenisKelamin" options={["Laki-laki", "Perempuan"]} defaultOption="Laki-laki" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan…" : "Simpan Santri"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditSantriDialog({
  santri,
  onSaved,
}: {
  santri: Santri;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof api.santri.update>[1]) =>
      api.santri.update(santri.id, body),
    onSuccess: () => {
      toast.success(`Data ${santri.nama} berhasil diperbarui`);
      queryClient.invalidateQueries({ queryKey: ["santri"] });
      setOpen(false);
      onSaved?.();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton icon={Pencil} title={`Ubah data ${santri.nama}`} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Data Santri</DialogTitle>
          <DialogDescription>
            Perbarui data master {santri.nama} (NIS {santri.nis})
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            mutation.mutate({
              nama: String(f.get("nama") ?? "").trim(),
              halqah: String(f.get("halqah") ?? santri.halqah),
              tingkatan: tingkatanValue(String(f.get("tingkatan") ?? `Tingkat ${santri.tingkatan}`)),
              statusAktif: f.get("statusAktif") === "Aktif",
            });
          }}
        >
          <Field label="Nama Lengkap" required>
            <Input name="nama" required defaultValue={santri.nama} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Halqah" required>
              <Select name="halqah" defaultValue={santri.halqah}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {HALQAH_OPTIONS.map((halqah) => (
                    <SelectItem key={halqah} value={halqah}>
                      {halqah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tingkatan" required>
              <Select name="tingkatan" defaultValue={`Tingkat ${santri.tingkatan}`}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {TINGKATAN.map((tingkat) => (
                    <SelectItem key={tingkat} value={tingkat}>
                      {tingkat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Status" required>
            <Pills
              name="statusAktif"
              options={["Aktif", "Tidak Aktif"]}
              defaultOption={santri.statusAktif ? "Aktif" : "Tidak Aktif"}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan…" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MutasiSantriDialog({ santri }: { santri: Santri }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: { halqah: string; tingkatan?: number }) =>
      api.santri.mutasi(santri.id, body),
    onSuccess: (res) => {
      toast.success(
        `${res.santri.nama} dimutasi ke halqah ${res.santri.halqah}`
      );
      queryClient.invalidateQueries({ queryKey: ["santri"] });
      setOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton icon={Repeat} title="Pindah halqah" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mutasi Halqah</DialogTitle>
          <DialogDescription>
            Pindahkan {santri.nama} ({santri.halqah}) ke kelompok lain.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            const tingkatStr = String(f.get("tingkatan") ?? "");
            mutation.mutate({
              halqah: String(f.get("halqah") ?? ""),
              ...(tingkatStr ? { tingkatan: tingkatanValue(tingkatStr) } : {}),
            });
          }}
        >
          <Field label="Halqah Tujuan" required>
            <Select name="halqah" required defaultValue={HALQAH_OPTIONS[0]}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {HALQAH_OPTIONS.filter((h) => h !== santri.halqah).map((halqah) => (
                  <SelectItem key={halqah} value={halqah}>
                    {halqah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Tingkatan Baru"
            hint="Kosongkan jika tingkatan tidak berubah."
          >
            <Select name="tingkatan" defaultValue="">
              <SelectTrigger>
                <SelectValue placeholder="Tetap" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="">Tetap (Tingkat {santri.tingkatan})</SelectItem>
                {TINGKATAN.map((tingkat) => (
                  <SelectItem key={tingkat} value={tingkat}>
                    {tingkat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Memproses…" : "Mutasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SantriRowActions({ santri }: { santri: Santri }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.santri.remove(santri.id),
    onSuccess: () => {
      toast.success(`Santri ${santri.nama} berhasil dihapus`);
      queryClient.invalidateQueries({ queryKey: ["santri"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <span className="flex gap-1.5">
      <EditSantriDialog santri={santri} />
      <MutasiSantriDialog santri={santri} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Hapus ${santri.nama}`}
            className="text-muted-foreground hover:border-danger hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" strokeWidth={1.9} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus santri {santri.nama}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen. Seluruh riwayat evaluasi santri juga akan terhapus
              dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => mutation.mutate()}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}
