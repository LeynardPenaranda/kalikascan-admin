/**
 * Deletes a Plant.id identification by accessToken (v3 identification id).
 * Best-effort: returns true if already deleted / not found.
 */
export async function deletePlantIdIdentification(accessToken: string | null) {
  const API_KEY = process.env.PLANT_ID_API_KEY;

  if (!API_KEY) throw new Error("Missing PLANT_ID_API_KEY in env.");
  if (!accessToken) return true;

  const url = `https://plant.id/api/v3/identification/${encodeURIComponent(
    accessToken,
  )}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Api-Key": API_KEY,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    // treat not found/gone as success
    if (res.status === 404 || res.status === 410) return true;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Plant.id delete failed (${res.status}): ${text}`);
    }

    return true;
  } finally {
    clearTimeout(t);
  }
}
