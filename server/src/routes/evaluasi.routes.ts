import { Router } from "express";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { dataSantri, masterSantri } from "../db/schema";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAdmin, requireAuth, requireWrite, scopeHalqah } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { checkEvaluasiWindow } from "../lib/settings";
import { wibParts } from "../lib/wib";

export const evaluasiRouter = Router();

const listQuerySchema = z.object({
  tanggal: z.string().optional(),
  halqah: z.string().optional(),
  status: z.enum(["Tuntas", "Sedang", "Recovery"]).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const createSchema = z.object({
  santriId: z.coerce.number().int().positive(),
  sesi: z.enum(["Subuh", "Maghrib"]),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional(),
  statusCapaian: z.enum(["Tuntas", "Sedang", "Recovery"]),
  penyebab: z.string().nullish(),
  targetJuz: z.string().nullish(),
  catatan: z.string().nullish(),
});

evaluasiRouter.use(requireAuth);

evaluasiRouter.get("/", validateQuery(listQuerySchema), (req, res) => {
  const { tanggal, halqah, status, q, limit } = res.locals.query as z.infer<
    typeof listQuerySchema
  >;
  const scopedHalqah = scopeHalqah(req.user!);

  const filters = [];
  if (scopedHalqah) filters.push(eq(dataSantri.halqah, scopedHalqah));
  else if (halqah && halqah !== "Semua Halqah") filters.push(eq(dataSantri.halqah, halqah));
  if (tanggal) filters.push(eq(dataSantri.tanggal, tanggal));
  if (status) filters.push(eq(dataSantri.statusCapaian, status));
  if (q) filters.push(like(dataSantri.namaSantri, `%${q}%`));

  const rows = db
    .select()
    .from(dataSantri)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(dataSantri.tanggal), desc(dataSantri.id))
    .limit(limit)
    .all();

  res.json({ total: rows.length, data: rows });
});

evaluasiRouter.post("/", requireWrite, validateBody(createSchema), (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;

  const santri = db
    .select()
    .from(masterSantri)
    .where(eq(masterSantri.id, body.santriId))
    .get();
  if (!santri) throw new HttpError(404, "Santri tidak ditemukan");

  const scoped = scopeHalqah(req.user!);
  if (scoped && santri.halqah !== scoped) {
    throw new HttpError(403, `Santri bukan anggota halqah Anda (${scoped})`);
  }

  if (req.user!.role !== "Admin") {
    const window = checkEvaluasiWindow(body.sesi);
    if (!window.open) throw new HttpError(403, window.reason!);
  }

  const now = wibParts();
  const inserted = db
    .insert(dataSantri)
    .values({
      tanggal: body.tanggal ?? now.date,
      sesi: body.sesi,
      santriId: santri.id,
      namaSantri: santri.nama,
      tingkatan: santri.tingkatan,
      halqah: santri.halqah,
      jalur: santri.jalur,
      statusCapaian: body.statusCapaian,
      penyebab: body.penyebab ?? null,
      targetJuz:
        body.targetJuz ?? `Juz ${Math.max(25, 31 - santri.tingkatan)}`,
      catatan: body.catatan ?? null,
      createdBy: req.user!.nama,
      createdAt: now.timestamp,
    })
    .returning()
    .get();

  writeAudit(
    req.user!,
    "evaluasi.create",
    `Evaluasi ${santri.nama} (${body.statusCapaian}, sesi ${body.sesi})`
  );
  res.status(201).json({ evaluasi: inserted });
});

evaluasiRouter.delete("/:id", requireWrite, ...requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const row = db.select().from(dataSantri).where(eq(dataSantri.id, id)).get();
  if (!row) throw new HttpError(404, "Catatan evaluasi tidak ditemukan");

  db.delete(dataSantri).where(eq(dataSantri.id, id)).run();
  writeAudit(req.user!, "evaluasi.delete", `Menghapus evaluasi ${row.namaSantri} (${row.tanggal})`);
  res.json({ ok: true });
});

evaluasiRouter.get("/target", (req, res) => {
  const tingkatan = Number(req.query.tingkatan ?? 1);
  res.json({
    tingkatan,
    targetJuz: `Juz ${Math.max(25, 31 - tingkatan)}`,
    keterangan: `Target kurikulum tingkat ${tingkatan}`,
  });
});
