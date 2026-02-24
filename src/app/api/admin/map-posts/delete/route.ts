import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

type Body = {
  postId: string;
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

    //  only admins
    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as Body;

    if (!body?.postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    //  Global post doc
    const globalRef = adminDb.collection("map_scans").doc(body.postId);
    const snap = await globalRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const data = snap.data() as any;
    const uid: string | null = data?.uid ?? null;

    const batch = adminDb.batch();

    //  delete global
    batch.delete(globalRef);

    //  delete user copy (if you store it there)
    if (uid) {
      // IMPORTANT: change "map_scans" if your user subcollection is named differently
      const userRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("map_scans")
        .doc(body.postId);

      batch.delete(userRef);
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      deletedId: body.postId,
      deletedFromUser: !!uid,
      uid: uid ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Delete failed" },
      { status: 500 },
    );
  }
}
