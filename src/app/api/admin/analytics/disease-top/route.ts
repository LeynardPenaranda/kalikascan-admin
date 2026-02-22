import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export async function GET() {
  try {
    // Collection: /analytics/global/diseaseTop
    const diseaseTopCol = adminDb.collection("analytics/global/diseaseTop");
    const snap = await diseaseTopCol.get();

    if (snap.empty) {
      return NextResponse.json({ ok: true, date: "", data: [] });
    }

    // Latest date doc id like "2026-02-21"
    const latestDate = snap.docs
      .map((d) => d.id)
      .sort((a, b) => String(b).localeCompare(String(a)))[0];

    // Subcollection: /analytics/global/diseaseTop/<date>/diseases
    const diseasesCol = adminDb.collection(
      `analytics/global/diseaseTop/${latestDate}/diseases`,
    );

    const diseasesSnap = await diseasesCol.get();

    const rows = diseasesSnap.docs
      .map((d) => {
        const x = d.data() as any;
        return {
          name: d.id, // e.g. "nutrient deficiency"
          count: Number(x.count ?? 0) || 0, // ✅ uses your field "count"
          lastUpdatedAt: x.lastUpdatedAt ?? null,
        };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      date: latestDate,
      data: rows,
      debug: {
        diseaseTopDatesFound: snap.docs.map((d) => d.id),
        diseasesFound: diseasesSnap.docs.map((d) => d.id),
      },
    });
  } catch (e: any) {
    console.error("disease-top route error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed to load diseaseTop" },
      { status: 500 },
    );
  }
}
