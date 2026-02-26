import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminAuth, adminDb } from "@/src/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type Body = {
  imageBase64: string; // raw base64 without data: prefix
  mimeType?: string; // e.g. "image/jpeg"
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!idToken) {
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 401 },
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const body = (await req.json()) as Body;

    if (!body?.imageBase64 || typeof body.imageBase64 !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing imageBase64" },
        { status: 400 },
      );
    }

    const mimeType = (body.mimeType || "image/jpeg").trim();
    const dataUrl = `data:${mimeType};base64,${body.imageBase64}`;

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();
    const prevPublicId = snap.exists
      ? (snap.data()?.photoPublicId as string | undefined)
      : undefined;

    // 1) delete previous image (if any)
    if (prevPublicId) {
      try {
        await cloudinary.uploader.destroy(prevPublicId, {
          invalidate: true,
          resource_type: "image",
        });
      } catch {
        // Don't fail the whole request if delete fails; you can log if you want
      }
    }

    // 2) upload new image
    const upload = await cloudinary.uploader.upload(dataUrl, {
      folder: `kalikascan/profile/${uid}`,
      resource_type: "image",
    });

    // 3) update Firestore user doc
    await userRef.set(
      {
        photoURL: upload.secure_url,
        imageUrl: upload.secure_url,
        photoPublicId: upload.public_id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      photoURL: upload.secure_url,
      photoPublicId: upload.public_id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
