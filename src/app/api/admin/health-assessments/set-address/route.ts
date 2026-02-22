import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessmentId, addressText } = body || {};

    if (!assessmentId || typeof addressText !== "string") {
      return NextResponse.json(
        { error: "assessmentId and addressText are required" },
        { status: 400 },
      );
    }

    await adminDb
      .collection("health_assessments")
      .doc(assessmentId)
      .set({ addressText }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[set-address POST] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to set address" },
      { status: 500 },
    );
  }
}
