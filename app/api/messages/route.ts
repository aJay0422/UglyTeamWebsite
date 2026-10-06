import { NextResponse, type NextRequest } from "next/server";

import {
  addMessage,
  listMessages,
  MESSAGE_MAX_LEN,
} from "@/lib/message-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slot = req.nextUrl.searchParams.get("slot");
  const map = await listMessages();
  const body = slot ? map[slot] ?? [] : map;
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let body: { slot?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const slot = body.slot;
  const text = body.text;
  if (typeof slot !== "string" || !slot) {
    return NextResponse.json({ error: "slot required" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const message = await addMessage(slot, text.slice(0, MESSAGE_MAX_LEN));
  return NextResponse.json({ message });
}
