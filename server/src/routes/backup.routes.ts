import { Router } from "express";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  absensiUstadz,
  auditLogs,
  dataSantri,
  dataTasmi,
  masterSantri,
  settings,
  users,
} from "../db/schema";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { wibParts } from "../lib/wib";

export const backupRouter = Router();

const resetSchema = z.object({
  konfirmasi: z.literal("RESET", {
    message: "Konfirmasi harus tepat berbunyi RESET",
  }),
});

backupRouter.get("/backup", ...requireAdmin, (req, res) => {
  const dump = {
    meta: {
      aplikasi: "Sistem Tahfidz & Absensi — Baitul Qur'an Al-Ikhwan",
      dibuatPada: wibParts().timestamp,
      dibuatOleh: req.user!.username,
    },
    users: db.select().from(users).all().map(({ passwordHash: _hash, ...rest }) => rest),
    masterSantri: db.select().from(masterSantri).all(),
    dataSantri: db.select().from(dataSantri).all(),
    absensiUstadz: db.select().from(absensiUstadz).all(),
    dataTasmi: db.select().from(dataTasmi).all(),
    settings: db.select().from(settings).all(),
  };

  writeAudit(req.user!, "backup", "Mengunduh backup JSON");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="bqa-backup-${wibParts().date}.json"`
  );
  res.json(dump);
});

backupRouter.post(
  "/reset",
  ...requireAdmin,
  validateBody(resetSchema),
  (req, res) => {
    const counts = {
      evaluasi: db.select().from(dataSantri).all().length,
      tasmi: db.select().from(dataTasmi).all().length,
      presensi: db.select().from(absensiUstadz).all().length,
    };

    db.delete(dataSantri).run();
    db.delete(dataTasmi).run();
    db.delete(absensiUstadz).run();

    writeAudit(
      req.user!,
      "reset",
      `Reset data: ${counts.evaluasi} evaluasi, ${counts.tasmi} tasmi, ${counts.presensi} presensi`
    );
    res.json({ ok: true, dihapus: counts });
  }
);

backupRouter.get("/logs", ...requireAdmin, (req, res) => {
  const rows = db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.id))
    .limit(100)
    .all();
  res.json({ total: rows.length, data: rows });
});
