import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Verify the caller
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { email, password, displayName } = body as {
      email: string;
      password: string;
      displayName?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    // Create user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || "Admin",
    });

    // Give admin claim
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Optional: store profile in Firestore
    await adminDb
      .collection("admins")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        displayName: displayName || "Admin",
        role: "admin",
        createdAt: new Date(),
        createdBy: decoded.uid,
      });

    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
