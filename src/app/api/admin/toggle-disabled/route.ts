import { NextResponse } from "next/server";
import { adminAuth } from "@/src/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    // only superadmin should be allowed to disable/delete admins
    if (!decoded.superadmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { uid?: string; disabled?: boolean };
    const uid = body.uid;
    const disabled = body.disabled;

    if (!uid || typeof disabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload. Expected { uid, disabled }" },
        { status: 400 },
      );
    }

    // (optional safety) don't allow disabling yourself
    if (decoded.uid === uid) {
      return NextResponse.json(
        { error: "You cannot disable your own account." },
        { status: 400 },
      );
    }

    // (optional safety) don't allow disabling superadmins
    const target = await adminAuth.getUser(uid);
    const targetIsSuper = Boolean(target.customClaims?.superadmin);
    if (targetIsSuper) {
      return NextResponse.json(
        { error: "You cannot disable a superadmin." },
        { status: 400 },
      );
    }

    await adminAuth.updateUser(uid, { disabled });

    return NextResponse.json({ ok: true, uid, disabled });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to toggle disabled" },
      { status: 500 },
    );
  }
}
