import { NextResponse } from "next/server";
import { normalizeFacilities, type CareFacility } from "@/lib/care-data";

export const dynamic = "force-dynamic";
interface Entry { expires: number; facilities: CareFacility[]; fetchedAt: string }
const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<Entry>>();
const providers = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

async function queryArea(lat: number, lng: number): Promise<Entry> {
  const query = `[out:json][timeout:8];(nwr[amenity~"^(hospital|clinic|doctors|pharmacy)$"](around:8000,${lat},${lng});nwr[emergency=ambulance_station](around:8000,${lat},${lng}););out center tags 100;`;
  for (const provider of providers) {
    try {
      const url = new URL(provider);
      url.searchParams.set("data", query);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000), cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "AfyaNine/0.1 (+https://github.com/imranshiundu/afyanine)" },
      });
      if (!response.ok) continue;
      const body = await response.json();
      if (!Array.isArray(body.elements) || body.remark) continue;
      const entry = { expires: Date.now() + 300_000, fetchedAt: new Date().toISOString(), facilities: normalizeFacilities(body.elements) };
      if (cache.size >= 50) cache.delete(cache.keys().next().value!);
      cache.set(`${lat},${lng}`, entry);
      return entry;
    } catch { /* Try the second public provider, without logging user coordinates. */ }
  }
  throw new Error("Care provider unavailable");
}

export async function POST(request: Request) {
  // POST keeps location out of our URL/access-log query strings.
  const body = await request.json().catch(() => null);
  const lat = body?.lat, lng = body?.lng;
  if (typeof lat !== "number" || typeof lng !== "number" ||
    !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Choose a valid map area." }, { status: 400 });
  }
  // Coarse query coordinates only; never persist user location.
  const rounded = [Number(lat.toFixed(3)), Number(lng.toFixed(3))];
  const key = rounded.join(",");
  try {
    let entry = cache.get(key);
    if (!entry || entry.expires < Date.now()) {
      let query = pending.get(key);
      if (!query) {
        if (pending.size >= 3) return NextResponse.json({ error: "The directory is busy. Please retry shortly." }, { status: 503 });
        query = queryArea(rounded[0], rounded[1]).finally(() => pending.delete(key));
        pending.set(key, query);
      }
      entry = await query;
    }
    return NextResponse.json({ facilities: entry.facilities, fetchedAt: entry.fetchedAt, source: "OpenStreetMap / Overpass", radiusKm: 8 }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "The public facility directory is temporarily unavailable. Retry shortly. The map still works; do not rely on this directory in an emergency." }, { status: 503 });
  }
}
