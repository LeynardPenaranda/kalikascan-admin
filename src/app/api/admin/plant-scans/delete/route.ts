import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { deletePlantIdIdentification } from "@/src/lib/plantid/deleteIdentification";
import { deleteFlorinConversation } from "@/src/lib/plantid/deleteFlorinConversation";

export const runtime = "nodejs";

type Body = { scanId: string };

function toDayKeyFromData(data: any): string | null {
  if (typeof data?.createdDay === "string" && data.createdDay.length >= 10) {
    return data.createdDay.slice(0, 10);
  }

  const ts = data?.createdAt;
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

async function recomputeLastPlantScanAt() {
  const snap = await adminDb
    .collection("plant_scans")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const newest = snap.docs[0]?.data();
  const lastPlantScanAt = newest?.createdAt ?? null;

  await adminDb
    .collection("analytics")
    .doc("global")
    .set({ lastPlantScanAt }, { merge: true });
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

    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    if (!body?.scanId) {
      return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
    }

    const globalRef = adminDb.collection("plant_scans").doc(body.scanId);
    const snap = await globalRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const data = snap.data() as any;

    const uid: string | null = data?.uid ?? null;
    const createdDay = toDayKeyFromData(data);
    const success: boolean | null = data?.success ?? null;

    const accessToken: string | null =
      data?.accessToken ??
      data?.plantIdAccessToken ??
      data?.plantId?.accessToken ??
      null;

    // Best-effort cleanup
    try {
      if (accessToken) await deleteFlorinConversation(accessToken);
    } catch {}
    try {
      if (accessToken) await deletePlantIdIdentification(accessToken);
    } catch {}

    const batch = adminDb.batch();

    // Delete docs
    batch.delete(globalRef);

    if (uid) {
      const userRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("plant_scans")
        .doc(body.scanId);

      batch.delete(userRef);

      batch.set(
        adminDb.collection("users").doc(uid),
        {
          scanCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    // Decrement analytics
    batch.set(
      adminDb.collection("analytics").doc("global"),
      {
        totalPlantScans: FieldValue.increment(-1),
        totalPlantScanSuccess: FieldValue.increment(success === true ? -1 : 0),
        totalPlantScanFail: FieldValue.increment(success === false ? -1 : 0),
      },
      { merge: true },
    );

    if (createdDay) {
      batch.set(
        adminDb
          .collection("analytics")
          .doc("global")
          .collection("daily")
          .doc(createdDay),
        {
          plantScans: FieldValue.increment(-1),
          successCount: FieldValue.increment(success === true ? -1 : 0),
          failCount: FieldValue.increment(success === false ? -1 : 0),
          lastUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();

    await recomputeLastPlantScanAt();

    return NextResponse.json({
      ok: true,
      deletedId: body.scanId,
      analyticsUpdated: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Delete failed" },
      { status: 500 },
    );
  }
}
