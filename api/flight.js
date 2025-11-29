// Vercel serverless function: /api/flight
// Usage from browser:  GET /api/flight?code=AA100
// It fetches AviationStack server-side using your secret key in Vercel env.

export default async function handler(req, res) {
  try {
    // Accept either ?code=AA100 or ?flight_iata=AA100 (be forgiving)
    const code = (req.query.code || req.query.flight_iata || "").toString().trim().toUpperCase();
    if (!code || code.length < 3) {
      return res.status(400).json({ error: "missing_or_invalid_code" });
    }

    const key = process.env.AVIATIONSTACK_KEY;
    if (!key) {
      return res.status(500).json({ error: "missing_server_key" });
    }

    // Free AviationStack is HTTP-only; server-side HTTP is fine
    const upstream = new URL("http://api.aviationstack.com/v1/flights");
    upstream.searchParams.set("access_key", key);
    upstream.searchParams.set("flight_iata", code);
    upstream.searchParams.set("limit", "1");

    const r = await fetch(upstream.toString(), { cache: "no-store" });
    const data = await r.json();

    // Pass through the upstream payload as-is
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "proxy_failed" });
  }
}