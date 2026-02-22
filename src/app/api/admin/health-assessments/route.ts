import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";
import { FieldPath } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

type HealthAssessmentRow = {
  id: string;
  uid: string;

  createdDay?: string | null;
  createdAt?: any;

  user?: {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;

  imageUrls?: string[] | null;

  isHealthyBinary?: boolean | null;
  isHealthyProbability?: number | null;
  isPlantProbability?: number | null;

  confidence?: number | null;

  diseaseName?: string | null;
  topDisease?: any;
  diseaseSuggestions?: any[];

  questionText?: string | null;

  addressText?: string | null;
  location?: { latitude?: number | null; longitude?: number | null } | null;
};

function asNum(v: any): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function asBool(v: any): boolean | null {
  return typeof v === "boolean" ? v : null;
}
function asStr(v: any): string | null {
  return typeof v === "string" ? v : null;
}
function asStrArray(v: any): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter((x) => typeof x === "string");
}
function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET() {
  try {
    // ✅ Your actual collection
    const snap = await adminDb
      .collection("health_assessments")
      .orderBy("createdAt", "desc")
      .limit(1000)
      .get();

    const out: HealthAssessmentRow[] = [];
    const uidsSet = new Set<string>();

    snap.forEach((d) => {
      const x: any = d.data() || {};
      const uid = asStr(x.uid);

      // If doc has no uid, skip (or set to "unknown")
      if (!uid) return;

      uidsSet.add(uid);

      out.push({
        id: d.id,
        uid,

        createdDay: asStr(x.createdDay),
        createdAt: x.createdAt ?? null,

        user: null, // filled after fetching users

        imageUrls: asStrArray(x.imageUrls),

        isHealthyBinary: asBool(x.isHealthyBinary),
        isHealthyProbability: asNum(x.isHealthyProbability),
        isPlantProbability: asNum(x.isPlantProbability),

        confidence: asNum(x.confidence),

        diseaseName: asStr(x.diseaseName),
        topDisease: x.topDisease ?? null,
        diseaseSuggestions: Array.isArray(x.diseaseSuggestions)
          ? x.diseaseSuggestions
          : [],

        questionText: asStr(x.questionText),

        addressText: asStr(x.addressText),

        location: x.location
          ? {
              latitude: asNum(x.location.latitude),
              longitude: asNum(x.location.longitude),
            }
          : null,
      });
    });

    // ✅ Batch fetch user docs (if you store users in /users/{uid})
    const uids = Array.from(uidsSet);
    const userMap: Record<
      string,
      {
        displayName?: string | null;
        username?: string | null;
        email?: string | null;
        photoURL?: string | null;
      }
    > = {};

    for (const group of chunk(uids, 10)) {
      const usersSnap = await adminDb
        .collection("users")
        .where(FieldPath.documentId(), "in", group)
        .get();

      usersSnap.forEach((u) => {
        const uData = u.data() || {};
        userMap[u.id] = {
          displayName: asStr(uData.displayName),
          username: asStr(uData.username),
          email: asStr(uData.email),
          photoURL: asStr(uData.photoURL),
        };
      });
    }

    for (const r of out) {
      r.user = userMap[r.uid] ?? null;
    }

    return NextResponse.json({ assessments: out });
  } catch (e: any) {
    console.error("[health-assessments GET] error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to fetch health assessments" },
      { status: 500 },
    );
  }
}
