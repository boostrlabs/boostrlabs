import { clean, now } from "./api.js";

const money = (value) => Number(value || 0);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

async function safeFirst(env, sql, binds = []) {
  try { return await env.DB.prepare(sql).bind(...binds).first(); } catch { return null; }
}

async function safeAll(env, sql, binds = []) {
  try { const result = await env.DB.prepare(sql).bind(...binds).all(); return result.results || []; } catch { return []; }
}

function addRecommendation(list, item) {
  list.push({
    id: item.id || crypto.randomUUID(),
    type: item.type || "next_to_boost",
    title: item.title,
    summary: item.summary,
    priority: Math.min(Math.max(Number(item.priority || 50), 1), 100),
    reason: item.reason || "workspace_signal",
    action_label: item.action_label || "Open",
    action_url: item.action_url || "/app",
    source_type: item.source_type || "intelligence",
    source_id: item.source_id || item.reason || "workspace",
    metadata: item.metadata || {}
  });
}

export async function getWorkspaceIntelligence(env, workspaceId) {
  const workspace = clean(workspaceId, 120);
  const [products, activeProducts, smartLinks, activeLinks, reservations, audits, claimedAudits, cards, files, invoices] = await Promise.all([
    safeFirst(env, "SELECT COUNT(*) AS total FROM products WHERE workspace_id = ? AND status != 'archived'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM products WHERE workspace_id = ? AND status = 'active'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM payment_links WHERE workspace_id = ? AND status != 'archived'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM payment_links WHERE workspace_id = ? AND status = 'active'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM order_reservations WHERE workspace_id = ? AND status = 'reserved'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM audit_submissions WHERE workspace_id = ?", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM audit_submissions WHERE workspace_id = ? AND status = 'claimed'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM cards WHERE workspace_id = ? AND status NOT IN ('archived','done')", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM workspace_files WHERE workspace_id = ? AND status = 'active'", [workspace]),
    safeFirst(env, "SELECT COUNT(*) AS total FROM invoices WHERE workspace_id = ? AND status NOT IN ('archived','void')", [workspace])
  ]);

  const staleReservations = await safeAll(env,
    `SELECT id, guest_email, payment_link_id, created_at
     FROM order_reservations
     WHERE workspace_id = ? AND status = 'reserved' AND created_at < ?
     ORDER BY created_at ASC LIMIT 20`, [workspace, daysAgo(2)]);
  const draftProducts = await safeAll(env,
    `SELECT id, title, price_amount, description, fulfillment_type
     FROM products
     WHERE workspace_id = ? AND status = 'draft'
     ORDER BY updated_at DESC LIMIT 20`, [workspace]);
  const activeProductsWithoutLinks = await safeAll(env,
    `SELECT products.id, products.title
     FROM products
     LEFT JOIN payment_links ON payment_links.product_id = products.id AND payment_links.status != 'archived'
     WHERE products.workspace_id = ? AND products.status = 'active' AND payment_links.id IS NULL
     LIMIT 20`, [workspace]);

  const totals = {
    products: money(products?.total),
    active_products: money(activeProducts?.total),
    smart_links: money(smartLinks?.total),
    active_smart_links: money(activeLinks?.total),
    reservations: money(reservations?.total),
    audits: money(audits?.total),
    claimed_audits: money(claimedAudits?.total),
    open_cards: money(cards?.total),
    files: money(files?.total),
    invoices: money(invoices?.total),
    stale_reservations: staleReservations.length,
    draft_products: draftProducts.length,
    active_products_without_links: activeProductsWithoutLinks.length
  };

  const recommendations = [];
  if (totals.products === 0) addRecommendation(recommendations, {
    type: "product",
    title: "Create the first sellable offer",
    summary: "This workspace has no product/service record yet. Custom OS needs at least one thing it can sell or reserve.",
    priority: 96,
    reason: "no_products",
    action_label: "Create product",
    action_url: "/app/products"
  });
  if (totals.active_products > 0 && totals.smart_links === 0) addRecommendation(recommendations, {
    type: "payment",
    title: "Turn active products into Smart Links",
    summary: "There are active products but no public reservation route. Create a Smart Link to capture demand without Stripe.",
    priority: 94,
    reason: "active_products_no_links",
    action_label: "Create Smart Link",
    action_url: "/manager/payment-links"
  });
  if (totals.reservations > 0) addRecommendation(recommendations, {
    type: "next_to_boost",
    title: "Follow up on reserved offers",
    summary: `${totals.reservations} Smart Link reservation(s) are waiting for manual follow-up or conversion.`,
    priority: 92,
    reason: "reservations_pending",
    action_label: "Open orders",
    action_url: "/app/orders"
  });
  if (totals.stale_reservations > 0) addRecommendation(recommendations, {
    type: "risk",
    title: "Reservations are getting stale",
    summary: `${totals.stale_reservations} reservation(s) are older than 48 hours. Follow-up risk is high.`,
    priority: 97,
    reason: "stale_reservations",
    action_label: "Open orders",
    action_url: "/app/orders",
    metadata: { reservation_ids: staleReservations.map((item) => item.id) }
  });
  if (totals.files === 0 && (totals.products > 0 || totals.reservations > 0)) addRecommendation(recommendations, {
    type: "asset_request",
    title: "Attach proof, deliverables or assets",
    summary: "Products/reservations exist, but the workspace has no files. Add assets, deliverables, contracts or reference links.",
    priority: 84,
    reason: "no_files_after_commerce",
    action_label: "Open files",
    action_url: "/app/files"
  });
  if (totals.invoices === 0 && totals.reservations > 0) addRecommendation(recommendations, {
    type: "invoice",
    title: "Create invoice draft for reserved work",
    summary: "Reservations exist but no invoice draft exists. Create a manual invoice record before payment processing is added.",
    priority: 82,
    reason: "reservations_no_invoices",
    action_label: "Open invoices",
    action_url: "/app/invoices"
  });
  if (totals.claimed_audits > 0 && totals.open_cards === 0) addRecommendation(recommendations, {
    type: "next_to_boost",
    title: "Generate action cards from claimed audit",
    summary: "The workspace has claimed audit data but no open cards. Run intelligence to create next actions.",
    priority: 80,
    reason: "claimed_audit_no_cards",
    action_label: "Run intelligence",
    action_url: "/app/intelligence"
  });
  if (draftProducts.length > 0) addRecommendation(recommendations, {
    type: "product",
    title: "Finish draft products",
    summary: `${draftProducts.length} product(s) are still drafts. Activate or archive them to reduce operational noise.`,
    priority: 76,
    reason: "draft_products",
    action_label: "Review products",
    action_url: "/app/products",
    metadata: { product_ids: draftProducts.map((item) => item.id) }
  });
  if (activeProductsWithoutLinks.length > 0) addRecommendation(recommendations, {
    type: "payment",
    title: "Active products missing Smart Links",
    summary: `${activeProductsWithoutLinks.length} active product(s) have no Smart Link attached.`,
    priority: 88,
    reason: "active_products_missing_link",
    action_label: "Create Smart Links",
    action_url: "/manager/payment-links",
    metadata: { product_ids: activeProductsWithoutLinks.map((item) => item.id) }
  });

  const score = Math.max(0, Math.min(100,
    35 +
    Math.min(totals.products, 3) * 8 +
    Math.min(totals.smart_links, 3) * 7 +
    Math.min(totals.reservations, 3) * 5 +
    Math.min(totals.files, 3) * 5 +
    Math.min(totals.invoices, 3) * 5 +
    Math.min(totals.claimed_audits, 1) * 8 -
    Math.min(totals.stale_reservations, 5) * 5
  ));

  return {
    workspace_id: workspace,
    score,
    totals,
    recommendations: recommendations.sort((a, b) => b.priority - a.priority).slice(0, 12),
    generated_at: now()
  };
}
