// @ts-nocheck
import { Router } from "express";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { dataTasmi, masterSantri } from "../db/schema";
import { hitungPredikat } from "../lib/tasmi";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAdmin, requireAuth, requireWrite, scopeHalqah } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { wibParts } from "../lib/wib";

import { checkTasmiWindow, getSettings } from "../lib/settings";

export const tasmiRouter = Router();

const listQuerySchema = z.object({
  halqah: z.string().optional(),
  jenis: z.enum(["Pekanan", "Per 3 Bulan", "Per 6 Bulan"]).optional(),
  kelulusan: z.enum(["Lulus", "Tidak Lulus"]).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const createSchema = z.object({
  santriId: z.string(),
  jenisTasmi: z.enum(["Pekanan", "Per 3 Bulan", "Per 6 Bulan"]),
  nilai: z.coerce.number().int().min(0, "Nilai minimal 0").max(100, "Nilai maksimal 100"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional(),
  catatan: z.string().nullish(),
  penguji: z.string().nullish(),
});

tasmiRouter.use(requireAuth);

tasmiRouter.get("/status", (req, res) => {
  const now = wibParts();
  const isFriday = now.day === 5;
  const settings = getSettings();
  const periodicUnlocked = settings.tasmi_unlock_periodic === "1";

  const pekanan = checkTasmiWindow("Pekanan", req.user!.role, now);
  const per3Bulan = checkTasmiWindow("Per 3 Bulan", req.user!.role, now);
  const per6Bulan = checkTasmiWindow("Per 6 Bulan", req.user!.role, now);

  res.json({
    isFriday,
    periodicUnlocked,
    pekanan,
    per3Bulan,
    per6Bulan,
  });
});

tasmiRouter.get("/", validateQuery(listQuerySchema), (req, res) => {
  const { halqah, jenis, kelulusan, q, limit } = res.locals.query as z.infer<
    typeof listQuerySchema
  >;
  const scopedHalqah = scopeHalqah(req.user!);

  const filters = [];
  if (scopedHalqah) filters.push(eq(masterSantri.halqah, scopedHalqah));
  else if (halqah && halqah !== "Semua Halqah") filters.push(eq(masterSantri.halqah, halqah));
  if (jenis) filters.push(eq(dataTasmi.jenisTasmi, jenis));
  
  if (kelulusan) {
    const isPassed = kelulusan === "Lulus";
    filters.push(eq(dataTasmi.statusKelulusan, isPassed));
  }
  
  if (q) filters.push(like(masterSantri.nama, `%${q}%`));

  const rows = db
    .select({
      id: dataTasmi.id,
      tanggal: dataTasmi.tanggal,
      santriId: dataTasmi.santriId,
      jenisTasmi: dataTasmi.jenisTasmi,
      nilai: dataTasmi.nilai,
      predikat: dataTasmi.predikat,
      statusKelulusan: dataTasmi.statusKelulusan,
      penguji: dataTasmi.penguji,
      createdAt: dataTasmi.createdAt,
      namaSantri: masterSantri.nama,
      tingkatan: masterSantri.tingkatan,
      halqah: masterSantri.halqah,
    })
    .from(dataTasmi)
    .innerJoin(masterSantri, eq(dataTasmi.santriId, masterSantri.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(dataTasmi.tanggal), desc(dataTasmi.id))
    .limit(limit)
    .all();

  const mappedRows = rows.map(r => ({
    ...r,
    statusKelulusan: r.statusKelulusan ? "Lulus" : "Tidak Lulus",
    catatan: null,
    createdBy: r.penguji
  }));

  const lulus = mappedRows.filter((r) => r.statusKelulusan === "Lulus").length;
  const rataRata = mappedRows.length
    ? Math.round((mappedRows.reduce((sum, r) => sum + r.nilai, 0) / mappedRows.length) * 10) / 10
    : 0;

  res.json({
    total: mappedRows.length,
    lulus,
    persenLulus: mappedRows.length ? Math.round((lulus / mappedRows.length) * 100) : 0,
    rataRata,
    data: mappedRows,
  });
});

tasmiRouter.post("/", requireWrite, validateBody(createSchema), (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;

  const windowCheck = checkTasmiWindow(body.jenisTasmi, req.user!.role);
  if (!windowCheck.open) {
    throw new HttpError(403, windowCheck.reason ?? "Input Ujian Tasmi' sedang dikunci.");
  }

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

  const { predikat, lulus } = hitungPredikat(body.nilai);
  const now = wibParts();

  const inserted = db
    .insert(dataTasmi)
    .values({
      tanggal: body.tanggal ?? now.date,
      santriId: santri.id,
      jenisTasmi: body.jenisTasmi,
      nilai: body.nilai,
      predikat,
      statusKelulusan: lulus,
      penguji: body.penguji ?? req.user!.nama,
      createdAt: now.timestamp,
    })
    .returning()
    .get();

  writeAudit(
    req.user!,
    "tasmi.create",
    `Nilai tasmi' ${santri.nama}: ${body.nilai} (${predikat})`
  );
  res.status(201).json({ tasmi: inserted });
});

tasmiRouter.delete("/:id", requireWrite, ...requireAdmin, (req, res) => {
  const id = req.params.id;
  
  const row = db.select({
    id: dataTasmi.id,
    nilai: dataTasmi.nilai,
    namaSantri: masterSantri.nama
  }).from(dataTasmi).innerJoin(masterSantri, eq(dataTasmi.santriId, masterSantri.id)).where(eq(dataTasmi.id, id)).get();
  
  if (!row) throw new HttpError(404, "Data tasmi' tidak ditemukan");

  db.delete(dataTasmi).where(eq(dataTasmi.id, id)).run();
  writeAudit(
    req.user!,
    "tasmi.delete",
    `Menghapus nilai tasmi' ${row.namaSantri} (${row.nilai})`
  );
  res.json({ ok: true });
});
