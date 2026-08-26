import { Router } from "express";
import { z } from "zod";
import { getSettings, SETTING_DEFAULTS, SETTING_KEYS, setSetting } from "../lib/settings";
import { writeAudit } from "../lib/audit";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

export const settingsRouter = Router();

const updateSchema = z.object({
  values: z.record(z.string().min(1), z.string().min(1)),
});

settingsRouter.get("/", requireAuth, (req, res) => {
  res.json({ settings: getSettings(), keys: SETTING_KEYS });
});

settingsRouter.put("/", ...requireAdmin, validateBody(updateSchema), (req, res) => {
  const { values } = req.body as z.infer<typeof updateSchema>;

  const changed: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (!SETTING_KEYS.includes(key)) continue;
    setSetting(key, value);
    changed.push(key);
  }

  if (changed.length === 0) {
    res.status(400).json({ error: "Tidak ada key pengaturan yang valid", validKeys: SETTING_KEYS });
    return;
  }

  writeAudit(req.user!, "settings.update", `Mengubah: ${changed.join(", ")}`);
  res.json({ settings: getSettings(), changed });
});
