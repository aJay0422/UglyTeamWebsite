import { promises as fs } from "fs";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";

import { uploadsDir } from "@/lib/photo-store";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const safe = path.basename(file); // 防目录穿越
  if (!safe || safe.startsWith(".")) {
    return new NextResponse("not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(path.join(uploadsDir(), safe));
    const ext = safe.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
