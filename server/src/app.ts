import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { env } from "./env";
import { HttpError } from "./lib/errors";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { santriRouter } from "./routes/santri.routes";
import { evaluasiRouter } from "./routes/evaluasi.routes";
import { absensiRouter } from "./routes/absensi.routes";
import { tasmiRouter } from "./routes/tasmi.routes";
import { settingsRouter } from "./routes/settings.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { backupRouter } from "./routes/backup.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
  app.use(express.json({ limit: "1mb" }));

  app.use((req, _res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.originalUrl}`);
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "BQA Tahfidz API", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/santri", santriRouter);
  app.use("/api/evaluasi", evaluasiRouter);
  app.use("/api/absensi", absensiRouter);
  app.use("/api/tasmi", tasmiRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/backup", backupRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan" });
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Validasi gagal",
          details: err.flatten().fieldErrors,
        });
        return;
      }
      console.error("[error]", err);
      res.status(500).json({ error: "Terjadi kesalahan internal server" });
    }
  );

  return app;
}
