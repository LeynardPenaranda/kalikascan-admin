import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

type UserSnap = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  username: string | null;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchUsersByUidDocId(uids: string[]) {
  const uniq = Array.from(new Set(uids)).filter(Boolean);
  const out = new Map<string, UserSnap>();

  for (const group of chunk(uniq, 30)) {
    const docs = await Promise.all(
      group.map((uid) => adminDb.collection("users").doc(uid).get()),
    );

    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() as any;
      const uid = doc.id;

      out.set(uid, {
        uid,
        displayName: data.displayName ?? null,
        email: data.email ?? null,
        photoURL: data.photoURL ?? data.imageUrl ?? null,
        username: data.username ?? null,
      });
    }
  }

  return out;
}

export async function GET() {
  const snap = await adminDb
    .collection("plant_scans")
    .orderBy("createdAtLocal", "desc")
    .limit(500)
    .get();

  const scans = snap.docs.map((d) => {
    const x = d.data() as any;

    return {
      id: d.id,
      uid: x.uid ?? null,

      createdDay: x.createdDay ?? null,
      createdAtLocal: x.createdAtLocal ?? null,

      plantName: x?.topSuggestion?.name ?? null,
      confidence: x.confidence ?? x?.topSuggestion?.probability ?? null,

      isPlantBinary: x?.isPlant?.binary ?? null,
      isPlantProbability: x?.isPlant?.probability ?? null,

      latitude: x?.location?.latitude ?? null,
      longitude: x?.location?.longitude ?? null,
      addressText: x?.addressText ?? null,

      imageUrl: Array.isArray(x?.imageUrls) ? (x.imageUrls[0] ?? null) : null,
      imageUrls: Array.isArray(x?.imageUrls) ? x.imageUrls : [],

      accessToken: x?.accessToken ?? null,
      provider: x?.provider ?? null,
      modelVersion: x?.modelVersion ?? null,
      plantIdStatus: x?.plantIdStatus ?? null,
      success: x?.success ?? null,
      topSuggestion: x?.topSuggestion ?? null,

      user: null,
    };
  });

  const uids = scans.map((s) => s.uid).filter(Boolean) as string[];
  const userMap = await fetchUsersByUidDocId(uids);

  const populated = scans.map((s) => ({
    ...s,
    user: s.uid ? (userMap.get(s.uid) ?? null) : null,
  }));

  return NextResponse.json({ scans: populated });
}
