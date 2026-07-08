(() => {
  const STORAGE_KEY = 'boostr_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = ['en', 'es'];

  // 1. EMBEDDED TRANSLATIONS (FALLBACK FOR INSTANT PAINT & NO CORS ISSUES)
  const dictionaries = {
    en: {
      "home_hero_chip": "Custom Operating Systems",
      "home_hero_title": "The system layer behind modern businesses.",
      "home_hero_desc": "BOOSTR Labs builds the operating layer around each business: intake, dashboards, stores, partner routes, client workspaces and the modules that connect them.",
      "home_hero_cta_audit": "Start BOOSTR Audit",
      "home_hero_cta_modules": "Explore modules",
      "home_hero_cta_login": "Role access",
      "home_section_os_title": "Core OS surfaces",
      "home_section_os_micro": "Drag cards to reorganize. Search filters visible modules.",
      "home_metric_audit_span": "BOOSTR",
      "home_metric_audit_val": "Audit",
      "home_metric_audit_status": "Open",
      "home_metric_manager_span": "BOOSTR",
      "home_metric_manager_val": "Manager",
      "home_metric_manager_status": "Internal",
      "home_metric_client_span": "BOOSTR",
      "home_metric_client_val": "Client",
      "home_metric_client_status": "Access",
      "home_metric_partner_span": "BOOSTR",
      "home_metric_partner_val": "Partner",
      "home_metric_partner_status": "Access",
      "home_section_network_title": "Network entry points",
      "home_section_network_micro": "Public routes stay custom-branded. BOOSTR powers the system behind them.",
      "home_module_audit": "BOOSTR Audit",
      "home_module_audit_desc": "Application and diagnosis.",
      "home_module_82ngel": "82NGEL OS",
      "home_module_82ngel_desc": "Artist route.",
      "home_module_westdetro": "WESTDETRO OS",
      "home_module_westdetro_desc": "Janko Diorr route.",
      "home_module_omg": "OMG Beauty OS",
      "home_module_omg_desc": "Beauty client route.",
      "home_module_gemese": "GEMESE OS",
      "home_module_gemese_desc": "Workspace route.",
      "home_module_82store": "82 Storefront",
      "home_module_82store_desc": "Commerce reference route.",
      "home_pulse_title": "BOOSTR Intake",
      "home_pulse_val": "Audit",
      "home_pulse_micro": "Public application route. Opens separately from internal dashboards.",
      "home_switch_access_title": "Role Access",
      "home_switch_access_desc": "Manager, Partner, Client and Artist workspace entry.",
      "home_switch_modules_title": "Modules",
      "home_switch_modules_desc": "Official source of BOOSTR surfaces.",
      "login_topbar_span": "BOOSTR Identity",
      "login_topbar_val": "Account Access",
      "login_h1": "Sign in.",
      "login_desc": "Access Manager OS, Partner OS, Client OS or Artist OS.",
      "login_label_email": "Email",
      "login_label_role": "Workspace role",
      "login_option_manager": "Manager",
      "login_option_partner": "Partner",
      "login_option_client": "Client",
      "login_option_artist": "Artist",
      "login_btn_continue": "Continue",
      "login_btn_clear": "Clear local session",
      "login_note_preview": "Frontend preview only. Real authentication will be connected by backend.",
      "login_foot_home": "← Home",
      "login_foot_audit": "Start Audit ↗",
      "manager_greeting_span": "BOOSTR Manager OS",
      "manager_greeting_val": "Control Room",
      "manager_h1": "Leads. Modules. Workspaces.",
      "manager_desc": "The Manager OS is where incoming applications become workspaces, modules and client actions.",
      "manager_cta_inbox": "Open Lead Inbox",
      "manager_signal_apps_span": "Applications",
      "manager_signal_apps_val": "Inbox",
      "manager_signal_apps_micro": "Audit + manual leads",
      "manager_signal_reg_span": "Registry",
      "manager_signal_reg_val": "Modules",
      "manager_signal_reg_micro": "Active OS surfaces",
      "manager_signal_work_span": "Workspaces",
      "manager_signal_work_val": "Client",
      "manager_signal_work_micro": "Account surfaces",
      "manager_flow_title": "BOOSTR Flow",
      "manager_flow_micro": "The operating path for every application.",
      "manager_flow_step1_title": "01 · Application",
      "manager_flow_step1_desc": "Public audit captures the opportunity.",
      "manager_flow_step1_chip": "Entry",
      "manager_flow_step2_title": "02 · Review",
      "manager_flow_step2_desc": "Manager qualifies, assigns and prioritizes.",
      "manager_flow_step2_chip": "Inbox",
      "manager_flow_step3_title": "03 · Workspace",
      "manager_flow_step3_desc": "Approved work becomes a BOOSTR workspace.",
      "manager_flow_step3_chip": "OS",
      "manager_modules_title": "OS Modules",
      "manager_modules_micro": "Drag cards to organize your view. Use search to isolate a module.",
      "manager_metric_inbox_span": "BOOSTR",
      "manager_metric_inbox_val": "Inbox",
      "manager_metric_inbox_status": "Live",
      "manager_metric_work_span": "BOOSTR",
      "manager_metric_work_val": "Workspace",
      "manager_metric_work_status": "Shell",
      "manager_metric_partner_span": "BOOSTR",
      "manager_metric_partner_val": "Partner",
      "manager_metric_partner_status": "Shell",
      "manager_metric_modules_span": "BOOSTR",
      "manager_metric_modules_val": "Modules",
      "manager_metric_modules_status": "Map",
      "manager_queue_title": "Admin Queue",
      "manager_queue_desc": "Choose the next object to review. Backend auth and payments stay out of this frontend pass.",
      "manager_queue_btn_apps": "Applications",
      "manager_queue_btn_sys": "System",
      "manager_build_title": "Build Queue",
      "manager_build_task1_title": "Lead Inbox",
      "manager_build_task1_desc": "Review and qualify applications.",
      "manager_build_task2_title": "Module Registry",
      "manager_build_task2_desc": "Keep OS surfaces clean.",
      "manager_build_task3_title": "Admin OS",
      "manager_build_task3_desc": "System requirements and implementation map.",
      "manager_paths_title": "Quick Paths",
      "manager_paths_task1_title": "82NGEL OS",
      "manager_paths_task1_desc": "Artist front door.",
      "manager_paths_task2_title": "WESTDETRO OS",
      "manager_paths_task2_desc": "Artist route.",
      "manager_paths_task3_title": "82 Command",
      "manager_paths_task3_desc": "Artist dashboard.",
      "leads_greeting_span": "BOOSTR Manager OS",
      "leads_greeting_val": "Lead Inbox",
      "leads_h1": "BOOSTR Lead Inbox",
      "leads_desc": "Review inbound audits and manual leads. Status changes work for lead records; audit submissions remain intake records until backend links them into workspaces.",
      "leads_cta_audit": "Open Audit",
      "leads_notice_signin": "Sign in to unlock full lead management and workspace scoping.",
      "leads_input_token": "Temporary access token",
      "leads_btn_leads": "Load leads",
      "leads_btn_audit": "Load audits",
      "leads_btn_summary": "Summary",
      "leads_btn_search": "Search",
      "leads_btn_back": "Back",
      "leads_btn_save": "Save update",
      "leads_btn_reviewing": "Mark reviewing",
      "leads_btn_qualified": "Qualified",
      "leads_btn_lost": "Lost",
      "leads_tab_all": "All",
      "leads_tab_new": "New",
      "leads_tab_reviewing": "Reviewing",
      "leads_tab_qualified": "Qualified",
      "leads_tab_contacted": "Contacted",
      "leads_tab_proposal": "Proposal",
      "leads_tab_won": "Won",
      "leads_tab_lost": "Lost",
      "leads_th_date": "Date",
      "leads_th_contact": "Contact",
      "leads_th_business": "Business",
      "leads_th_status": "Status",
      "leads_th_modules": "Modules / Goal",
      "leads_side_title": "Lead detail",
      "leads_side_val": "Select a row",
      "leads_side_desc": "Load leads or audits, then select a row to inspect it. Lead records can be updated from here.",
      "leads_label_status": "Status",
      "leads_label_assigned": "Assigned to",
      "leads_label_note": "Internal note",
      "leads_input_filter": "Filter loaded rows",
      "leads_input_search": "Search server",
      "client_greeting_span": "Client OS",
      "client_greeting_val": "Workspace Hub",
      "client_h1": "One workspace. All active modules.",
      "client_desc": "Client OS groups projects, files, invoices, stores, links and status into one workspace.",
      "client_cta_access": "Access",
      "client_note_default": "Workspace modules become visible after account access.",
      "client_sec_title": "Workspace Modules",
      "client_sec_micro": "Drag cards to reorganize. Search filters the workspace.",
      "client_module_82ngel_desc": "Artist dashboard.",
      "client_module_gemese_desc": "Partner/client dashboard.",
      "client_module_82store_desc": "Commerce reference route.",
      "client_module_audit_title": "Audit History",
      "client_module_audit_desc": "Application records.",
      "client_module_audit_link": "Start audit →",
      "client_module_files_title": "Files",
      "client_module_files_desc": "Deliverables and assets.",
      "client_module_files_link": "System map →",
      "client_module_invoices_title": "Invoices",
      "client_module_invoices_desc": "Orders and receipts.",
      "client_module_invoices_link": "System map →",
      "client_stack_title": "Workspace Stack",
      "client_stack_task1_title": "Projects",
      "client_stack_task1_desc": "Active builds and deliverables.",
      "client_stack_task2_title": "Modules",
      "client_stack_task2_desc": "Visible by workspace access.",
      "client_stack_task3_title": "History",
      "client_stack_task3_desc": "Audits, files, orders and notes.",
      "client_routes_title": "Public Routes",
      "partner_greeting_span": "Partner OS",
      "partner_greeting_val": "Workspace Hub",
      "partner_h1": "Routes, referrals and status.",
      "partner_desc": "A clean partner workspace for applications, assigned accounts, referral links and next actions.",
      "partner_cta_app": "New Application",
      "partner_note_default": "Partner access will show assigned leads, active routes and status only.",
      "partner_sec_title": "Partner Workspace",
      "partner_sec_micro": "Drag cards to prioritize. Search to isolate a route or module.",
      "partner_module_gemese_desc": "Partner intake path.",
      "partner_module_westdetro_desc": "Creative partner path.",
      "partner_module_omg_desc": "Beauty client route.",
      "partner_module_gemese_os_desc": "Workspace dashboard.",
      "partner_module_audit_desc": "New application.",
      "partner_module_inbox_desc": "Manager review.",
      "partner_stack_title": "Partner Stack",
      "partner_stack_task1_title": "Application Link",
      "partner_stack_task1_desc": "Send prospects to the audit route.",
      "partner_stack_task2_title": "Status Board",
      "partner_stack_task2_desc": "Track submitted and approved accounts.",
      "partner_stack_task3_title": "Workspace Access",
      "partner_stack_task3_desc": "Open active client or artist systems.",
      "partner_net_title": "Active Network",
      "admin_greeting_span": "Admin OS",
      "admin_greeting_val": "System Console",
      "admin_h1": "System map and controls.",
      "admin_desc": "Admin shows operational objects: identity, records, modules, routes and implementation status.",
      "admin_cta_inbox": "Lead Inbox",
      "admin_metric_identity": "Identity",
      "admin_metric_users": "Users",
      "admin_metric_users_status": "Next",
      "admin_metric_data": "Data",
      "admin_metric_leads": "Leads",
      "admin_metric_leads_status": "D1/API",
      "admin_metric_system": "System",
      "admin_metric_modules": "Modules",
      "admin_metric_modules_status": "Map",
      "admin_metric_routes": "Routes",
      "admin_metric_routes_status": "Map",
      "admin_sec_title": "Implementation Contract",
      "admin_sec_micro": "Frontend-ready objects for the backend pass.",
      "admin_contract_users_title": "Users",
      "admin_contract_users_desc": "Login, session, role and workspace access.",
      "admin_contract_work_title": "Workspaces",
      "admin_contract_work_desc": "One account can access multiple business, artist or partner spaces.",
      "admin_contract_leads_title": "Leads",
      "admin_contract_leads_desc": "Applications, manual records, audit records and events.",
      "admin_contract_modules_title": "Modules",
      "admin_contract_modules_desc": "Cards activate by workspace, product, role and agreement.",
      "admin_contract_files_title": "Files",
      "admin_contract_files_desc": "Project assets and deliverables by workspace.",
      "admin_contract_invoices_title": "Invoices",
      "admin_contract_invoices_desc": "Orders, receipts and service history after payments are connected.",
      "admin_queue_title": "System Queue",
      "admin_queue_task1_title": "Lead records",
      "admin_queue_task1_desc": "Review submissions and status changes.",
      "admin_queue_task2_title": "Module map",
      "admin_queue_task2_desc": "Keep OS surfaces consistent.",
      "admin_queue_task3_title": "Workspace model",
      "admin_queue_task3_desc": "Prepare account objects for Codex.",
      "admin_queue_task4_title": "API Health",
      "admin_queue_task4_desc": "Check D1 and endpoint status.",
      "admin_rule_title": "Product Rule",
      "admin_rule_desc": "BOOSTR remains a technology company building Custom Operating Systems. Public pages sell the vision; Admin operates the machinery.",
      "modules_sec_title": "Module Registry",
      "modules_sec_val": "Official BOOSTR surfaces.",
      "modules_sec_desc": "Every card opens a real route. The product source of truth lives in docs/MODULES_SOURCE_OF_TRUTH.md.",
      "modules_sec_cta": "Start Audit",
      "modules_rule_title": "Rule",
      "modules_rule_desc": "BOOSTR modules stay modular. Custom client pages stay custom."
    },
    es: {
      "home_hero_chip": "Sistemas Operativos a Medida",
      "home_hero_title": "La capa de sistema detrás de los negocios modernos.",
      "home_hero_desc": "BOOSTR Labs construye la capa operativa de cada negocio: captación, paneles, tiendas, rutas de partners, espacios de cliente y los módulos que los conectan.",
      "home_hero_cta_audit": "Iniciar Auditoría BOOSTR",
      "home_hero_cta_modules": "Explorar módulos",
      "home_hero_cta_login": "Acceso por rol",
      "home_section_os_title": "Superficies del Sistema Core",
      "home_section_os_micro": "Arrastra tarjetas para organizar. La búsqueda filtra módulos visibles.",
      "home_metric_audit_span": "BOOSTR",
      "home_metric_audit_val": "Audit",
      "home_metric_audit_status": "Abierto",
      "home_metric_manager_span": "BOOSTR",
      "home_metric_manager_val": "Manager",
      "home_metric_manager_status": "Interno",
      "home_metric_client_span": "BOOSTR",
      "home_metric_client_val": "Client",
      "home_metric_client_status": "Acceso",
      "home_metric_partner_span": "BOOSTR",
      "home_metric_partner_val": "Partner",
      "home_metric_partner_status": "Acceso",
      "home_section_network_title": "Puntos de Entrada de la Red",
      "home_section_network_micro": "Las rutas públicas mantienen su marca. BOOSTR potencia el sistema detrás.",
      "home_module_audit": "BOOSTR Audit",
      "home_module_audit_desc": "Aplicación y diagnóstico.",
      "home_module_82ngel": "82NGEL OS",
      "home_module_82ngel_desc": "Ruta de artista.",
      "home_module_westdetro": "WESTDETRO OS",
      "home_module_westdetro_desc": "Ruta de Janko Diorr.",
      "home_module_omg": "OMG Beauty OS",
      "home_module_omg_desc": "Ruta de cliente de belleza.",
      "home_module_gemese": "GEMESE OS",
      "home_module_gemese_desc": "Ruta de espacio de trabajo.",
      "home_module_82store": "82 Storefront",
      "home_module_82store_desc": "Ruta de referencia comercial.",
      "home_pulse_title": "BOOSTR Intake",
      "home_pulse_val": "Audit",
      "home_pulse_micro": "Ruta de aplicación pública. Se abre por separado de los paneles internos.",
      "home_switch_access_title": "Acceso por Rol",
      "home_switch_access_desc": "Entrada a espacios de Manager, Partner, Cliente y Artista.",
      "home_switch_modules_title": "Módulos",
      "home_switch_modules_desc": "Origen oficial de superficies BOOSTR.",
      "login_topbar_span": "BOOSTR Identity",
      "login_topbar_val": "Acceso de Cuenta",
      "login_h1": "Iniciar sesión.",
      "login_desc": "Acceso a Manager OS, Partner OS, Client OS o Artist OS.",
      "login_label_email": "Correo electrónico",
      "login_label_role": "Rol del espacio",
      "login_option_manager": "Manager",
      "login_option_partner": "Partner",
      "login_option_client": "Cliente",
      "login_option_artist": "Artista",
      "login_btn_continue": "Continuar",
      "login_btn_clear": "Limpiar sesión local",
      "login_note_preview": "Vista previa únicamente. La autenticación real será conectada por el backend.",
      "login_foot_home": "← Inicio",
      "login_foot_audit": "Iniciar Auditoría ↗",
      "manager_greeting_span": "BOOSTR Manager OS",
      "manager_greeting_val": "Sala de Control",
      "manager_h1": "Leads. Módulos. Espacios.",
      "manager_desc": "Manager OS es donde las solicitudes entrantes se convierten en espacios, módulos y acciones de cliente.",
      "manager_cta_inbox": "Abrir Bandeja de Leads",
      "manager_signal_apps_span": "Solicitudes",
      "manager_signal_apps_val": "Bandeja",
      "manager_signal_apps_micro": "Auditorías + leads manuales",
      "manager_signal_reg_span": "Registro",
      "manager_signal_reg_val": "Módulos",
      "manager_signal_reg_micro": "Superficies de OS activas",
      "manager_signal_work_span": "Espacios",
      "manager_signal_work_val": "Cliente",
      "manager_signal_work_micro": "Superficies de cuenta",
      "manager_flow_title": "Flujo BOOSTR",
      "manager_flow_micro": "La ruta operativa para cada solicitud.",
      "manager_flow_step1_title": "01 · Solicitud",
      "manager_flow_step1_desc": "La auditoría pública captura la oportunidad.",
      "manager_flow_step1_chip": "Entrada",
      "manager_flow_step2_title": "02 · Revisión",
      "manager_flow_step2_desc": "El manager califica, asigna y prioriza.",
      "manager_flow_step2_chip": "Bandeja",
      "manager_flow_step3_title": "03 · Espacio",
      "manager_flow_step3_desc": "El trabajo aprobado se convierte en un espacio BOOSTR.",
      "manager_flow_step3_chip": "OS",
      "manager_modules_title": "Módulos de OS",
      "manager_modules_micro": "Arrastra tarjetas para organizar tu vista. Usa la búsqueda para aislar un módulo.",
      "manager_metric_inbox_span": "BOOSTR",
      "manager_metric_inbox_val": "Bandeja",
      "manager_metric_inbox_status": "En vivo",
      "manager_metric_work_span": "BOOSTR",
      "manager_metric_work_val": "Espacio",
      "manager_metric_work_status": "Estructura",
      "manager_metric_partner_span": "BOOSTR",
      "manager_metric_partner_val": "Partner",
      "manager_metric_partner_status": "Estructura",
      "manager_metric_modules_span": "BOOSTR",
      "manager_metric_modules_val": "Módulos",
      "manager_metric_modules_status": "Mapa",
      "manager_queue_title": "Cola de Administración",
      "manager_queue_desc": "Elige el siguiente objeto a revisar. La autenticación y pagos están fuera de este pase de frontend.",
      "manager_queue_btn_apps": "Solicitudes",
      "manager_queue_btn_sys": "Sistema",
      "manager_build_title": "Cola de Construcción",
      "manager_build_task1_title": "Bandeja de Leads",
      "manager_build_task1_desc": "Revisa y califica solicitudes.",
      "manager_build_task2_title": "Registro de Módulos",
      "manager_build_task2_desc": "Mantén limpias las superficies de OS.",
      "manager_build_task3_title": "Admin OS",
      "manager_build_task3_desc": "Requisitos de sistema y mapa de desarrollo.",
      "manager_paths_title": "Rutas Rápidas",
      "manager_paths_task1_title": "82NGEL OS",
      "manager_paths_task1_desc": "Puerta de entrada de artista.",
      "manager_paths_task2_title": "WESTDETRO OS",
      "manager_paths_task2_desc": "Ruta de artista.",
      "manager_paths_task3_title": "82 Command",
      "manager_paths_task3_desc": "Panel de artista.",
      "leads_greeting_span": "BOOSTR Manager OS",
      "leads_greeting_val": "Bandeja de Leads",
      "leads_h1": "Bandeja de Leads BOOSTR",
      "leads_desc": "Revisa auditorías y leads manuales. Los cambios de estado funcionan en leads; las auditorías quedan en captación hasta conectarse al espacio.",
      "leads_cta_audit": "Abrir Auditoría",
      "leads_notice_signin": "Inicia sesión para desbloquear la gestión completa de leads y espacios.",
      "leads_input_token": "Token de acceso temporal",
      "leads_btn_leads": "Cargar leads",
      "leads_btn_audit": "Cargar auditorías",
      "leads_btn_summary": "Resumen",
      "leads_btn_search": "Buscar",
      "leads_btn_back": "Volver",
      "leads_btn_save": "Guardar actualización",
      "leads_btn_reviewing": "Marcar en revisión",
      "leads_btn_qualified": "Calificado",
      "leads_btn_lost": "Perdido",
      "leads_tab_all": "Todos",
      "leads_tab_new": "Nuevo",
      "leads_tab_reviewing": "En revisión",
      "leads_tab_qualified": "Calificado",
      "leads_tab_contacted": "Contactado",
      "leads_tab_proposal": "Propuesta",
      "leads_tab_won": "Ganado",
      "leads_tab_lost": "Perdido",
      "leads_th_date": "Fecha",
      "leads_th_contact": "Contacto",
      "leads_th_business": "Negocio",
      "leads_th_status": "Estado",
      "leads_th_modules": "Módulos / Objetivo",
      "leads_side_title": "Detalle de Lead",
      "leads_side_val": "Selecciona una fila",
      "leads_side_desc": "Carga leads o auditorías, luego selecciona una fila para inspeccionar. Los registros se pueden actualizar aquí.",
      "leads_label_status": "Estado",
      "leads_label_assigned": "Asignado a",
      "leads_label_note": "Nota interna",
      "leads_input_filter": "Filtrar filas cargadas",
      "leads_input_search": "Buscar en servidor",
      "client_greeting_span": "Client OS",
      "client_greeting_val": "Centro de Trabajo",
      "client_h1": "Un espacio. Todos los módulos activos.",
      "client_desc": "Client OS agrupa proyectos, archivos, facturas, tiendas, enlaces y estados en un solo espacio de trabajo.",
      "client_cta_access": "Acceder",
      "client_note_default": "Los módulos del espacio serán visibles tras el acceso.",
      "client_sec_title": "Módulos del Espacio",
      "client_sec_micro": "Arrastra tarjetas para organizar. La búsqueda filtra el espacio.",
      "client_module_82ngel_desc": "Panel de artista.",
      "client_module_gemese_desc": "Panel de partner/cliente.",
      "client_module_82store_desc": "Ruta de referencia comercial.",
      "client_module_audit_title": "Historial de Auditoría",
      "client_module_audit_desc": "Registros de aplicación.",
      "client_module_audit_link": "Iniciar auditoría →",
      "client_module_files_title": "Archivos",
      "client_module_files_desc": "Entregables y recursos.",
      "client_module_files_link": "Mapa del sistema →",
      "client_module_invoices_title": "Facturas",
      "client_module_invoices_desc": "Pedidos y recibos.",
      "client_module_invoices_link": "Mapa del sistema →",
      "client_stack_title": "Pila del Espacio",
      "client_stack_task1_title": "Proyectos",
      "client_stack_task1_desc": "Construcciones y entregables activos.",
      "client_stack_task2_title": "Módulos",
      "client_stack_task2_desc": "Visibles por acceso de espacio.",
      "client_stack_task3_title": "Historial",
      "client_stack_task3_desc": "Auditorías, archivos, pedidos y notas.",
      "client_routes_title": "Rutas Públicas",
      "partner_greeting_span": "Partner OS",
      "partner_greeting_val": "Centro de Trabajo",
      "partner_h1": "Rutas, referidos y estado.",
      "partner_desc": "Un espacio de partner limpio para solicitudes, cuentas asignadas, enlaces de referido y acciones inmediatas.",
      "partner_cta_app": "Nueva Solicitud",
      "partner_note_default": "El acceso de partner mostrará leads asignados, rutas activas y estado únicamente.",
      "partner_sec_title": "Espacio de Partner",
      "partner_sec_micro": "Arrastra tarjetas para priorizar. Usa la búsqueda para aislar una ruta.",
      "partner_module_gemese_desc": "Ruta de captación de partner.",
      "partner_module_westdetro_desc": "Ruta creativa de partner.",
      "partner_module_omg_desc": "Ruta de cliente de belleza.",
      "partner_module_gemese_os_desc": "Panel de espacio de trabajo.",
      "partner_module_audit_desc": "Nueva solicitud.",
      "partner_module_inbox_desc": "Revisión de manager.",
      "partner_stack_title": "Pila de Partner",
      "partner_stack_task1_title": "Enlace de Solicitud",
      "partner_stack_task1_desc": "Envía prospectos a la ruta de auditoría.",
      "partner_stack_task2_title": "Tabla de Estado",
      "partner_stack_task2_desc": "Rastrea cuentas enviadas y aprobadas.",
      "partner_stack_task3_title": "Acceso a Espacio",
      "partner_stack_task3_desc": "Abre sistemas activos de cliente o artista.",
      "partner_net_title": "Red Activa",
      "admin_greeting_span": "Admin OS",
      "admin_greeting_val": "Consola de Sistema",
      "admin_h1": "Mapa de sistema y controles.",
      "admin_desc": "Admin muestra objetos operativos: identidad, registros, módulos, rutas y estado de desarrollo.",
      "admin_cta_inbox": "Bandeja de Leads",
      "admin_metric_identity": "Identidad",
      "admin_metric_users": "Users",
      "admin_metric_users_status": "Siguiente",
      "admin_metric_data": "Datos",
      "admin_metric_leads": "Leads",
      "admin_metric_leads_status": "D1/API",
      "admin_metric_system": "Sistema",
      "admin_metric_modules": "Modules",
      "admin_metric_modules_status": "Mapa",
      "admin_metric_routes": "Rutas",
      "admin_metric_routes_status": "Mapa",
      "admin_sec_title": "Contrato de Desarrollo",
      "admin_sec_micro": "Objetos listos en el frontend para la integración del backend.",
      "admin_contract_users_title": "Users",
      "admin_contract_users_desc": "Acceso de usuario, sesión, rol y espacio.",
      "admin_contract_work_title": "Workspaces",
      "admin_contract_work_desc": "Una cuenta puede acceder a múltiples espacios comerciales o de artistas.",
      "admin_contract_leads_title": "Leads",
      "admin_contract_leads_desc": "Solicitudes, registros manuales, auditorías y eventos.",
      "admin_contract_modules_title": "Modules",
      "admin_contract_modules_desc": "Tarjetas activadas por espacio, producto, rol y acuerdo.",
      "admin_contract_files_title": "Files",
      "admin_contract_files_desc": "Recursos de proyecto y entregables por espacio.",
      "admin_contract_invoices_title": "Invoices",
      "admin_contract_invoices_desc": "Pedidos, recibos e historial de servicio tras conectar pagos.",
      "admin_queue_title": "Cola del Sistema",
      "admin_queue_task1_title": "Registros de leads",
      "admin_queue_task1_desc": "Revisa solicitudes y cambios de estado.",
      "admin_queue_task2_title": "Mapa de módulos",
      "admin_queue_task2_desc": "Mantén consistentes las superficies del OS.",
      "admin_queue_task3_title": "Modelo de espacio",
      "admin_queue_task3_desc": "Prepara objetos de cuenta para la base de datos.",
      "admin_queue_task4_title": "Salud de API",
      "admin_queue_task4_desc": "Verifica el estado de D1 y endpoints.",
      "admin_rule_title": "Regla de Producto",
      "admin_rule_desc": "BOOSTR sigue siendo una empresa tecnológica que construye Sistemas Operativos a Medida. Las páginas públicas venden la visión; Admin opera la maquinaria.",
      "modules_sec_title": "Registro de Módulos",
      "modules_sec_val": "Superficies oficiales de BOOSTR.",
      "modules_sec_desc": "Cada tarjeta abre una ruta real. El origen del producto reside en docs/MODULES_SOURCE_OF_TRUTH.md.",
      "modules_sec_cta": "Iniciar Auditoría",
      "modules_rule_title": "Regla",
      "modules_rule_desc": "Los módulos BOOSTR se mantienen modulares. Las páginas de cliente se mantienen personalizadas."
    }
  };

  // 2. DETECT LANGUAGE & INITIALIZE
  let currentLang = localStorage.getItem(STORAGE_KEY);
  if (!currentLang) {
    const sysLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    currentLang = SUPPORTED_LANGS.includes(sysLang) ? sysLang : DEFAULT_LANG;
  }

  // 3. APPLY TRANSLATIONS
  function applyTranslations(dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = dict[key];
      if (text) {
        // If it's an input or textarea, translate placeholder
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else {
          // Translate text content safely
          el.textContent = text;
        }
      }
    });

    // Translate document title if marked
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      const text = dict[titleEl.dataset.i18n];
      if (text) document.title = text;
    }
  }

  // 4. FETCH JSON OR USE FALLBACK DICTIONARY
  async function loadTranslations(lang) {
    try {
      const response = await fetch(`/assets/boostr-mother/i18n/${lang}.json`);
      if (response.ok) {
        const dict = await response.json();
        applyTranslations(dict);
        return;
      }
    } catch (err) {
      // Fallback to embedded translation if fetch fails or CORS issue (e.g. file:// scheme)
    }
    applyTranslations(dictionaries[lang] || dictionaries[DEFAULT_LANG]);
  }

  // 5. SET LANGUAGE WORKFLOW
  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    currentLang = lang;
    
    // Toggle active classes on buttons
    document.querySelectorAll('.language-toggle .lang-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });

    loadTranslations(lang);
    
    // Dispatch custom event to notify other scripts
    document.dispatchEvent(new CustomEvent('boostrLangChanged', { detail: { lang } }));
  }

  // 6. INJECT CSS INJECTOR
  const styleId = 'boostr-i18n-toggle-style';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      .language-toggle {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.03);
        padding: 2px;
        margin-left: 10px;
        flex-shrink: 0;
      }
      .language-toggle .lang-btn {
        min-width: 32px;
        height: 24px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: rgba(255, 255, 255, 0.52);
        cursor: pointer;
        font-size: 0.68rem;
        font-weight: 700;
        transition: background 180ms ease, color 180ms ease;
        padding: 0 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .language-toggle .lang-btn.is-active {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }
      .login-foot .language-toggle {
        margin-top: 8px;
        width: 100%;
        justify-content: center;
        margin-left: 0;
      }
      .compact-side .language-toggle {
        margin-top: auto;
        width: 100%;
        justify-content: center;
        margin-left: 0;
      }
    `;
    document.head.appendChild(s);
  }

  // 7. INJECT LANGUAGE SWITCHER TOGGLE
  function injectToggle() {
    if (document.querySelector('.language-toggle')) return;

    const toggleHtml = `
      <div class="language-toggle">
        <button class="lang-btn" data-lang="en" aria-label="English">EN</button>
        <button class="lang-btn" data-lang="es" aria-label="Español">ES</button>
      </div>
    `;

    const topbar = document.querySelector('.topbar');
    const loginFoot = document.querySelector('.login-foot');
    const compactSide = document.querySelector('.compact-side');

    if (topbar) {
      const rolePill = topbar.querySelector('.role-pill') || topbar.querySelector('.bell');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = toggleHtml.trim();
      const toggleEl = tempDiv.firstChild;
      if (rolePill) {
        topbar.insertBefore(toggleEl, rolePill);
      } else {
        topbar.appendChild(toggleEl);
      }
    } else if (loginFoot) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = toggleHtml.trim();
      const toggleEl = tempDiv.firstChild;
      loginFoot.appendChild(toggleEl);
    } else if (compactSide) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = toggleHtml.trim();
      const toggleEl = tempDiv.firstChild;
      compactSide.appendChild(toggleEl);
    }

    // Add event listeners to toggle buttons
    document.querySelectorAll('.language-toggle .lang-btn').forEach(btn => {
      const l = btn.dataset.lang;
      btn.classList.toggle('is-active', l === currentLang);
      btn.addEventListener('click', () => setLanguage(l));
    });
  }

  // RUNTIME INITIATION
  document.addEventListener('DOMContentLoaded', () => {
    injectToggle();
    loadTranslations(currentLang);
  });
  
  // Fallback in case DOMContentLoaded fired already
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    injectToggle();
    loadTranslations(currentLang);
  }
})();
