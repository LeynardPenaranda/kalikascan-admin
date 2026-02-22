import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

type UserSnap = {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

function asStr(v: any): string | null {
  return typeof v === "string" ? v : null;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET() {
  try {
    //  Read all map posts (documents) in /map_scans
    // NOTE: only use orderBy if ALL docs have that field and same type.
    // If you're unsure, remove orderBy temporarily.
    const snap = await adminDb.collection("map_scans").get();

    const posts: any[] = [];
    const uidsSet = new Set<string>();

    snap.forEach((d) => {
      const data: any = d.data() || {};
      const uid = asStr(data.uid);
      if (uid) uidsSet.add(uid);

      posts.push({
        id: d.id,
        ...data,
        user: null as UserSnap | null, // filled later
      });
    });

    //  Batch fetch user docs (assumes you store users at /users/{uid})
    const uids = Array.from(uidsSet);
    const userMap: Record<string, UserSnap> = {};

    for (const group of chunk(uids, 10)) {
      const usersSnap = await adminDb
        .collection("users")
        .where(FieldPath.documentId(), "in", group)
        .get();

      usersSnap.forEach((u) => {
        const uData: any = u.data() || {};
        userMap[u.id] = {
          displayName: asStr(uData.displayName),
          username: asStr(uData.username),
          email: asStr(uData.email),
          photoURL: asStr(uData.photoURL),
        };
      });
    }

    //  Attach user to each post + merge into userSnapshot (for your existing UI)
    for (const p of posts) {
      const filledUser = p.uid ? (userMap[p.uid] ?? null) : null;

      p.user = filledUser;

      p.userSnapshot = {
        ...(p.userSnapshot ?? {}),
        ...(filledUser ?? {}),
      };
    }

    //  Sort in JS (safe even if createdAtLocal is missing)
    posts.sort((a, b) => {
      const av = typeof a.createdAtLocal === "number" ? a.createdAtLocal : 0;
      const bv = typeof b.createdAtLocal === "number" ? b.createdAtLocal : 0;
      return bv - av;
    });

    return NextResponse.json({ posts });
  } catch (e: any) {
    console.error("map-posts error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to load map posts" },
      { status: 500 },
    );
  }
}
