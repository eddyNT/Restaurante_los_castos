import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";

export async function audit(userId: string, action: string, entity: string, entityId?: string, changes?: Prisma.InputJsonValue) {
  await db.auditLog.create({ data: { userId, action, entity, entityId, changes } });
}
