import { Router } from "express";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword } from "../lib/auth";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { publicUser } from "./auth.routes";
import { wibParts } from "../lib/wib";

export const usersRouter = Router();

const listQuerySchema = z.object({
  role: z.enum(["Admin", "Ustadz", "Ustadzah", "Kepsek"]).optional(),
  halqah: z.string().optional(),
  status: z.enum(["Aktif", "Nonaktif"]).optional(),
  q: z.string().optional(),
});

const createSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-z0-9.]+$/i, "Username hanya huruf, angka & titik"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nama: z.string().min(1, "Nama wajib diisi"),
  role: z.enum(["Admin", "Ustadz", "Ustadzah", "Kepsek"]),
  halqah: z.string().nullish(),
  email: z.string().email("Format email tidak valid").nullish(),
  lembaga: z.string().nullish(),
});

const updateSchema = z.object({
  nama: z.string().min(1).optional(),
  role: z.enum(["Admin", "Ustadz", "Ustadzah", "Kepsek"]).optional(),
  halqah: z.string().nullish(),
  email: z.string().email("Format email tidak valid").nullish(),
  lembaga: z.string().nullish(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
});

const statusSchema = z.object({
  status: z.enum(["Aktif", "Nonaktif"]),
});

function findUserOr404(id: number) {
  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) throw new HttpError(404, "User tidak ditemukan");
  return user;
}

usersRouter.use(...requireAdmin);

usersRouter.get("/", validateQuery(listQuerySchema), (req, res) => {
  const { role, halqah, status, q } = res.locals.query as z.infer<typeof listQuerySchema>;
  const filters = [];
  if (role) filters.push(eq(users.role, role));
  if (halqah) filters.push(eq(users.halqah, halqah));
  if (status) filters.push(eq(users.status, status));
  if (q) {
    filters.push(
      or(
        like(users.nama, `%${q}%`),
        like(users.username, `%${q}%`),
        like(users.email, `%${q}%`)
      )!
    );
  }

  const rows = db
    .select()
    .from(users)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(users.role), desc(users.id))
    .all();

  res.json({ total: rows.length, data: rows.map(publicUser) });
});

usersRouter.post("/", validateBody(createSchema), (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const now = wibParts().timestamp;

  const existing = db
    .select({ id: users.id })
    .from(users)
    .where(
      body.email
        ? or(eq(users.username, body.username), eq(users.email, body.email))
        : eq(users.username, body.username)
    )
    .get();

  if (existing) {
    throw new HttpError(409, "Username atau email sudah digunakan");
  }

  const inserted = db
    .insert(users)
    .values({
      username: body.username,
      passwordHash: hashPassword(body.password),
      nama: body.nama,
      role: body.role,
      halqah: body.halqah ?? null,
      email: body.email ?? null,
      lembaga: body.lembaga ?? null,
      status: "Aktif",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  writeAudit(req.user!, "user.create", `Menambah user ${body.username}`);
  res.status(201).json({ user: publicUser(inserted) });
});

usersRouter.get("/:id", (req, res) => {
  res.json({ user: publicUser(findUserOr404(Number(req.params.id))) });
});

usersRouter.put("/:id", validateBody(updateSchema), (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as z.infer<typeof updateSchema>;
  const user = findUserOr404(id);

  const updated = db
    .update(users)
    .set({
      nama: body.nama ?? user.nama,
      role: body.role ?? user.role,
      halqah: body.halqah !== undefined ? body.halqah : user.halqah,
      email: body.email !== undefined ? body.email : user.email,
      lembaga: body.lembaga !== undefined ? body.lembaga : user.lembaga,
      passwordHash: body.password ? hashPassword(body.password) : user.passwordHash,
      updatedAt: wibParts().timestamp,
    })
    .where(eq(users.id, id))
    .returning()
    .get();

  writeAudit(req.user!, "user.update", `Mengubah user ${user.username}`);
  res.json({ user: publicUser(updated) });
});

usersRouter.patch("/:id/status", validateBody(statusSchema), (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as z.infer<typeof statusSchema>;
  const user = findUserOr404(id);

  if (user.id === req.user!.id) {
    throw new HttpError(400, "Tidak dapat menonaktifkan akun sendiri");
  }

  const updated = db
    .update(users)
    .set({ status, updatedAt: wibParts().timestamp })
    .where(eq(users.id, id))
    .returning()
    .get();

  writeAudit(
    req.user!,
    "user.status",
    `${status === "Aktif" ? "Mengaktifkan" : "Menonaktifkan"} akun ${user.username}`
  );
  res.json({ user: publicUser(updated) });
});

usersRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = findUserOr404(id);

  if (user.id === req.user!.id) {
    throw new HttpError(400, "Tidak dapat menghapus akun sendiri");
  }
  if (user.role === "Admin") {
    const admins = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "Admin"))
      .all();
    if (admins.length <= 1) {
      throw new HttpError(400, "Minimal harus tersisa satu Admin");
    }
  }

  db.delete(users).where(eq(users.id, id)).run();
  writeAudit(req.user!, "user.delete", `Menghapus user ${user.username}`);
  res.json({ ok: true });
});
