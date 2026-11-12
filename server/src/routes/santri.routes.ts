// @ts-nocheck
import crypto from "crypto";
import { Router } from "express";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { dataSantri, dataTasmi, masterSantri } from "../db/schema";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import {
  compareDateThenCreatedDesc,
  isSantriAktif,
  matchesHalqah,
  normalizeGender,
  normalizeTingkatan,
  resolveSantriHalqah,
  unixNowSec,
} from "../lib/santri-utils";
import { requireAdmin, requireAuth, requireWrite, scopeHalqah } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";

export const santriRouter = Router();

const listQuerySchema = z.object({
  halqah: z.string().optional(),
  tingkatan: z.coerce.number().int().min(1).max(6).optional(),
  status: z.enum(["Aktif", "Tidak Aktif"]).optional(),
  q: z.string().optional(),
});

const createSchema = z.object({
  nis: z.string().min(1, "NIS wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  halqah: z.string().min(1, "Halqah wajib diisi"),
  tingkatan: z.coerce.number().int().min(1).max(6),
  jalur: z.enum(["Reguler", "Akselerasi", "Khusus"]).default("Reguler"),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]).default("Laki-laki"),
});

const updateSchema = z.object({
  nama: z.string().min(1).optional(),
  halqah: z.string().min(1).optional(),
  tingkatan: z.coerce.number().int().min(1).max(6).optional(),
  jalur: z.enum(["Reguler", "Akselerasi", "Khusus"]).optional(),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]).optional(),
  statusAktif: z.boolean().optional(),
});

const mutasiSchema = z.object({
  halqah: z.string().min(1, "Halqah tujuan wajib diisi"),
  tingkatan: z.coerce.number().int().min(1).max(6).optional(),
});

function normalizeSantriRecord(santri: typeof masterSantri.$inferSelect) {
  return {
    ...santri,
    halqah: resolveSantriHalqah(santri) || "-",
    tingkatan: normalizeTingkatan(santri.tingkatan),
    jalur: santri.jalur?.trim() || "Reguler",
    jenisKelamin: normalizeGender(santri.jenisKelamin),
    statusAktif: isSantriAktif(santri.statusAktif),
  };
}

function findSantriOr404(id: string) {
  const santri = db.select().from(masterSantri).where(eq(masterSantri.id, id)).get();
  if (!santri) throw new HttpError(404, "Santri tidak ditemukan");
  return normalizeSantriRecord(santri);
}

santriRouter.use(requireAuth);

santriRouter.get("/", validateQuery(listQuerySchema), (req, res) => {
  const { halqah, tingkatan, status, q } = res.locals.query as z.infer<
    typeof listQuerySchema
  >;
  const scopedHalqah = scopeHalqah(req.user!);

  const filters = [];
  if (q) {
    filters.push(
      or(like(masterSantri.nama, `%${q}%`), like(masterSantri.nis, `%${q}%`))!
    );
  }

  const rows = db
    .select()
    .from(masterSantri)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(masterSantri.nama), desc(masterSantri.id))
    .all();

  const mappedRows = rows
    .map(normalizeSantriRecord)
    .filter((row) => {
      if (scopedHalqah) {
        if (!matchesHalqah(row.halqah, scopedHalqah)) return false;
      } else if (halqah && halqah !== "Semua Halqah") {
        if (!matchesHalqah(row.halqah, halqah)) return false;
      }
      if (tingkatan && row.tingkatan !== tingkatan) return false;
      if (status === "Aktif" && !row.statusAktif) return false;
      if (status === "Tidak Aktif" && row.statusAktif) return false;
      return true;
    })
    .sort((a, b) => a.halqah.localeCompare(b.halqah) || a.nama.localeCompare(b.nama));

  res.json({ total: mappedRows.length, data: mappedRows });
});

santriRouter.get("/:id", (req, res) => {
  const santri = findSantriOr404(req.params.id);
  const scoped = scopeHalqah(req.user!);
  if (scoped && !matchesHalqah(santri.halqah, scoped)) {
    throw new HttpError(403, "Santri berada di luar halqah Anda");
  }

  const riwayat = db
    .select()
    .from(dataSantri)
    .where(eq(dataSantri.santriId, santri.id))
    .all()
    .sort(compareDateThenCreatedDesc)
    .slice(0, 20);

  res.json({ santri, riwayat });
});

santriRouter.post(
  "/",
  requireWrite,
  ...requireAdmin,
  validateBody(createSchema),
  (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const now = unixNowSec();

    const existing = db
      .select({ id: masterSantri.id })
      .from(masterSantri)
      .where(eq(masterSantri.nis, body.nis))
      .get();
    if (existing) throw new HttpError(409, `NIS ${body.nis} sudah terdaftar`);

    const inserted = db
      .insert(masterSantri)
      .values({
        ...body,
        id: crypto.randomUUID(),
        className: body.halqah,
        classPesantren: body.halqah,
        statusAktif: "AKTIF",
        createdAt: now,
      })
      .returning()
      .get();

    writeAudit(
      req.user!,
      "santri.create",
      `Menambah santri ${body.nama} (NIS ${body.nis})`
    );
    res.status(201).json({ santri: normalizeSantriRecord(inserted) });
  }
);

santriRouter.put(
  "/:id",
  requireWrite,
  ...requireAdmin,
  validateBody(updateSchema),
  (req, res) => {
    const id = req.params.id;
    const body = req.body as z.infer<typeof updateSchema>;
    const santri = findSantriOr404(id);
    const nextHalqah = body.halqah ?? (santri.halqah === "-" ? null : santri.halqah);

    const updated = db
      .update(masterSantri)
      .set({
        nama: body.nama ?? santri.nama,
        halqah: nextHalqah,
        classPesantren: nextHalqah ?? santri.classPesantren,
        tingkatan: body.tingkatan ?? santri.tingkatan,
        jalur: body.jalur ?? santri.jalur,
        jenisKelamin: body.jenisKelamin ?? santri.jenisKelamin,
        statusAktif: body.statusAktif !== undefined ? (body.statusAktif ? "AKTIF" : "NONAKTIF") : (santri.statusAktif ? "AKTIF" : "NONAKTIF"),
      })
      .where(eq(masterSantri.id, id))
      .returning()
      .get();

    writeAudit(req.user!, "santri.update", `Mengubah data ${santri.nama}`);
    res.json({ santri: normalizeSantriRecord(updated) });
  }
);

santriRouter.patch(
  "/:id/mutasi",
  requireWrite,
  ...requireAdmin,
  validateBody(mutasiSchema),
  (req, res) => {
    const id = req.params.id;
    const body = req.body as z.infer<typeof mutasiSchema>;
    const santri = findSantriOr404(id);

    const updated = db
      .update(masterSantri)
      .set({
        halqah: body.halqah,
        classPesantren: body.halqah,
        tingkatan: body.tingkatan ?? santri.tingkatan,
      })
      .where(eq(masterSantri.id, id))
      .returning()
      .get();

    writeAudit(
      req.user!,
      "santri.mutasi",
      `Mutasi ${santri.nama}: ${santri.halqah} → ${body.halqah}`
    );
    res.json({ santri: normalizeSantriRecord(updated) });
  }
);

santriRouter.delete("/:id", requireWrite, ...requireAdmin, (req, res) => {
  const id = req.params.id;
  const santri = findSantriOr404(id);

  db.delete(dataSantri).where(eq(dataSantri.santriId, id)).run();
  db.delete(dataTasmi).where(eq(dataTasmi.santriId, id)).run();
  db.delete(masterSantri).where(eq(masterSantri.id, id)).run();

  writeAudit(req.user!, "santri.delete", `Menghapus santri ${santri.nama} (NIS ${santri.nis})`);
  res.json({ ok: true });
});
