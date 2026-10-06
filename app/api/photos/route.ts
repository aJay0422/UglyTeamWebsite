import { NextResponse, type NextRequest } from "next/server";

import {
  deletePhoto,
  listPhotos,
  savePhoto,
  type PhotoMap,
} from "@/lib/photo-store";
import { deleteMessages } from "@/lib/message-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

function fileUrl(file: string): string {
  return `/api/uploads/${encodeURIComponent(file)}`;
}

function toClient(map: PhotoMap) {
  const out: Record<string, { url: string; thumbUrl: string; updatedAt: number }> = {};
  for (const [slot, entry] of Object.entries(map)) {
    out[slot] = {
      url: fileUrl(entry.file),
      thumbUrl: fileUrl(entry.thumb ?? entry.file),
      updatedAt: entry.updatedAt,
    };
  }
  return out;
}

function extFromType(type: string): string {
  const sub = (type.split("/")[1] ?? "jpg").toLowerCase();
  const clean = sub === "jpeg" ? "jpg" : sub.replace(/[^a-z0-9]/g, "");
  return `.${clean || "jpg"}`;
}

export async function GET() {
  const map = await listPhotos();
  return NextResponse.json(toClient(map), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid form" }, { status: 400 });
  }

  const slot = form.get("slot");
  const file = form.get("file");
  const thumb = form.get("thumb");

  if (typeof slot !== "string" || !slot) {
    return NextResponse.json({ error: "slot required" }, { status: 400 });
  }
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "image required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (<=8MB)" }, { status: 413 });
  }

  const original = {
    buffer: Buffer.from(await file.arrayBuffer()),
    ext: extFromType(file.type),
  };

  let thumbInput: { buffer: Buffer; ext: string } | undefined;
  if (thumb instanceof File && thumb.type.startsWith("image/") && thumb.size <= MAX_BYTES) {
    thumbInput = {
      buffer: Buffer.from(await thumb.arrayBuffer()),
      ext: extFromType(thumb.type),
    };
  }

  const entry = await savePhoto(slot, original, thumbInput);
  return NextResponse.json({
    entry: {
      url: fileUrl(entry.file),
      thumbUrl: fileUrl(entry.thumb ?? entry.file),
      updatedAt: entry.updatedAt,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const slot = req.nextUrl.searchParams.get("slot");
  if (!slot) {
    return NextResponse.json({ error: "slot required" }, { status: 400 });
  }
  await deletePhoto(slot);
  // 删除照片时，一并删除该窗户的留言
  await deleteMessages(slot);
  return NextResponse.json({ ok: true });
}
