import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/upload";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp)$/.test(name)) return new Response("No encontrado", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(data, {
      headers: {
        "Content-Type": MIME[name.split(".").pop()!],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
