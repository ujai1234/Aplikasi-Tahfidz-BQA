import { db } from "../db";
import { auditLogs } from "../db/schema";
import { wibParts } from "./wib";

export interface AuditActor {
  id?: number;
  username: string;
}

export function writeAudit(
  actor: AuditActor | null,
  action: string,
  detail?: string
): void {
  db.insert(auditLogs)
    .values({
      userId: actor?.id ?? null,
      username: actor?.username ?? "system",
      action,
      detail: detail ?? null,
      createdAt: wibParts().timestamp,
    })
    .run();
}
