import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LastSeenPayload = {
  plant_scans?: number; // ms
  map_posts?: number; // ms (for map_scans createdAtLocal)
  health_assessments?: string; // ISO (for createdAt Timestamp)
  expert_applications?: string; // ISO (for createdAt Timestamp)
};

function isoToTs(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

// helper: tries count by createdAtLocal first; if that returns 0, fallback to createdAt Timestamp
async function countNewDocs(args: {
  collection: string;
  lastSeenMs?: number; // for createdAtLocal
  lastSeenIso?: string; // for createdAt Timestamp
}) {
  const { collection, lastSeenMs, lastSeenIso } = args;

  const nowMs = Date.now();

  // 1) Try createdAtLocal (number ms)
  if (typeof lastSeenMs === "number") {
    try {
      const snap = await adminDb
        .collection(collection)
        .where("createdAtLocal", ">", lastSeenMs)
        .count()
        .get();

      const c = snap.data().count ?? 0;
      if (c > 0) return c; // if we found something, great
      // If 0, we still fallback because field might not exist / wrong type.
    } catch {
      // ignore and fallback
    }
  } else {
    // if never seen, default to now so you don’t show everything as "new" on first load
    try {
      const snap = await adminDb
        .collection(collection)
        .where("createdAtLocal", ">", nowMs)
        .count()
        .get();
      const c = snap.data().count ?? 0;
      if (c > 0) return c;
    } catch {
      // ignore and fallback
    }
  }

  // 2) Fallback: createdAt (Firestore Timestamp)
  const afterTs =
    lastSeenIso && isoToTs(lastSeenIso)
      ? isoToTs(lastSeenIso)!
      : Timestamp.fromDate(new Date()); // default now

  try {
    const snap = await adminDb
      .collection(collection)
      .where("createdAt", ">", afterTs)
      .count()
      .get();

    return snap.data().count ?? 0;
  } catch {
    return 0;
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
    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Forbidden (not admin)" },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      lastSeen?: LastSeenPayload;
    };
    const lastSeen = body?.lastSeen ?? {};

    const plantCount = await countNewDocs({
      collection: "plant_scans",
      lastSeenMs: lastSeen.plant_scans,
    });

    const mapCount = await countNewDocs({
      collection: "map_scans",
      lastSeenMs: lastSeen.map_posts,
      // if you later decide to store ISO for map_posts, this supports it too:
      lastSeenIso: undefined,
    });

    const healthCount = await countNewDocs({
      collection: "health_assessments",
      lastSeenIso: lastSeen.health_assessments,
    });

    const expertCount = await countNewDocs({
      collection: "expert_applications",
      lastSeenIso: lastSeen.expert_applications,
    });

    return NextResponse.json({
      counts: {
        plant_scans: plantCount,
        map_posts: mapCount,
        health_assessments: healthCount,
        expert_applications: expertCount,
      },
      serverNow: {
        ms: Date.now(),
        iso: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
