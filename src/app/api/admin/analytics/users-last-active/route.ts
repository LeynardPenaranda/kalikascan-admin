import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? "10");
    const limitN = Number.isFinite(take) ? Math.min(Math.max(take, 1), 50) : 10;

    const snap = await adminDb
      .collection("users")
      .orderBy("lastActiveAt", "desc")
      .limit(limitN)
      .get();

    const data = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed to load users" },
      { status: 500 },
    );
  }
}
