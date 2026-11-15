export async function onRequestGet({ env }) {
  if (!env.RECS_KV) {
    return json({ error: "RECS_KV binding missing" }, 500);
  }

  try {
    const raw = await env.RECS_KV.get("services");
    const services = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(services)) {
      return json({ error: "Stored services value must be an array" }, 500);
    }

    const checkedServices = await Promise.all(services.map(checkService));
    return json(checkedServices, 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "CDN-Cache-Control": "no-store"
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to read services" }, 500);
  }
}

async function checkService(service) {
  const startedAt = Date.now();
  const url = String(service.url || "");

  if (!url) {
    return { ...service, status: "DEAD", checkedAt: new Date().toISOString() };
  }

  try {
    let response = await fetchWithTimeout(url, {
      method: "HEAD",
      redirect: "follow"
    }, 5000);
    if (response.status === 405) {
      response = await fetchWithTimeout(url, {
        method: "GET",
        redirect: "follow"
      }, 5000);
    }
    const live = response.status >= 200 && response.status < 400;

    return {
      ...service,
      status: live ? "LIVE" : "DEAD",
      statusCode: response.status,
      responseTimeMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return {
      ...service,
      status: "DEAD",
      responseTimeMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    };
  }
}

async function fetchWithTimeout(input, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders }
  });
}
