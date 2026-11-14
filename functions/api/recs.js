export async function onRequestGet({ env }) {
  if (!env.RECS_KV) {
    return json({ error: "RECS_KV binding missing" }, 500);
  }

  try {
    const raw = await env.RECS_KV.get("novels");
    const novels = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(novels)) {
      return json({ error: "Stored novels value must be an array" }, 500);
    }

    return json(novels, 200, { "Cache-Control": "public, max-age=30" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to read recommendations" }, 500);
  }
}

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders }
  });
}
