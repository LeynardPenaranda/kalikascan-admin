import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { deletePlantIdIdentification } from "@/src/lib/plantid/deleteIdentification";
import { deleteFlorinConversation } from "@/src/lib/plantid/deleteFlorinConversation";

export const runtime = "nodejs";

type Body = { scanId: string };

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

    const accessToken: string | null =
      data?.accessToken ??
      data?.plantIdAccessToken ??
      data?.plantId?.accessToken ??
      null;

    // Best-effort: delete conversation
    let convoDeleted = false;
    let convoDeleteError: string | null = null;

    try {
      await deleteFlorinConversation(accessToken);
      convoDeleted = !!accessToken;
    } catch (e: any) {
      convoDeleteError = e?.message ?? "Conversation delete failed";
    }

    // Best-effort: delete identification
    let plantIdDeleted = false;
    let plantIdDeleteError: string | null = null;

    try {
      await deletePlantIdIdentification(accessToken);
      plantIdDeleted = !!accessToken;
    } catch (e: any) {
      plantIdDeleteError = e?.message ?? "Plant.id delete failed";
    }

    // Delete Firestore docs
    const batch = adminDb.batch();
    batch.delete(globalRef);

    if (uid) {
      const userRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("plant_scans")
        .doc(body.scanId);
      batch.delete(userRef);
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      deletedId: body.scanId,
      deletedFromUser: !!uid,
      plantId: {
        hadAccessToken: !!accessToken,
        conversation: {
          deleted: convoDeleted || !accessToken,
          error: convoDeleteError,
        },
        identification: {
          deleted: plantIdDeleted || !accessToken,
          error: plantIdDeleteError,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Delete failed" },
      { status: 500 },
    );
  }
}
