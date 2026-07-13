(() => {
  if (window.__BOOSTR_SHARED_UI_V2__) return;
  window.__BOOSTR_SHARED_UI_V2__ = true;

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const routeMap = [
    ["/smart-payment-link", "smart-payment-link"],
    ["/partner-dashboard", "partner-dashboard"],
    ["/accept-invite", "accept-invite"],
    ["/password-reset", "password-reset"],
    ["/forgot-password", "forgot-password"],
    ["/verify-email", "verify-email"],
    ["/founder-access", "founder-access"],
    ["/manager", "manager"],
    ["/admin", "admin"],
    ["/modules", "modules"],
    ["/ecosystem", "ecosystem"],
    ["/audit", "audit"],
    ["/signup", "signup"],
    ["/login", "login"],
    ["/home", "home"],
    ["/app", "app"],
    ["/", "root"]
  ];

  const surface = routeMap.find(([prefix]) => path === prefix || (prefix !== "/" && path.startsWith(`${prefix}/`)))?.[1] || "shared";
  const root = document.documentElement;
  root.dataset.boostrSurface = root.dataset.boostrSurface || surface;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

  function markBody() {
    if (!document.body) return;
    document.body.dataset.boostrSharedUi = "true";
    document.body.dataset.boostrSurface = surface;
    document.body.classList.add("boostr-shared-ui-v2");
  }

  function markActiveNavigation() {
    const links = document.querySelectorAll(".icon-nav a,.utility a,.side-nav a,.boostr-app-nav a");
    links.forEach((link) => {
      try {
        const url = new URL(link.href, location.origin);
        const hrefPath = url.pathname.replace(/\/+$/, "") || "/";
        const active = hrefPath === path || (hrefPath !== "/" && path.startsWith(`${hrefPath}/`));
        if (active) {
          link.classList.add("active");
          link.setAttribute("aria-current", "page");
        }
      } catch {}
    });
  }

  function makeTablesScrollable() {
    document.querySelectorAll("table").forEach((table) => {
      if (table.parentElement?.classList.contains("boostr-table-scroll")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "boostr-table-scroll";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function ensureLocalDock() {
    if (!document.body || document.querySelector(".boostr-production-context,.boostr-local-dock")) return;
    if (["login", "signup", "accept-invite", "password-reset", "forgot-password", "verify-email"].includes(surface)) return;

    const dock = document.createElement("nav");
    dock.className = "boostr-local-dock";
    dock.setAttribute("aria-label", "BOOSTR quick navigation");
    dock.setAttribute("data-no-i18n", "true");
    const items = surface === "app"
      ? [["/app/", "⌂", "Services"], ["/parking/omni-jr/", "P", "Parking"], ["/audit/", "✦", "Audit"], ["/login/", "◎", "Login"]]
      : [["/home/", "⌂", "Home"], ["/app/", "OS", "Services"], ["/modules/", "▦", "Modules"], ["/login/", "◎", "Account"]];
    dock.innerHTML = items.map(([href, icon, label]) => `<a href="${href}" title="${esc(label)}">${esc(icon)}</a>`).join("");
    document.body.appendChild(dock);
  }

  function reconcileFloatingUi() {
    if (!document.body) return;
    const context = document.querySelector(".boostr-production-context");
    const language = document.querySelector(".boostr-lang-toggle");
    document.body.classList.toggle("has-boostr-context", Boolean(context));
    document.body.classList.toggle("has-boostr-language", Boolean(language));
    if (context) context.classList.add("boostr-shared-dock");
    if (!context) ensureLocalDock();
  }

  function decorateCards() {
    document.querySelectorAll(".card,.panel,.metric,.module,.contract-card,.task,.future-card,.boostr-task-card,.boostr-control-card").forEach((card, index) => {
      if (card.dataset.boostrDecorated) return;
      card.dataset.boostrDecorated = "true";
      card.style.setProperty("--boostr-sequence", String(index));
    });
  }

  function bindSearch() {
    const search = document.querySelector(".boostr-app-search[data-filter],input.boostr-app-search[data-filter]");
    if (!search || search.dataset.bound) return;
    search.dataset.bound = "true";
    const selector = search.dataset.filter || "[data-search-item]";
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      document.querySelectorAll(selector).forEach((item) => {
        item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
      });
    });
  }

  function boot() {
    markBody();
    markActiveNavigation();
    makeTablesScrollable();
    decorateCards();
    bindSearch();
    reconcileFloatingUi();

    const observer = new MutationObserver(() => {
      markBody();
      markActiveNavigation();
      makeTablesScrollable();
      decorateCards();
      reconcileFloatingUi();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
