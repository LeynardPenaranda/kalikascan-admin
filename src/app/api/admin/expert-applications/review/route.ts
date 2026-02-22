import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

type Body = {
  applicationId: string;
  uid: string;
  status: "approved" | "rejected";
  adminNote: string | null;
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

    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as Body;

    if (!body?.applicationId || !body?.uid || !body?.status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const appRef = adminDb
      .collection("expert_applications")
      .doc(body.applicationId);

    const userRef = adminDb.collection("users").doc(body.uid);
    //  THIS is the doc you showed:
    const userAppRef = userRef
      .collection("expert_applications")
      .doc(body.applicationId);

    await adminDb.runTransaction(async (tx) => {
      const [appSnap, userSnap, userAppSnap] = await Promise.all([
        tx.get(appRef),
        tx.get(userRef),
        tx.get(userAppRef),
      ]);

      if (!appSnap.exists) throw new Error("Global application not found");
      if (!userSnap.exists) throw new Error("User not found");
      if (!userAppSnap.exists)
        throw new Error("User application doc not found");

      const appData = appSnap.data() as any;
      const userAppData = userAppSnap.data() as any;

      //  Ensure both docs belong to the uid
      const globalUid = appData?.uid;
      const nestedUid = userAppData?.uid;

      if (!globalUid || globalUid !== body.uid) {
        throw new Error("UID mismatch (global application)");
      }
      if (!nestedUid || nestedUid !== body.uid) {
        throw new Error("UID mismatch (user application)");
      }

      //  Prevent re-review (check global, or check both)
      const currentStatus = (appData?.status ?? "pending") as string;
      if (currentStatus !== "pending") {
        throw new Error(`Already reviewed (${currentStatus})`);
      }

      const reviewPatch = {
        status: body.status,
        adminNote: body.adminNote ?? null,
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: decoded.uid,
      };

      //  Update GLOBAL
      tx.update(appRef, reviewPatch);

      //  Update USER SUBCOLLECTION DOC
      tx.update(userAppRef, reviewPatch);

      //  Update user role if approved (and optionally if rejected)
      if (body.status === "approved") {
        tx.set(
          userRef,
          { role: "expert", updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      } else {
        // optional
        tx.set(
          userRef,
          { role: "regular", updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
