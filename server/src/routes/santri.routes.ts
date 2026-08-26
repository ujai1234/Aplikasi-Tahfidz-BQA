import { Router } from "express";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { dataSantri, dataTasmi, masterSantri } from "../db/schema";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAdmin, requireAuth, requireWrite, scopeHalqah } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { wibParts } from "../lib/wib";

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

function findSantriOr404(id: number) {
  const santri = db.select().from(masterSantri).where(eq(masterSantri.id, id)).get();
  if (!santri) throw new HttpError(404, "Santri tidak ditemukan");
  return santri;
}

santriRouter.use(requireAuth);

santriRouter.get("/", validateQuery(listQuerySchema), (req, res) => {
  const { halqah, tingkatan, status, q } = res.locals.query as z.infer<
    typeof listQuerySchema
  >;
  const scopedHalqah = scopeHalqah(req.user!);

  const filters = [];
  if (scopedHalqah) {
    filters.push(eq(masterSantri.halqah, scopedHalqah));
  } else if (halqah && halqah !== "Semua Halqah") {
    filters.push(eq(masterSantri.halqah, halqah));
  }
  if (tingkatan) filters.push(eq(masterSantri.tingkatan, tingkatan));
  if (status === "Aktif") filters.push(eq(masterSantri.statusAktif, true));
  if (status === "Tidak Aktif") filters.push(eq(masterSantri.statusAktif, false));
  if (q) {
    filters.push(
      or(like(masterSantri.nama, `%${q}%`), like(masterSantri.nis, `%${q}%`))!
    );
  }

  const rows = db
    .select()
    .from(masterSantri)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(masterSantri.halqah), desc(masterSantri.id))
    .all();

  res.json({ total: rows.length, data: rows });
});

santriRouter.get("/:id", (req, res) => {
  const santri = findSantriOr404(Number(req.params.id));
  const scoped = scopeHalqah(req.user!);
  if (scoped && santri.halqah !== scoped) {
    throw new HttpError(403, "Santri berada di luar halqah Anda");
  }

  const riwayat = db
    .select()
    .from(dataSantri)
    .where(eq(dataSantri.santriId, santri.id))
    .orderBy(desc(dataSantri.tanggal), desc(dataSantri.id))
    .limit(20)
    .all();

  res.json({ santri, riwayat });
});

santriRouter.post(
  "/",
  requireWrite,
  ...requireAdmin,
  validateBody(createSchema),
  (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const now = wibParts().timestamp;

    const existing = db
      .select({ id: masterSantri.id })
      .from(masterSantri)
      .where(eq(masterSantri.nis, body.nis))
      .get();
    if (existing) throw new HttpError(409, `NIS ${body.nis} sudah terdaftar`);

    const inserted = db
      .insert(masterSantri)
      .values({ ...body, statusAktif: true, createdAt: now, updatedAt: now })
      .returning()
      .get();

    writeAudit(
      req.user!,
      "santri.create",
      `Menambah santri ${body.nama} (NIS ${body.nis})`
    );
    res.status(201).json({ santri: inserted });
  }
);

santriRouter.put(
  "/:id",
  requireWrite,
  ...requireAdmin,
  validateBody(updateSchema),
  (req, res) => {
    const id = Number(req.params.id);
    const body = req.body as z.infer<typeof updateSchema>;
    const santri = findSantriOr404(id);

    const updated = db
      .update(masterSantri)
      .set({
        nama: body.nama ?? santri.nama,
        halqah: body.halqah ?? santri.halqah,
        tingkatan: body.tingkatan ?? santri.tingkatan,
        jalur: body.jalur ?? santri.jalur,
        jenisKelamin: body.jenisKelamin ?? santri.jenisKelamin,
        statusAktif: body.statusAktif ?? santri.statusAktif,
        updatedAt: wibParts().timestamp,
      })
      .where(eq(masterSantri.id, id))
      .returning()
      .get();

    writeAudit(req.user!, "santri.update", `Mengubah data ${santri.nama}`);
    res.json({ santri: updated });
  }
);

santriRouter.patch(
  "/:id/mutasi",
  requireWrite,
  ...requireAdmin,
  validateBody(mutasiSchema),
  (req, res) => {
    const id = Number(req.params.id);
    const body = req.body as z.infer<typeof mutasiSchema>;
    const santri = findSantriOr404(id);

    const updated = db
      .update(masterSantri)
      .set({
        halqah: body.halqah,
        tingkatan: body.tingkatan ?? santri.tingkatan,
        updatedAt: wibParts().timestamp,
      })
      .where(eq(masterSantri.id, id))
      .returning()
      .get();

    writeAudit(
      req.user!,
      "santri.mutasi",
      `Mutasi ${santri.nama}: ${santri.halqah} → ${body.halqah}`
    );
    res.json({ santri: updated });
  }
);

santriRouter.delete("/:id", requireWrite, ...requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const santri = findSantriOr404(id);

  db.delete(dataSantri).where(eq(dataSantri.santriId, id)).run();
  db.delete(dataTasmi).where(eq(dataTasmi.santriId, id)).run();
  db.delete(masterSantri).where(eq(masterSantri.id, id)).run();

  writeAudit(req.user!, "santri.delete", `Menghapus santri ${santri.nama} (NIS ${santri.nis})`);
  res.json({ ok: true });
});
