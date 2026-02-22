import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

function toISO(v: any): string | null {
  try {
    if (!v) return null;

    // already ISO/string
    if (typeof v === "string") return v;

    // JS Date
    if (v instanceof Date) return v.toISOString();

    // Firestore Timestamp (admin SDK)
    if (v instanceof Timestamp) return v.toDate().toISOString();

    // Timestamp-like object (has toDate)
    if (typeof v?.toDate === "function") return v.toDate().toISOString();

    // Serialized timestamp shape { seconds, nanoseconds }
    if (typeof v?.seconds === "number") {
      const ms = v.seconds * 1000 + Math.floor((v.nanoseconds ?? 0) / 1e6);
      return new Date(ms).toISOString();
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);

    // ✅ Only admins can access
    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    // NOTE:
    // If you get an error like "no index" or orderBy failing due to missing fields,
    // either backfill createdAt, or remove orderBy.
    const snap = await adminDb
      .collection("expert_applications")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const applications = snap.docs.map((d) => {
      const data = d.data() as any;

      // ✅ fallback timestamps (so UI won't show "—")
      const createTimeIso =
        typeof (d as any).createTime?.toDate === "function"
          ? (d as any).createTime.toDate().toISOString()
          : null;

      const updateTimeIso =
        typeof (d as any).updateTime?.toDate === "function"
          ? (d as any).updateTime.toDate().toISOString()
          : null;

      const createdAt = toISO(data.createdAt) ?? createTimeIso;
      const reviewedAt = toISO(data.reviewedAt) ?? updateTimeIso;

      return {
        id: d.id,
        uid: data.uid ?? null,
        displayName: data.displayName ?? null,
        email: data.email ?? null,
        phoneNumber: data.phoneNumber ?? null,
        location: data.location ?? null,
        organization: data.organization ?? null,
        profession: data.profession ?? null,
        specialization: data.specialization ?? null,
        yearsExperience:
          typeof data.yearsExperience === "number"
            ? data.yearsExperience
            : null,
        credentialsLink: data.credentialsLink ?? null,
        note: data.note ?? null,
        adminNote: data.adminNote ?? null,
        status: (data.status ?? "pending") as string,

        createdAt,
        reviewedAt,
        reviewedBy: data.reviewedBy ?? null,
      };
    });

    return NextResponse.json({ applications });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
