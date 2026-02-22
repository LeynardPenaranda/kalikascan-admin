import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

type Row = {
  date: string; // YYYY-MM-DD
  totalDiseaseCount: number; // sum of disease counts for that date
  topDisease: string | null; // most frequent disease name for that date
  topDiseaseCount: number; // count of top disease
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("days") ?? "30");
    const maxDays = Number.isFinite(take)
      ? Math.min(Math.max(take, 1), 365)
      : 30;

    // ✅ collectionGroup finds all ".../diseases/*" docs under any date
    const snap = await adminDb.collectionGroup("diseases").get();

    // Group by date using the document path:
    // analytics/global/diseaseTop/{date}/diseases/{diseaseName}
    const byDate = new Map<
      string,
      { total: number; bestName: string | null; bestCount: number }
    >();

    for (const doc of snap.docs) {
      const path = doc.ref.path; // string path
      // Expected: analytics/global/diseaseTop/2026-02-21/diseases/nutrient deficiency
      const parts = path.split("/");
      const diseaseTopIndex = parts.indexOf("diseaseTop");
      const diseasesIndex = parts.indexOf("diseases");

      if (diseaseTopIndex === -1 || diseasesIndex === -1) continue;
      const date = parts[diseaseTopIndex + 1] ?? null;
      const diseaseName = parts[diseasesIndex + 1] ?? doc.id;

      if (!date) continue;

      const data = doc.data() as any;
      const count = Number(data.count ?? 0) || 0;

      const cur = byDate.get(date) ?? {
        total: 0,
        bestName: null,
        bestCount: 0,
      };
      cur.total += count;

      if (count > cur.bestCount) {
        cur.bestCount = count;
        cur.bestName = diseaseName;
      }

      byDate.set(date, cur);
    }

    // Convert to sorted series
    const series: Row[] = Array.from(byDate.entries())
      .map(([date, v]) => ({
        date,
        totalDiseaseCount: v.total,
        topDisease: v.bestName,
        topDiseaseCount: v.bestCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // last N days from available dates (not actual calendar days)
    const sliced = series.slice(Math.max(0, series.length - maxDays));

    return NextResponse.json({ ok: true, data: sliced });
  } catch (e: any) {
    console.error("disease-top-timeseries route error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "Failed to load disease top timeseries",
      },
      { status: 500 },
    );
  }
}
