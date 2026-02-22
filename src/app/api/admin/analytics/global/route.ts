import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export async function GET() {
  try {
    const ref = adminDb.doc("analytics/global");
    const snap = await ref.get();
    return NextResponse.json({
      ok: true,
      data: snap.exists ? snap.data() : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed to load analytics/global" },
      { status: 500 },
    );
  }
}
