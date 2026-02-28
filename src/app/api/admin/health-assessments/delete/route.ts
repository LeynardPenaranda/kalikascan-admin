import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

type Body = { assessmentId: string };

function toDayKeyFromData(data: any): string | null {
  if (typeof data?.createdDay === "string" && data.createdDay.length >= 10) {
    return data.createdDay.slice(0, 10);
  }

  const ts = data?.createdAt; // Admin Timestamp
  if (ts && typeof ts.toDate === "function") {
    const d = ts.toDate();
    return d ? d.toISOString().slice(0, 10) : null;
  }

  if (typeof data?.createdAtLocal === "number") {
    const d = new Date(data.createdAtLocal);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  return null;
}

async function recomputeLastHealthAssessmentAt() {
  try {
    const snap = await adminDb
      .collection("health_assessments")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const newest = snap.docs[0]?.data() as any | undefined;
    const lastHealthAssessmentAt = newest?.createdAt ?? null;

    await adminDb
      .collection("analytics")
      .doc("global")
      .set({ lastHealthAssessmentAt }, { merge: true });
  } catch (e) {
    console.log("[recomputeLastHealthAssessmentAt] failed:", e);
  }
}

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

    const body = (await req.json().catch(() => ({}))) as Body;

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

    const uid: string | null = typeof data?.uid === "string" ? data.uid : null;
    const createdDay: string | null = toDayKeyFromData(data);

    const success: boolean | null =
      typeof data?.success === "boolean" ? data.success : null;

    const diseaseName: string | null =
      typeof data?.diseaseName === "string" ? data.diseaseName : null;

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

      // decrement per-user counter
      batch.set(
        adminDb.collection("users").doc(uid),
        {
          healthCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    // decrement global analytics
    batch.set(
      adminDb.collection("analytics").doc("global"),
      {
        totalHealthAssessments: FieldValue.increment(-1),
        totalHealthSuccess: FieldValue.increment(success === true ? -1 : 0),
        totalHealthFail: FieldValue.increment(success === false ? -1 : 0),
      },
      { merge: true },
    );

    // daily analytics decrement
    if (createdDay) {
      batch.set(
        adminDb
          .collection("analytics")
          .doc("global")
          .collection("daily")
          .doc(createdDay),
        {
          healthAssessments: FieldValue.increment(-1),
          healthSuccessCount: FieldValue.increment(success === true ? -1 : 0),
          healthFailCount: FieldValue.increment(success === false ? -1 : 0),
          lastUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // disease top decrement
      if (diseaseName) {
        batch.set(
          adminDb
            .collection("analytics")
            .doc("global")
            .collection("diseaseTop")
            .doc(createdDay)
            .collection("diseases")
            .doc(diseaseName),
          {
            count: FieldValue.increment(-1),
            lastUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    await batch.commit();

    // sync dashboard
    await recomputeLastHealthAssessmentAt();

    return NextResponse.json({
      ok: true,
      deletedId: body.assessmentId,
      uid,
      createdDay,
      success,
      diseaseName,
      analyticsUpdated: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Delete failed" },
      { status: 500 },
    );
  }
}
