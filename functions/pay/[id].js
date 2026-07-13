function parseJson(value) {
  try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function isOmniParking(link, metadata) {
  const operator = clean(metadata.operator);
  const parkingCode = clean(metadata.parking_code);
  const workspaceSlug = clean(link?.workspace_slug);
  const workspaceName = clean(link?.workspace_name);
  const title = clean(link?.title);
  return operator === "omni_jr"
    || parkingCode.startsWith("omni_jr_")
    || workspaceSlug === "omni-jr-parking"
    || workspaceName === "omni jr parking"
    || title.startsWith("omni jr parking");
}

export async function onRequestGet({ request, env, params }) {
  const id = String(params?.id || "").trim();
  if (!id) return new Response("Smart Payment Link missing.", { status: 400 });

  let omni = false;
  if (env.DB) {
    try {
      const link = await env.DB.prepare(`
        SELECT payment_links.title, payment_links.metadata_json,
               products.metadata_json AS product_metadata_json,
               workspaces.name AS workspace_name, workspaces.slug AS workspace_slug
        FROM payment_links
        LEFT JOIN products ON products.id = payment_links.product_id
        LEFT JOIN workspaces ON workspaces.id = payment_links.workspace_id
        WHERE payment_links.id = ? AND payment_links.status = 'active' LIMIT 1
      `).bind(id).first();
      if (link) {
        const metadata = { ...parseJson(link.product_metadata_json), ...parseJson(link.metadata_json) };
        omni = isOmniParking(link, metadata);
      }
    } catch (error) {
      console.error("Payment brand lookup failed", error);
    }
  }

  const incoming = new URL(request.url);
  const target = new URL(omni ? "/pay/omni/" : "/pay/", incoming.origin);
  target.searchParams.set("id", id);

  for (const [key, value] of incoming.searchParams.entries()) {
    if (key !== "id") target.searchParams.append(key, value);
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: `${target.pathname}${target.search}`,
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}
