"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PublicUser } from "@/lib/api";
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
import { ActionButton } from "@/components/ui/action-button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = ["Admin", "Ustadz", "Ustadzah", "Kepsek"];

export const HALQAH_OPTIONS = [
  "Al-Fatih",
  "Al-Baqarah",
  "An-Nahl",
  "Maryam",
  "Yasin",
  "Thaha",
];

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.users.create,
    onSuccess: (res) => {
      toast.success(`User ${res.user.username} berhasil ditambahkan`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" strokeWidth={2} />
          Tambah User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
          <DialogDescription>
            Password disimpan ter-hash (bcrypt) di database.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            mutation.mutate({
              nama: String(f.get("nama") ?? "").trim(),
              username: String(f.get("username") ?? "").trim(),
              email: String(f.get("email") ?? "").trim() || null,
              password: String(f.get("password") ?? ""),
              role: String(f.get("role") ?? "Ustadz") as PublicUser["role"],
              halqah:
                String(f.get("role")) === "Ustadz" || String(f.get("role")) === "Ustadzah"
                  ? String(f.get("halqah") ?? HALQAH_OPTIONS[0])
                  : null,
              lembaga: String(f.get("lembaga") ?? "").trim() || null,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap" required>
              <Input name="nama" required placeholder="Nama & gelar" />
            </Field>
            <Field label="Username" required>
              <Input name="username" required placeholder="mis. hasan.basri" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input name="email" type="email" placeholder="nama@bqa.sch.id" />
            </Field>
            <Field label="Password Awal" required hint="Minimal 6 karakter.">
              <Input name="password" type="text" required minLength={6} placeholder="mis. ustadz123" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" required>
              <Select name="role" defaultValue={ROLES[1]}>
                <SelectTrigger id="role-dialog">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Halqah">
              <Select name="halqah" defaultValue={HALQAH_OPTIONS[0]}>
                <SelectTrigger id="halqah-user-dialog">
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
          </div>
          <Field label="Lembaga">
            <Input name="lembaga" placeholder="mis. Tahfidz" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan…" : "Simpan User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user }: { user: PublicUser }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof api.users.update>[1]) =>
      api.users.update(user.id, body),
    onSuccess: () => {
      toast.success(`Akun ${user.username} berhasil diperbarui`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton icon={Pencil} title={`Ubah akun ${user.nama}`} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Akun User</DialogTitle>
          <DialogDescription>
            Perbarui data akun {user.username}. Kosongkan password jika tidak diubah.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            mutation.mutate({
              nama: String(f.get("nama") ?? "").trim(),
              email: String(f.get("email") ?? "").trim() || null,
              role: String(f.get("role") ?? user.role) as PublicUser["role"],
              halqah: String(f.get("halqah") ?? "") || null,
              lembaga: String(f.get("lembaga") ?? "").trim() || null,
              ...(String(f.get("password") ?? "")
                ? { password: String(f.get("password")) }
                : {}),
            });
          }}
        >
          <Field label="Nama Lengkap" required>
            <Input name="nama" required defaultValue={user.nama} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input name="email" type="email" defaultValue={user.email ?? ""} />
            </Field>
            <Field label="Password Baru" hint="Kosongkan jika tetap.">
              <Input name="password" type="text" minLength={6} placeholder="••••••" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Role" required>
              <Select name="role" defaultValue={user.role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Halqah">
              <Select name="halqah" defaultValue={user.halqah ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="">—</SelectItem>
                  {HALQAH_OPTIONS.map((halqah) => (
                    <SelectItem key={halqah} value={halqah}>
                      {halqah}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lembaga">
              <Input name="lembaga" defaultValue={user.lembaga ?? ""} />
            </Field>
          </div>
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

export function ResetPasswordButton({ user }: { user: PublicUser }) {
  const mutation = useMutation({
    mutationFn: () =>
      api.users.update(user.id, { password: `bqa${Date.now().toString().slice(-6)}` }),
    onSuccess: (res) => toast.success(`Password ${res.user.nama} berhasil direset`),
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <ActionButton
      icon={KeyRound}
      title="Reset password"
      onClick={() => mutation.mutate()}
    />
  );
}

export function UserRowActions({ user }: { user: PublicUser }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.users.remove(user.id),
    onSuccess: () => {
      toast.success(`User ${user.nama} berhasil dihapus`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <span className="flex gap-1.5">
      <EditUserDialog user={user} />
      <ResetPasswordButton user={user} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Hapus ${user.nama}`}
            className="text-muted-foreground hover:border-danger hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" strokeWidth={1.9} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus user {user.nama}?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun akan dihapus permanen dan tidak dapat digunakan untuk login lagi.
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

export function ActiveSwitch({
  user,
}: {
  user: PublicUser;
}) {
  const [checked, setChecked] = useState(user.status === "Aktif");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: "Aktif" | "Nonaktif") => api.users.setStatus(user.id, status),
    onSuccess: (res) => {
      toast.success(
        res.user.status === "Aktif"
          ? `Akun ${res.user.nama} diaktifkan`
          : `Akun ${res.user.nama} dinonaktifkan`
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setChecked((prev) => !prev);
    },
  });

  return (
    <Switch
      checked={checked}
      onCheckedChange={(value) => {
        setChecked(value);
        mutation.mutate(value ? "Aktif" : "Nonaktif");
      }}
      aria-label={`Aktifkan akun ${user.nama}`}
    />
  );
}
