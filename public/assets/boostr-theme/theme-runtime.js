(() => {
  if (window.__BOOSTR_THEME_RUNTIME__) return;
  window.__BOOSTR_THEME_RUNTIME__ = true;

  const STORAGE_KEY = "boostr_system_theme_v1";
  const DEFAULTS = Object.freeze({ theme_id: "night_blue", accent_id: "blue" });
  const THEMES = new Set(["night_blue", "smart_light", "mother_platinum"]);
  const ACCENTS = new Set(["blue", "violet", "rose", "emerald"]);

  const normalize = (input = {}) => ({
    theme_id: THEMES.has(input.theme_id) ? input.theme_id : DEFAULTS.theme_id,
    accent_id: ACCENTS.has(input.accent_id) ? input.accent_id : DEFAULTS.accent_id,
    updated_at: input.updated_at || null
  });

  function readCached() {
    try {
      return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch {
      return { ...DEFAULTS };
    }
  }

  function apply(input, persist = true) {
    const config = normalize(input);
    const root = document.documentElement;

    root.dataset.boostrTheme = config.theme_id;
    root.dataset.boostrAccent = config.accent_id;

    const themeColor = config.theme_id === "smart_light" ? "#f3f3f1" : "#0c1118";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = themeColor;

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
    }

    window.BOOSTR_THEME_STATE = config;
    document.dispatchEvent(new CustomEvent("boostrThemeApplied", { detail: config }));
    return config;
  }

  window.BOOSTR_THEME = Object.freeze({
    defaults: DEFAULTS,
    themes: [...THEMES],
    accents: [...ACCENTS],
    apply,
    current: () => ({ ...(window.BOOSTR_THEME_STATE || readCached()) })
  });

  apply(readCached(), false);

  async function sync() {
    try {
      const response = await fetch("/api/public/theme", {
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false || !data.theme) return;
      apply(data.theme);
    } catch (error) {
      console.warn("BOOSTR theme sync unavailable:", error?.message || error);
    }
  }

  document.addEventListener("boostrThemeUpdated", (event) => apply(event.detail || DEFAULTS));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync, { once: true });
  } else {
    sync();
  }
})();