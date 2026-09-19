import { Router } from "express";

export const geocodeRouter = Router();

// Nominatim (OpenStreetMap's free geocoder) requires a descriptive User-Agent
// per its usage policy — a browser fetch can't set that, so we proxy through
// here instead of calling it directly from the client.
const USER_AGENT = "GuptaGeneralStore-Demo/1.0 (local grocery store checkout location picker)";

geocodeRouter.get("/geocode/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) return res.json([]);

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!r.ok) return res.status(502).json({ error: "Location search failed" });

  const results = (await r.json()) as any[];
  res.json(
    results.map((item) => ({
      displayName: item.display_name as string,
      lat: Number(item.lat),
      lon: Number(item.lon),
    }))
  );
});

geocodeRouter.get("/geocode/reverse", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`;
  const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!r.ok) return res.status(502).json({ error: "Reverse geocoding failed" });

  const result = (await r.json()) as any;
  res.json({
    displayName: buildDisplayName(result),
    pincode: result.address?.postcode ?? null,
  });
});

// Nominatim's raw display_name often repeats near-identical admin levels for
// Indian districts (e.g. "Haridwar, Hardwar, Haridwar, Uttarakhand, ..." when
// the district/city/alt-name all share the same name). Build a cleaner string
// from the structured fields instead, most-specific first, de-duplicated.
function buildDisplayName(result: any): string {
  const a = result.address ?? {};
  const parts: string[] = [a.road, a.neighbourhood || a.suburb || a.village, a.city || a.town || a.city_district, a.state, a.postcode].filter(
    Boolean
  );

  const seen = new Set<string>();
  const deduped = parts.filter((p) => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.length > 0 ? deduped.join(", ") : (result.display_name as string) ?? "";
}
