import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

// En local los archivos se guardan en /uploads. En el hosting se reemplaza por Cloudinary o R2.
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 3 * 1024 * 1024;

export async function saveImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) throw new Error("La imagen debe ser JPG, PNG o WEBP.");
  if (file.size > MAX_BYTES) throw new Error("La imagen no puede pesar más de 3 MB.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/api/files/${name}`;
}
