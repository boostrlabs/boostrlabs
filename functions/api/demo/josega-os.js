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
    workspace: "josega-backstage-system",
    ...metadata_json
  }
});

const cards = [
  card({
    id: "josega-angel-colla-crm",
    mode: "crm",
    card_type: "lead",
    title: "Angel Colla CRM follow-up",
    short_label: "Angel Colla",
    metric: "Hot",
    status: "unread",
    priority: "high",
    summary: "Contacto listo para ordenar pipeline, notas, pagos, proximos pasos y responsables.",
    why: "Angel puede convertirse en cuenta activa si el sistema le muestra orden y movimiento desde el dia 1.",
    action_label: "Open CRM lane",
    action_type: "follow_up",
    metadata_json: { partner: "Angel Colla", service: "CRM managing" }
  }),
  card({
    id: "josega-hablando-claro-content",
    mode: "content",
    card_type: "content_engine",
    title: "Hablando Claro Web Show content engine",
    short_label: "Hablando Claro",
    metric: "23 clips",
    status: "in_progress",
    priority: "high",
    summary: "Banco de clips, calendario de publicacion y entregas por episodio.",
    why: "Un show necesita constancia. El OS convierte cada grabacion en piezas, tareas y fechas claras.",
    action_label: "Review clips",
    action_type: "open_module",
    metadata_json: { partner: "Hablando Claro Web Show", service: "grabacion y edicion de videos" }
  }),
  card({
    id: "josega-micro-tdh-booking",
    mode: "booking",
    card_type: "booking",
    title: "Micro TDH booking route",
    short_label: "Micro TDH",
    metric: "Route",
    status: "draft",
    priority: "high",
    summary: "Vista de propuesta, disponibilidad, fee estimado y contactos por evento.",
    why: "Booking no puede vivir solo en mensajes. Cada oportunidad necesita estado y proxima accion.",
    action_label: "Prepare booking",
    action_type: "follow_up",
    metadata_json: { partner: "Micro TDH", service: "booking de artistas" }
  }),
  card({
    id: "josega-jhey-pi-management",
    mode: "artists",
    card_type: "artist_management",
    title: "Jhey Pi artist management board",
    short_label: "Jhey Pi",
    metric: "Next move",
    status: "review",
    priority: "medium",
    summary: "Seguimiento de branding, contenido, lanzamientos y oportunidades.",
    why: "El management se vuelve claro cuando cada artista tiene su tablero y sus decisiones visibles.",
    action_label: "Open artist board",
    action_type: "open_module",
    metadata_json: { partner: "Jhey Pi", service: "artist management" }
  }),
  card({
    id: "josega-janko-diorr-profile",
    mode: "artists",
    card_type: "artist_os",
    title: "Janko Diorr Backstage profile",
    short_label: "Janko Diorr",
    metric: "Active",
    status: "active",
    priority: "medium",
    summary: "Perfil de artista con servicios, contenido, bookings y funnel de fans.",
    why: "Sirve como ejemplo vivo para vender el modelo a otros artistas.",
    action_label: "Open profile",
    action_type: "open_module",
    metadata_json: { partner: "Janko Diorr", service: "branding / artist OS" }
  }),
  card({
    id: "josega-gemese-status",
    mode: "crm",
    card_type: "partner_action",
    title: "Gemese partner status",
    short_label: "Gemese",
    metric: "Needs update",
    status: "needs_update",
    priority: "medium",
    summary: "Actualizar notas, propuesta y siguiente contacto.",
    why: "Los partners se enfrian cuando nadie sabe que se hablo ni que sigue.",
    action_label: "Update partner",
    action_type: "follow_up",
    metadata_json: { partner: "Gemese", service: "CRM managing" }
  }),
  card({
    id: "josega-copi-molina-superfan",
    mode: "fans",
    card_type: "superfan",
    title: "Copi Molina superfan signal",
    short_label: "Copi Molina",
    metric: "Signal",
    status: "watching",
    priority: "medium",
    summary: "Superfan identificado como posible amplificador cultural.",
    why: "No todos los fans son iguales. Algunos merecen trato VIP porque mueven atencion.",
    action_label: "Tag superfan",
    action_type: "open_module",
    metadata_json: { superfan: true, name: "Copi Molina" }
  }),
  card({
    id: "josega-francisco-ops",
    mode: "system",
    card_type: "role_access",
    title: "Francisco ops access",
    short_label: "Francisco",
    metric: "Partner",
    status: "role_ready",
    priority: "high",
    summary: "Socio puede revisar pipeline, actividades y tareas sin tener acceso total.",
    why: "Backstage necesita roles claros para crecer sin depender 100% de Josega.",
    action_label: "Review access",
    action_type: "open_module",
    metadata_json: { partner_role: "socio", person: "Francisco" }
  }),
  card({
    id: "josega-backstage-health",
    mode: "system",
    card_type: "health",
    title: "Backstage System health",
    short_label: "System",
    metric: "91%",
    status: "demo_ready",
    priority: "high",
    summary: "Estructura base lista: CRM, artists, booking, content, fans y partner roles.",
    why: "El demo debe sentirse como producto vivo, no como una presentacion.",
    action_label: "Review system",
    action_type: "open_module",
    metadata_json: { system: "Backstage System" }
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
      name: "Josega",
      display_name: "Josega",
      workspace: "Backstage System",
      type: "CRM / artist management / booking demo",
      demo_mode: true,
      language: "es",
      theme: "backstage_dark",
      api_status: "future"
    },
    company: {
      name: "Backstage System",
      owner: "Josega",
      partner: "Francisco",
      focus: ["CRM managing", "artist management", "booking", "branding", "video production"]
    },
    partners: ["Angel Colla", "Hablando Claro Web Show", "Micro TDH", "Jhey Pi", "Janko Diorr", "Gemese"],
    superfans: ["Copi Molina"],
    personas: [
      { id: "founder", label: "Founder" },
      { id: "operator", label: "Operator" },
      { id: "artist_manager", label: "Artist Manager" },
      { id: "booking", label: "Booking" },
      { id: "content", label: "Content" }
    ],
    needs: [
      { id: "command", label: "Command" },
      { id: "crm", label: "CRM" },
      { id: "artists", label: "Artists" },
      { id: "booking", label: "Booking" },
      { id: "content", label: "Content" },
      { id: "fans", label: "Superfans" },
      { id: "system", label: "System" }
    ],
    modules: [
      { id: "crm-manager", status: "demo", label: "CRM Manager" },
      { id: "artist-management", status: "demo", label: "Artist Management" },
      { id: "booking-board", status: "demo", label: "Booking Board" },
      { id: "content-engine", status: "demo", label: "Content Engine" },
      { id: "superfan-watch", status: "demo", label: "Superfan Watch" },
      { id: "partner-roles", status: "demo", label: "Partner Roles" }
    ],
    cards,
    health: {
      frontend: "demo_ready",
      backend: "mock_ready",
      payments: "not_live",
      private_data: false,
      paid_orders: false
    },
    actions: ["approve", "reject", "later", "follow_up", "done", "request_asset", "open_module"]
  });
}
