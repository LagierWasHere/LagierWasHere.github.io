export async function onRequestPost({ request, env }) {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const body = await request.text();

  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    return new Response("Missing signature or public key", { status: 401 });
  }
  if (!(await verifyDiscordSignature(body, signature, timestamp, env.DISCORD_PUBLIC_KEY))) {
    return new Response("Invalid request signature", { status: 401 });
  }

  let interaction;
  try {
    interaction = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (interaction.type === 1) return json({ type: 1 });
  if (interaction.type === 4) {
    const focusedOption = (interaction.data.options || []).find((option) => option.focused);
    if (!focusedOption || focusedOption.name !== "title") {
      return json({ type: 8, data: { choices: [] } });
    }

    let novels = [];
    try {
      const raw = env.RECS_KV ? await env.RECS_KV.get("novels") : null;
      const parsed = raw ? JSON.parse(raw) : [];
      novels = Array.isArray(parsed) ? parsed : [];
    } catch {
      novels = [];
    }

    const query = String(focusedOption.value || "").trim().toLowerCase();
    const choices = novels
      .filter((novel) => String(novel.title || "").toLowerCase().includes(query))
      .slice(0, 25)
      .map((novel) => {
        const title = String(novel.title || "").trim();
        return { name: title.slice(0, 100), value: title.slice(0, 100) };
      })
      .filter((choice) => choice.name);

    return json({ type: 8, data: { choices } });
  }
  if (interaction.type !== 2) return new Response("Unhandled interaction", { status: 400 });
  if (!env.RECS_KV) return json({ type: 4, data: { content: "RECS_KV is not configured.", flags: 64 } });

  const userId = interaction.member?.user?.id || interaction.user?.id;
  if (env.ALLOWED_DISCORD_ID && userId !== env.ALLOWED_DISCORD_ID) {
    return json({ type: 4, data: { content: "Only the site owner can change recommendations.", flags: 64 } });
  }

  const options = Object.fromEntries((interaction.data.options || []).map((option) => [option.name, option.value]));
  const commandName = interaction.data.name;
  let novels;
  try {
    const raw = await env.RECS_KV.get("novels");
    novels = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(novels)) throw new Error("Stored novels value must be an array");
  } catch {
    return json({ type: 4, data: { content: "The recommendations store is invalid or unavailable.", flags: 64 } });
  }

  if (commandName === "add-rec") {
    const category = String(options.category || "FANTASY").toUpperCase();
    const tags = String(options.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.startsWith("#") ? tag : `#${tag}`);
    const novel = {
      title: String(options.title).trim(),
      category,
      isPeak: Boolean(options.peak),
      status: Boolean(options.peak) ? "PEAK" : String(options.status || "FINISHED").trim().toUpperCase(),
      tags: tags.length ? tags : [`#${category}`],
      note: String(options.note).trim(),
      addedAt: new Date().toISOString()
    };
    novels.unshift(novel);
    await env.RECS_KV.put("novels", JSON.stringify(novels));
    return json({ type: 4, data: { content: `Added ${novel.title} to lagierr.me/recs.`, flags: 64 } });
  }

  if (commandName === "del-rec") {
    const query = String(options.title).trim().toLowerCase();
    const remaining = novels.filter((novel) => !String(novel.title).toLowerCase().includes(query));
    if (remaining.length === novels.length) {
      return json({ type: 4, data: { content: `No recommendation matched "${options.title}".`, flags: 64 } });
    }
    await env.RECS_KV.put("novels", JSON.stringify(remaining));
    return json({ type: 4, data: { content: `Removed matching recommendation from lagierr.me/recs.`, flags: 64 } });
  }

  return json({ type: 4, data: { content: "Unknown command.", flags: 64 } });
}

function json(value) {
  return new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
}

function hexToBytes(hex) {
  if (!/^[\da-f]{2,}$/i.test(hex) || hex.length % 2 !== 0) throw new Error("Invalid hex");
  return Uint8Array.from(hex.match(/../g), (pair) => Number.parseInt(pair, 16));
}

async function verifyDiscordSignature(body, signature, timestamp, publicKey) {
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return crypto.subtle.verify("Ed25519", key, hexToBytes(signature), new TextEncoder().encode(timestamp + body));
  } catch {
    return false;
  }
}
