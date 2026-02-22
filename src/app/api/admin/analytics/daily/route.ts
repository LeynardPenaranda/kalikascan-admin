import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") ?? "30");
    const take = Number.isFinite(days) ? Math.min(Math.max(days, 1), 365) : 30;

    //  no orderBy = no index prompt
    const snap = await adminDb.collection("analytics/global/daily").get();

    const docs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      // sort by doc id string YYYY-MM-DD
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .slice(Math.max(0, snap.size - take));

    return NextResponse.json({ ok: true, data: docs });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed to load daily analytics" },
      { status: 500 },
    );
  }
}
