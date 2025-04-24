import fetch from "node-fetch";

const cache = new Map();
const RATE_LIMIT = new Map();

const MAX_REQUESTS_PER_MINUTE = 10;
const CACHE_DURATION_MS = 30 * 1000;

export default async function handler(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!RATE_LIMIT.has(ip)) RATE_LIMIT.set(ip, []);
  const timestamps = RATE_LIMIT.get(ip).filter((t) => Date.now() - t < 60000);
  timestamps.push(Date.now());
  RATE_LIMIT.set(ip, timestamps);
  if (timestamps.length > MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });

  if (cache.has(q) && Date.now() - cache.get(q).timestamp < CACHE_DURATION_MS) {
    return res.json(cache.get(q).data);
  }

  try {
    const response = await fetch(
      `https://ddg-api.herokuapp.com/search?q=${encodeURIComponent(q)}`
    );
    const data = await response.json();

    const formatted = {
      results: data.results.slice(0, 8).map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
      })),
    };

    cache.set(q, { data: formatted, timestamp: Date.now() });
    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: "Search failed" });
  }
}
