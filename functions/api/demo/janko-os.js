import { json } from "../../_lib/api.js";

const card = ({
  id,
  mode,
  card_type,
  title,
  short_label,
  metric,
  status = "preview",
  priority = "medium",
  owner_role = "manager",
  source_type = "demo",
  summary,
  why,
  action_label,
  action_type,
  metadata_json = {}
}) => ({
  id,
  mode,
  card_type,
  title,
  short_label,
  metric,
  status,
  priority,
  owner_role,
  source_type,
  summary,
  why,
  action_label,
  action_type,
  metadata_json: {
    demo_mode: true,
    private_data: false,
    paid_order: false,
    ...metadata_json
  }
});

const cards = [
  card({
    id: "janko-atl-sayago-lead",
    mode: "manager",
    card_type: "lead",
    title: "ATL Sayago high potential lead",
    short_label: "ATL Sayago",
    metric: "High potential",
    status: "unread",
    priority: "high",
    summary: "Professional service lead with strong fit for a custom operating system.",
    why: "The demo shows how BOOSTR can turn an architecture/design inquiry into a scoped lead.",
    action_label: "Review lead",
    action_type: "follow_up",
    metadata_json: { pilot: "atl-sayago", route: "/portfolio/atl-sayago" }
  }),
  card({
    id: "janko-omg-booking-cta",
    mode: "manage",
    card_type: "next_to_boost",
    title: "OMG Beauty booking CTA",
    short_label: "OMG Booking",
    metric: "CTA gap",
    priority: "high",
    summary: "Booking flow needs a cleaner next action.",
    why: "Manager mode should surface conversion issues before visual polish.",
    action_label: "Improve CTA",
    action_type: "open_module",
    metadata_json: { partner: "omg-beauty" }
  }),
  card({
    id: "janko-82ngel-product-push",
    mode: "cash",
    card_type: "product",
    title: "82NGEL product push",
    short_label: "82NGEL",
    metric: "Drop ready",
    priority: "high",
    owner_role: "seller",
    summary: "A product drop can become the fastest clean commerce action.",
    why: "Cash mode prioritizes items close to purchase intent.",
    action_label: "Prepare offer",
    action_type: "create_payment_link_later",
    metadata_json: { pilot: "82ngel", product_rule: "physical_buy_now" }
  }),
  card({
    id: "janko-link-os-music-ctas",
    mode: "artist",
    card_type: "music",
    title: "JANKO Link OS music CTAs",
    short_label: "Music CTAs",
    metric: "Needs focus",
    priority: "medium",
    owner_role: "artist",
    summary: "Music links need exact calls to action by release or offer.",
    why: "Artist mode should not flatten songs, beats and services into one CTA.",
    action_label: "Tune CTA",
    action_type: "open_module",
    metadata_json: { route: "/jankodiorr" }
  }),
  card({
    id: "janko-gemese-partner-status",
    mode: "partners",
    card_type: "partner_action",
    title: "Gemese partner status",
    short_label: "Gemese",
    metric: "Needs update",
    priority: "medium",
    summary: "Partner dashboard status should be reviewed before a client-facing pass.",
    why: "Partner actions need clear owner and next step.",
    action_label: "Review partner",
    action_type: "follow_up",
    metadata_json: { pilot: "gemese" }
  }),
  card({
    id: "janko-baby-mama-beat",
    mode: "cash",
    card_type: "music",
    title: "Baby Mama Type Beat WESTDETRO",
    short_label: "Beat",
    metric: "License path",
    priority: "high",
    owner_role: "producer",
    summary: "Digital beat should sell with license and disclosure metadata.",
    why: "Digital music needs account/license handling before real checkout.",
    action_label: "Prepare license",
    action_type: "create_payment_link_later",
    metadata_json: { product_type: "digital", requires_license: true }
  }),
  card({
    id: "janko-tech-house-beat",
    mode: "feel_artist",
    card_type: "music",
    title: "Tech House Beat de esta manana",
    short_label: "New beat",
    metric: "Creative",
    priority: "medium",
    owner_role: "producer",
    summary: "Fresh creative work should be kept visible when JANKO chooses artist mode.",
    why: "Feel-artist mode prioritizes project momentum over pure sales.",
    action_label: "Open project",
    action_type: "open_module",
    metadata_json: { product_type: "digital", demo_title_normalized: true }
  }),
  card({
    id: "janko-nike-jordan-bag",
    mode: "cash",
    card_type: "product",
    title: "Nike/Jordan custom side bag 1 of 1",
    short_label: "1 of 1 bag",
    metric: "Buy now",
    priority: "high",
    owner_role: "seller",
    summary: "Physical one-of-one product can use buy now now, auction later.",
    why: "The product is physical and scarce; no fake sale is recorded.",
    action_label: "Draft offer",
    action_type: "create_payment_link_later",
    metadata_json: { product_type: "physical", checkout_rule: "buy_now_now_auction_later" }
  }),
  card({
    id: "janko-mix-master-service",
    mode: "cash",
    card_type: "product",
    title: "Mix & Master service",
    short_label: "Mix/Master",
    metric: "Deposit",
    priority: "medium",
    owner_role: "producer",
    summary: "Service offer needs scope confirmation and deposit/booking flow.",
    why: "Services are not the same as instant digital products.",
    action_label: "Define scope",
    action_type: "request_asset",
    metadata_json: { product_type: "service", requires_deposit: true }
  }),
  card({
    id: "janko-production-slot",
    mode: "cash",
    card_type: "product",
    title: "Production slot",
    short_label: "Slot",
    metric: "Booking",
    priority: "medium",
    owner_role: "producer",
    summary: "A production slot needs date, scope and deposit before checkout.",
    why: "Booking logic should stay separate from simple products.",
    action_label: "Prepare booking",
    action_type: "create_payment_link_later",
    metadata_json: { product_type: "booking", account_recommended: true }
  }),
  card({
    id: "janko-westdetro-beat-pack",
    mode: "cash",
    card_type: "music",
    title: "WESTDETRO beat pack",
    short_label: "Beat pack",
    metric: "Bundle",
    priority: "high",
    owner_role: "producer",
    summary: "Bundle can become a productized digital offer with license disclosure.",
    why: "Cash mode prefers fast, clean, productized offers.",
    action_label: "Package offer",
    action_type: "create_payment_link_later",
    metadata_json: { product_type: "digital", bundle: true, requires_license: true }
  }),
  card({
    id: "janko-frontend-health",
    mode: "system",
    card_type: "health",
    title: "Frontend health",
    short_label: "Frontend",
    metric: "Preview ready",
    priority: "medium",
    owner_role: "admin",
    summary: "Demo UI exists; backend truth alignment is still the gate.",
    why: "System mode separates real state from presentation.",
    action_label: "Review route",
    action_type: "open_module",
    metadata_json: { surface: "demo" }
  }),
  card({
    id: "janko-backend-health",
    mode: "system",
    card_type: "health",
    title: "Backend health",
    short_label: "Backend",
    metric: "Auth scoped",
    priority: "high",
    owner_role: "admin",
    summary: "Cards, human needs and sessions are backend-backed.",
    why: "Private APIs remain session and workspace scoped.",
    action_label: "Check API",
    action_type: "open_module",
    metadata_json: { endpoint: "/api/health" }
  }),
  card({
    id: "janko-i18n-health",
    mode: "system",
    card_type: "health",
    title: "i18n health",
    short_label: "i18n",
    metric: "Toggle present",
    priority: "medium",
    owner_role: "admin",
    summary: "Language toggle is frontend-owned; API errors use stable codes.",
    why: "Backend should support i18n without owning visual copy.",
    action_label: "Review copy",
    action_type: "later",
    metadata_json: { frontend_owned: true }
  }),
  card({
    id: "janko-smart-payment-link-readiness",
    mode: "cash",
    card_type: "payment",
    title: "Smart Payment Link readiness",
    short_label: "Payment Link",
    metric: "Model ready",
    priority: "high",
    owner_role: "manager",
    summary: "Product/payment tables exist, but no Stripe or paid order flow is live.",
    why: "The demo can show readiness without pretending real payments happened.",
    action_label: "Plan link",
    action_type: "create_payment_link_later",
    metadata_json: { stripe_live: false, fake_paid_orders: false }
  })
];

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet() {
  return json({
    ok: true,
    demo_mode: true,
    profile: {
      name: "JANKO",
      display_name: "JANKO",
      workspace: "JANKO / WESTDETRO",
      type: "artist/founder/manager demo",
      demo_mode: true,
      language: "en",
      theme: "platinum_dark",
      api_status: "future"
    },
    personas: [
      { id: "founder", label: "Founder" },
      { id: "manager", label: "Manager" },
      { id: "artist", label: "Artist" },
      { id: "producer", label: "Producer" },
      { id: "seller", label: "Seller" }
    ],
    needs: [
      { id: "cash", label: "Cash" },
      { id: "manager", label: "Manager" },
      { id: "artist", label: "Artist" },
      { id: "product", label: "Product" },
      { id: "partners", label: "Partners" },
      { id: "system", label: "System" }
    ],
    modules: [
      { id: "boostr-leads", status: "demo", label: "BOOSTR Leads" },
      { id: "next-to-boost", status: "demo", label: "Next to BOOST" },
      { id: "artist-os", status: "demo", label: "Artist OS" },
      { id: "smart-payment-link", status: "model_ready", label: "Smart Payment Link" },
      { id: "ecosystem-health", status: "demo", label: "Ecosystem Health" }
    ],
    contact_methods: [
      {
        contact_type: "artist_email",
        label: "Artist email",
        value: "artist@email.demo",
        visibility: "public_profile",
        verified: false
      },
      {
        contact_type: "business_email",
        label: "Business email",
        value: "business@email.demo",
        visibility: "workspace",
        verified: false
      },
      {
        contact_type: "business_phone",
        label: "Demo phone",
        value: "+1 demo phone",
        visibility: "workspace",
        verified: false
      },
      {
        contact_type: "instagram",
        label: "Instagram",
        value: "@janko.demo",
        visibility: "public_profile",
        verified: false
      }
    ],
    preferences: {
      default_mode: "cash",
      default_persona_id: "producer",
      default_language: "en",
      card_density: "comfortable",
      show_demo_labels: true,
      reduce_motion: false,
      notification_preferences: {
        product_readiness: true,
        partner_actions: true,
        system_health: true
      }
    },
    security: {
      two_factor_status: "not_enabled_demo",
      sessions_count: 1
    },
    api_tokens: [
      {
        label: "BOOSTR API Token",
        prefix: "bst_demo",
        masked: "bst_demo_••••••••••••",
        status: "future"
      }
    ],
    notifications: [
      {
        id: "janko-demo-notification-payment-readiness",
        type: "payment_readiness",
        title: "Smart Payment Link needs review",
        status: "unread",
        priority: 75,
        demo_mode: true
      }
    ],
    activity: [
      {
        id: "janko-demo-activity-card-engine",
        event_type: "card.demo.loaded",
        title: "JANKO card engine demo loaded",
        demo_mode: true
      }
    ],
    cards,
    products: [
      {
        id: "baby-mama-type-beat",
        title: "Baby Mama Type Beat WESTDETRO",
        product_type: "digital",
        readiness: "license_required",
        requires_account: true,
        allow_guest_checkout: false,
        payment_status: "not_live"
      },
      {
        id: "nike-jordan-side-bag",
        title: "Nike/Jordan custom side bag 1 of 1",
        product_type: "physical",
        readiness: "buy_now_ready_auction_later",
        requires_account: false,
        allow_guest_checkout: true,
        payment_status: "not_live"
      },
      {
        id: "mix-master-service",
        title: "Mix & Master service",
        product_type: "service",
        readiness: "deposit_booking_required",
        requires_account: true,
        allow_guest_checkout: false,
        payment_status: "not_live"
      }
    ],
    health: {
      frontend: "demo_ready",
      backend: "card_engine_ready",
      i18n: "frontend_owned",
      payment_links: "model_ready_no_stripe",
      paid_orders: false
    },
    actions: [
      "approve",
      "reject",
      "later",
      "follow_up",
      "done",
      "create_payment_link_later",
      "request_asset",
      "open_module"
    ]
  });
}
