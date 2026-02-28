import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

type Body = { postId: string };

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

async function recomputeLastMapPostAt() {
  try {
    const snap = await adminDb
      .collection("map_scans")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const newest = snap.docs[0]?.data() as any | undefined;
    const lastMapPostAt = newest?.createdAt ?? null;

    await adminDb
      .collection("analytics")
      .doc("global")
      .set({ lastMapPostAt }, { merge: true });
  } catch (e) {
    console.log("[recomputeLastMapPostAt] failed:", e);
  }
}

/**
 * Deep delete a map post:
 * - deletes /map_scans/{postId}
 * - deletes /map_scans/{postId}/comments/{commentId}
 * - deletes /map_scans/{postId}/comments/{commentId}/replies/{replyId}
 */
async function deepDeleteMapPost(postId: string) {
  const postRef = adminDb.collection("map_scans").doc(postId);

  // fetch comments
  const commentsSnap = await postRef.collection("comments").get();

  let batch = adminDb.batch();
  let opCount = 0;

  // delete replies then comments
  for (const c of commentsSnap.docs) {
    const repliesSnap = await c.ref.collection("replies").get();

    for (const r of repliesSnap.docs) {
      batch.delete(r.ref);
      opCount++;
      if (opCount >= 450) {
        await batch.commit();
        batch = adminDb.batch();
        opCount = 0;
      }
    }

    batch.delete(c.ref);
    opCount++;
    if (opCount >= 450) {
      await batch.commit();
      batch = adminDb.batch();
      opCount = 0;
    }
  }

  // delete post itself
  batch.delete(postRef);
  await batch.commit();
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

    if (!body?.postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const postRef = adminDb.collection("map_scans").doc(body.postId);
    const snap = await postRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const data = snap.data() as any;

    const uid: string | null = typeof data?.uid === "string" ? data.uid : null;
    const createdDay: string | null = toDayKeyFromData(data);

    // 1) Deep delete: post + comments + replies
    await deepDeleteMapPost(body.postId);

    // 2) Decrement analytics + per-user counters
    const batch = adminDb.batch();

    // global analytics decrement
    batch.set(
      adminDb.collection("analytics").doc("global"),
      {
        totalMapPosts: FieldValue.increment(-1),
      },
      { merge: true },
    );

    // daily decrement
    if (createdDay) {
      batch.set(
        adminDb
          .collection("analytics")
          .doc("global")
          .collection("daily")
          .doc(createdDay),
        {
          mapPosts: FieldValue.increment(-1),
          lastUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    // per-user decrement
    if (uid) {
      batch.set(
        adminDb.collection("users").doc(uid),
        {
          postCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // OPTIONAL: if you store user copy in /users/{uid}/map_scans/{postId}
      // (Most apps do NOT, but your old route did.)
      const userCopyRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("map_scans")
        .doc(body.postId);

      // It might not exist; delete is still fine.
      batch.delete(userCopyRef);
    }

    await batch.commit();

    // 3) Recompute lastMapPostAt for dashboard sync
    await recomputeLastMapPostAt();

    return NextResponse.json({
      ok: true,
      deletedId: body.postId,
      uid,
      createdDay,
      analyticsUpdated: true,
      deepDeleted: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Delete failed" },
      { status: 500 },
    );
  }
}
