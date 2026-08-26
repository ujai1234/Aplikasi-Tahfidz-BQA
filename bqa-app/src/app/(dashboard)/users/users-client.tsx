"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  FilterBar,
  FilterSearch,
} from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/ui/export-button";
import {
  ActiveSwitch,
  AddUserButton,
  HALQAH_OPTIONS,
  UserRowActions,
} from "./user-dialogs";
import { api } from "@/lib/api";
import { roleVariant } from "@/lib/utils";

export function UsersClient() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", "list", { q, role, status }],
    queryFn: () =>
      api.users.list({
        q: q || undefined,
        role: role === "" || role === "Semua Role" ? undefined : role,
        status: status === "" || status === "Semua Status" ? undefined : status,
      }),
  });

  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Manajemen User"
        subtitle="Kelola akun, role & penugasan halqah"
      />

      <Banner tone="info" icon={Users}>
        <b>Role-based access.</b> Admin (akses penuh) · Ustadz/Ustadzah (data halqah
        sendiri + input evaluasi, presensi &amp; tasmi&apos;) · Kepala Pesantren
        (view-only seluruh laporan). Nonaktifkan akun untuk mencabut akses login.
      </Banner>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b border-line pb-4">
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>
            {data?.total ?? 0} akun terdaftar · password tersimpan ter-hash (bcrypt)
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2.5">
            <ExportButton label="Export" message="Daftar user berhasil diekspor" />
            <AddUserButton />
          </CardAction>
        </CardHeader>
        <FilterBar>
          <FilterSearch
            placeholder="Cari nama / username / email…"
            label="Cari user"
            onValueChange={setQ}
          />
          <FilterSelect
            label="Filter role"
            options={["Semua Role", "Admin", "Ustadz", "Ustadzah", "Kepsek"]}
            onValueChange={setRole}
          />
          <FilterSelect
            label="Filter status akun"
            options={["Semua Status", "Aktif", "Nonaktif"]}
            onValueChange={setStatus}
          />
        </FilterBar>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Halqah</TableHead>
              <TableHead>Lembaga</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Memuat…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Tidak ada user yang cocok dengan filter
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="leading-tight">
                      {user.nama}
                      <span className="block text-[11.5px] font-medium text-muted-foreground">
                        {user.email ?? "—"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.halqah ?? "—"}</TableCell>
                  <TableCell>{user.lembaga ?? "—"}</TableCell>
                  <TableCell>
                    <ActiveSwitch user={user} />
                  </TableCell>
                  <TableCell>
                    <UserRowActions user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination info={`Menampilkan ${rows.length} dari ${data?.total ?? 0} user`} />
      </Card>
    </>
  );
}
