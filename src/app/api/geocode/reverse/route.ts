import { NextResponse } from "next/server";

export const runtime = "nodejs";

const cache = new Map<string, { address: string; ts: number }>();

function keyOf(lat: number, lon: number) {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }

  const key = keyOf(lat, lon);

  // cache 30 days
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 30 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ address: cached.address, cached: true });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "KalikaScan Admin (reverse-geocode)",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Geocoding failed (${res.status})` },
      { status: 500 },
    );
  }

  const data = await res.json();
  const address = data?.display_name ?? null;

  if (!address) return NextResponse.json({ address: null });

  cache.set(key, { address, ts: Date.now() });

  return NextResponse.json({ address, cached: false });
}
