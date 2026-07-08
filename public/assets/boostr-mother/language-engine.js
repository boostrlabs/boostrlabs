(() => {
  const KEY = "boostr_lang";
  const SUPPORTED = ["en", "es"];
  const DEFAULT = "en";
  const phrases = {
    es: {
      "Home": "Inicio",
      "Open": "Abrir",
      "Access": "Acceder",
      "Continue": "Continuar",
      "Save": "Guardar",
      "Send": "Enviar",
      "Search": "Buscar",
      "Filter": "Filtrar",
      "Status": "Estado",
      "Active": "Activo",
      "New": "Nuevo",
      "Review": "Revisar",
      "Contact": "Contacto",
      "Settings": "Configuracion",
      "Security": "Seguridad",
      "Notifications": "Notificaciones",
      "Activity": "Actividad",
      "Profile": "Perfil",
      "Language": "Idioma",
      "Dashboard": "Dashboard",
      "Partner": "Partner",
      "Client": "Cliente",
      "Artist": "Artista",
      "Products": "Productos",
      "Orders": "Ordenes",
      "Files": "Archivos",
      "Invoices": "Facturas",
      "Loading...": "Cargando..."
    },
    en: {
      "Inicio": "Home",
      "Abrir": "Open",
      "Acceder": "Access",
      "Continuar": "Continue",
      "Guardar": "Save",
      "Enviar": "Send",
      "Buscar": "Search",
      "Filtrar": "Filter",
      "Estado": "Status",
      "Activo": "Active",
      "Nuevo": "New",
      "Revisar": "Review",
      "Contacto": "Contact",
      "Configuracion": "Settings",
      "Seguridad": "Security",
      "Notificaciones": "Notifications",
      "Actividad": "Activity",
      "Perfil": "Profile",
      "Idioma": "Language",
      "Cliente": "Client",
      "Artista": "Artist",
      "Productos": "Products",
      "Ordenes": "Orders",
      "Archivos": "Files",
      "Facturas": "Invoices",
      "Cargando...": "Loading..."
    }
  };

  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const sys = (navigator.language || "").toLowerCase().startsWith("es") ? "es" : DEFAULT;
  let current = SUPPORTED.includes(localStorage.getItem(KEY)) ? localStorage.getItem(KEY) : sys;

  function translateText(value) {
    const raw = String(value || "");
    const trimmed = clean(raw);
    if (!trimmed) return raw;
    const next = phrases[current]?.[trimmed];
    return next ? raw.replace(trimmed, next) : raw;
  }

  async function loadDictionary() {
    try {
      const response = await fetch(`/assets/boostr-mother/i18n/${current}.json`, { cache: "no-store" });
      if (response.ok) return await response.json();
    } catch {
      return {};
    }
    return {};
  }

  async function applyLanguage() {
    document.documentElement.lang = current;
    const dictionary = await loadDictionary();
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const text = dictionary[element.dataset.i18n];
      if (!text) return;
      if (element.matches("input, textarea")) element.placeholder = text;
      else element.textContent = text;
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest("[data-no-i18n]") || ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return clean(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      node.nodeValue = translateText(node.nodeValue);
    });
    document.querySelectorAll("[placeholder],[title],[aria-label]").forEach((element) => {
      ["placeholder", "title", "aria-label"].forEach((attr) => {
        const value = element.getAttribute(attr);
        const next = phrases[current]?.[value];
        if (next) element.setAttribute(attr, next);
      });
    });
    document.querySelectorAll("#boostrLangToggle button").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === current);
    });
  }

  function setLang(lang) {
    current = lang === "es" ? "es" : "en";
    localStorage.setItem(KEY, current);
    applyLanguage();
    document.dispatchEvent(new CustomEvent("boostrLangChanged", { detail: { lang: current } }));
  }

  function injectToggle() {
    if (document.getElementById("boostrLangToggle")) return;
    const style = document.createElement("style");
    style.textContent = ".boostr-lang-toggle{position:fixed;right:16px;bottom:16px;display:inline-flex;gap:3px;align-items:center;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.68);backdrop-filter:blur(18px);border-radius:999px;padding:4px;z-index:99999}.boostr-lang-toggle button{border:0;background:transparent;color:rgba(255,255,255,.64);border-radius:999px;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer}.boostr-lang-toggle button.active{background:rgba(255,255,255,.2);color:#fff}";
    document.head.appendChild(style);
    const toggle = document.createElement("div");
    toggle.id = "boostrLangToggle";
    toggle.className = "boostr-lang-toggle";
    toggle.setAttribute("data-no-i18n", "true");
    toggle.innerHTML = '<button type="button" data-lang="en">EN</button><button type="button" data-lang="es">ES</button>';
    toggle.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang]");
      if (button) setLang(button.dataset.lang);
    });
    document.body.appendChild(toggle);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectToggle();
    applyLanguage();
  });
  if (document.readyState === "interactive" || document.readyState === "complete") {
    injectToggle();
    applyLanguage();
  }
})();
