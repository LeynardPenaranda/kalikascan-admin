import { NextResponse } from "next/server";
import { adminAuth } from "@/src/lib/firebase/admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    // Must be admin to view admins list
    if (!decoded.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins: Array<{
      uid: string;
      email: string | null;
      displayName: string | null;
      photoURL: string | null;
      disabled: boolean;
      createdAt: string | null;
      lastSignIn: string | null;
      role: "admin" | "superadmin";
    }> = [];

    let nextPageToken: string | undefined = undefined;

    do {
      const res = await adminAuth.listUsers(1000, nextPageToken);
      nextPageToken = res.pageToken;

      for (const u of res.users) {
        const isAdmin = Boolean(u.customClaims?.admin);
        if (!isAdmin) continue;

        const isSuper = Boolean(u.customClaims?.superadmin);

        admins.push({
          uid: u.uid,
          email: u.email ?? null,
          displayName: u.displayName ?? null,
          photoURL: u.photoURL ?? null,
          disabled: u.disabled,
          createdAt: u.metadata?.creationTime ?? null,
          lastSignIn: u.metadata?.lastSignInTime ?? null,
          role: isSuper ? "superadmin" : "admin",
        });
      }
    } while (nextPageToken);

    // sort superadmins first then name/email
    admins.sort((a, b) => {
      if (a.role !== b.role) return a.role === "superadmin" ? -1 : 1;
      return String(a.displayName ?? a.email ?? "").localeCompare(
        String(b.displayName ?? b.email ?? ""),
      );
    });

    return NextResponse.json({ admins });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to list admins" },
      { status: 500 },
    );
  }
}
