import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { scanId, addressText } = body ?? {};

  if (!scanId || typeof addressText !== "string" || !addressText.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await adminDb.collection("plant_scans").doc(scanId).update({
    addressText,
  });

  return NextResponse.json({ ok: true });
}
