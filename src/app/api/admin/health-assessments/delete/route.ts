import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

type Body = {
  assessmentId: string;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);

    // only admins
    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as Body;

    if (!body?.assessmentId) {
      return NextResponse.json(
        { error: "Missing assessmentId" },
        { status: 400 },
      );
    }

    const globalRef = adminDb
      .collection("health_assessments")
      .doc(body.assessmentId);
    const snap = await globalRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 },
      );
    }

    const data = snap.data() as any;
    const uid = data?.uid ?? null;

    const batch = adminDb.batch();

    // delete global doc
    batch.delete(globalRef);

    // delete user copy (if exists)
    if (uid) {
      const userRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("health_assessments")
        .doc(body.assessmentId);

      batch.delete(userRef);
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      deletedId: body.assessmentId,
      deletedFromUser: !!uid,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Delete failed" },
      { status: 500 },
    );
  }
}
