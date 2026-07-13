(() => {
  const path = location.pathname.replace(/\/+$/, "");
  if (path !== "/app/janko" || window.__JANKO_THEME_SETTINGS__) return;
  window.__JANKO_THEME_SETTINGS__ = true;

  const THEMES = [
    {
      id: "night_blue",
      name: "Night Blue",
      copy: "Dark productivity UI, blue depth, rounded cards and floating navigation.",
      preview: "linear-gradient(145deg,#0d131c,#1d2633 62%,#234c9f)"
    },
    {
      id: "smart_light",
      name: "Smart Light",
      copy: "Monochrome light UI inspired by the approved smart-control reference.",
      preview: "linear-gradient(145deg,#ffffff,#eeeeeb 62%,#d5e6ff)"
    },
    {
      id: "mother_platinum",
      name: "Mother Platinum",
      copy: "Original BOOSTR Mother UI preserved as the legacy fallback.",
      preview: "linear-gradient(145deg,#030405,#23252a 62%,#e9ddbd)"
    }
  ];

  const ACCENTS = [
    { id: "blue", name: "Blue", value: "#3d7cff", background: "linear-gradient(135deg,#233e9b,#3d7cff,#35c0ff)" },
    { id: "violet", name: "Violet", value: "#7c3cff", background: "linear-gradient(135deg,#2a174f,#7c3cff,#d24dff)" },
    { id: "rose", name: "Rose", value: "#ff2e72", background: "linear-gradient(135deg,#63152d,#ff2e72,#ff965c)" },
    { id: "emerald", name: "Emerald", value: "#00a877", background: "linear-gradient(135deg,#0a4e3a,#00a877,#68f0b6)" }
  ];

  let selectedTheme = "night_blue";
  let selectedAccent = "blue";

  const authHeaders = () => {
    const token = localStorage.getItem("boostr_auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  function notify(message, bad = false) {
    let toast = document.getElementById("jankoThemeToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "jankoThemeToast";
      toast.style.cssText = "position:fixed;z-index:10070;left:50%;top:18px;transform:translateX(-50%) translateY(-20px);opacity:0;transition:.22s;padding:12px 16px;border-radius:999px;font:900 12px Inter,Arial,sans-serif;box-shadow:0 18px 70px rgba(0,0,0,.45)";
      document.body.appendChild(toast);
    }
    toast.style.background = bad ? "#ff9292" : "#f7f5ef";
    toast.style.color = "#030405";
    toast.textContent = message;
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(-20px)";
    }, 2400);
  }

  function renderChoices() {
    const themeGrid = document.getElementById("jankoThemeGrid");
    const accentGrid = document.getElementById("jankoAccentGrid");
    if (!themeGrid || !accentGrid) return;

    themeGrid.innerHTML = THEMES.map((theme) => `
      <button type="button" class="janko-theme-card ${theme.id === selectedTheme ? "active" : ""}" data-theme-id="${theme.id}">
        <span class="janko-theme-preview" style="background:${theme.preview}"></span>
        <b>${theme.name}</b>
        <small>${theme.copy}</small>
      </button>
    `).join("");

    accentGrid.innerHTML = ACCENTS.map((accent) => `
      <button type="button" class="janko-accent-chip ${accent.id === selectedAccent ? "active" : ""}" data-accent-id="${accent.id}" aria-label="${accent.name}">
        <span style="background:${accent.background}"></span>
        <b>${accent.name}</b>
      </button>
    `).join("");

    themeGrid.querySelectorAll("[data-theme-id]").forEach((button) => {
      button.onclick = () => {
        selectedTheme = button.dataset.themeId;
        renderChoices();
        previewSelection();
      };
    });

    accentGrid.querySelectorAll("[data-accent-id]").forEach((button) => {
      button.onclick = () => {
        selectedAccent = button.dataset.accentId;
        renderChoices();
        previewSelection();
      };
    });
  }

  function previewSelection() {
    const preview = document.getElementById("jankoThemeLivePreview");
    const theme = THEMES.find((item) => item.id === selectedTheme) || THEMES[0];
    const accent = ACCENTS.find((item) => item.id === selectedAccent) || ACCENTS[0];
    if (!preview) return;
    preview.style.setProperty("--preview-accent", accent.value);
    preview.dataset.light = selectedTheme === "smart_light" ? "true" : "false";
    preview.querySelector("[data-preview-name]").textContent = theme.name;
    preview.querySelector("[data-preview-accent]").textContent = accent.name;
  }

  function resetRegularSections() {
    const main = document.querySelector(".main");
    if (!main) return;
    main.querySelectorAll(":scope > section").forEach((section) => {
      const isSettings = ["jankoThemeSettings", "jankoStripeSettings"].includes(section.id);
      section.style.display = isSettings ? "none" : "";
    });
  }

  function bindModeReset() {
    const nav = document.getElementById("modeNav");
    if (!nav || nav.dataset.themeResetBound === "true") return;
    nav.dataset.themeResetBound = "true";
    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || ["themeSettingsNav", "stripeSettingsNav"].includes(button.id)) return;
      requestAnimationFrame(resetRegularSections);
    });
  }

  function showSettings() {
    const main = document.querySelector(".main");
    const section = document.getElementById("jankoThemeSettings");
    const button = document.getElementById("themeSettingsNav");
    if (!main || !section || !button) return;

    document.querySelectorAll("#modeNav button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    main.querySelectorAll(":scope > section").forEach((item) => {
      item.style.display = item === section ? "" : "none";
    });
    loadSettings();
  }

  function ensureNav() {
    const nav = document.getElementById("modeNav");
    if (!nav || document.getElementById("themeSettingsNav")) {
      bindModeReset();
      return;
    }

    const button = document.createElement("button");
    button.id = "themeSettingsNav";
    button.type = "button";
    button.textContent = "Theme / Color";
    button.onclick = showSettings;
    nav.appendChild(button);
    bindModeReset();
  }

  function ensureStyle() {
    if (document.getElementById("jankoThemeSettingsStyle")) return;
    const style = document.createElement("style");
    style.id = "jankoThemeSettingsStyle";
    style.textContent = `
      #jankoThemeSettings .theme-settings-layout{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:14px}
      #jankoThemeSettings .theme-settings-block{border:1px solid var(--line);background:rgba(0,0,0,.22);border-radius:22px;padding:14px}
      #jankoThemeSettings .theme-settings-block h3{margin:0 0 5px;font-size:18px}
      #jankoThemeSettings .theme-settings-block>p{margin:0 0 13px;color:var(--muted);font-size:11px;line-height:1.5}
      #jankoThemeSettings .janko-theme-grid{display:grid;gap:9px}
      #jankoThemeSettings .janko-theme-card{display:grid;grid-template-columns:74px 1fr;gap:4px 11px;align-items:center;min-height:82px;border:1px solid var(--line);background:rgba(255,255,255,.035);color:var(--ink);border-radius:18px;padding:9px;text-align:left;cursor:pointer}
      #jankoThemeSettings .janko-theme-card.active{border-color:rgba(124,236,255,.58);background:rgba(124,236,255,.09)}
      #jankoThemeSettings .janko-theme-preview{grid-row:span 2;width:74px;height:62px;border-radius:14px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
      #jankoThemeSettings .janko-theme-card b{font-size:14px}
      #jankoThemeSettings .janko-theme-card small{color:var(--muted);font-size:10px;line-height:1.35}
      #jankoThemeSettings .janko-accent-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
      #jankoThemeSettings .janko-accent-chip{border:1px solid var(--line);background:rgba(255,255,255,.035);color:var(--ink);border-radius:17px;padding:8px;display:grid;gap:7px;text-align:left;cursor:pointer}
      #jankoThemeSettings .janko-accent-chip.active{border-color:#fff}
      #jankoThemeSettings .janko-accent-chip span{height:42px;border-radius:12px}
      #jankoThemeSettings .janko-accent-chip b{font-size:11px}
      #jankoThemeSettings .theme-live-preview{--preview-accent:#3d7cff;min-height:290px;border-radius:24px;padding:16px;color:#f7f9fc;background:radial-gradient(circle at 90% 0,color-mix(in srgb,var(--preview-accent) 34%,transparent),transparent 34%),linear-gradient(145deg,#0d131c,#1d2633);display:flex;flex-direction:column;gap:10px;box-shadow:0 24px 70px rgba(0,0,0,.34)}
      #jankoThemeSettings .theme-live-preview[data-light="true"]{color:#24262a;background:radial-gradient(circle at 90% 0,color-mix(in srgb,var(--preview-accent) 20%,transparent),transparent 34%),linear-gradient(145deg,#fff,#ececea)}
      #jankoThemeSettings .theme-live-preview .preview-top{display:flex;justify-content:space-between;gap:10px}
      #jankoThemeSettings .theme-live-preview .preview-pill{border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:999px;padding:7px 9px;font-size:9px;font-weight:950}
      #jankoThemeSettings .theme-live-preview h3{font-size:30px;line-height:.95;letter-spacing:-.05em;margin:12px 0 0}
      #jankoThemeSettings .theme-live-preview p{margin:0;opacity:.58;font-size:11px;line-height:1.45}
      #jankoThemeSettings .preview-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto}
      #jankoThemeSettings .preview-card{min-height:78px;border:1px solid color-mix(in srgb,currentColor 13%,transparent);background:color-mix(in srgb,currentColor 5%,transparent);border-radius:17px;padding:11px;display:flex;flex-direction:column;justify-content:space-between}
      #jankoThemeSettings .preview-card b{font-size:12px}.preview-card span{font-size:9px;opacity:.55}
      #jankoThemeSettings .save-theme{width:100%;min-height:50px;margin-top:11px;border:0;border-radius:999px;background:linear-gradient(135deg,var(--preview-accent),#31baff);color:#fff;font-weight:950;cursor:pointer}
      #jankoThemeSettings .scope-note{margin-top:11px;border:1px solid rgba(125,255,158,.2);background:rgba(125,255,158,.06);border-radius:18px;padding:11px;color:var(--muted);font-size:10px;line-height:1.45}
      @media(max-width:900px){#jankoThemeSettings .theme-settings-layout{grid-template-columns:1fr}}
      @media(max-width:520px){#jankoThemeSettings .janko-accent-grid{grid-template-columns:1fr 1fr}#jankoThemeSettings .janko-theme-card{grid-template-columns:62px 1fr}#jankoThemeSettings .janko-theme-preview{width:62px}}
    `;
    document.head.appendChild(style);
  }

  function buildPanel() {
    ensureStyle();
    const main = document.querySelector(".main");
    if (!main) return;

    let section = document.getElementById("jankoThemeSettings");
    if (!section) {
      section = document.createElement("section");
      section.id = "jankoThemeSettings";
      section.className = "section glass";
      section.style.display = "none";
      section.innerHTML = `
        <div class="section-head">
          <div><span class="kicker">ADMIN / CEO SETTINGS</span><h2>Theme / Color</h2></div>
          <span class="pill status" id="jankoThemeStatus">Cargando...</span>
        </div>
        <div class="theme-settings-layout">
          <div style="display:grid;gap:12px">
            <div class="theme-settings-block">
              <h3>Theme</h3>
              <p>Selecciona la estructura visual del UI compartido de BOOSTR.</p>
              <div class="janko-theme-grid" id="jankoThemeGrid"></div>
            </div>
            <div class="theme-settings-block">
              <h3>Color</h3>
              <p>El accent controla botones, estados activos, glows y navegación.</p>
              <div class="janko-accent-grid" id="jankoAccentGrid"></div>
            </div>
          </div>
          <div class="theme-settings-block">
            <div class="theme-live-preview" id="jankoThemeLivePreview">
              <div class="preview-top"><span class="preview-pill" data-preview-name>Night Blue</span><span class="preview-pill" data-preview-accent>Blue</span></div>
              <h3>BOOSTR shared UI</h3>
              <p>Dashboard, Admin, Manager, login, modules and shared workspace surfaces.</p>
              <div class="preview-cards"><div class="preview-card"><span>ACTIVE MODULE</span><b>Audit</b></div><div class="preview-card"><span>SYSTEM</span><b>Theme</b></div></div>
              <button class="save-theme" id="saveJankoTheme" type="button">Aplicar a BOOSTR</button>
            </div>
            <div class="scope-note">Los Custom OS y módulos con diseño propio quedan protegidos y no reciben este theme. Solo Janko con rol Admin/CEO puede guardar cambios globales.</div>
          </div>
        </div>
      `;
      main.appendChild(section);
      document.getElementById("saveJankoTheme").onclick = saveSettings;
      renderChoices();
      previewSelection();
    }

    ensureNav();
  }

  async function loadSettings() {
    const status = document.getElementById("jankoThemeStatus");
    if (!status) return;

    try {
      const response = await fetch("/api/founder-settings/theme", {
        headers: authHeaders(),
        credentials: "same-origin",
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw data;
      selectedTheme = data.theme?.theme_id || "night_blue";
      selectedAccent = data.theme?.accent_id || "blue";
      status.textContent = "CEO ACCESS";
      status.style.color = "var(--green)";
      renderChoices();
      previewSelection();
    } catch (error) {
      status.textContent = "SIN ACCESO";
      status.style.color = "var(--red)";
      if (error?.error === "janko_ceo_only") {
        document.getElementById("themeSettingsNav")?.remove();
        document.getElementById("jankoThemeSettings")?.remove();
        resetRegularSections();
        return;
      }
      notify(error?.message || error?.error || "No se pudo cargar Theme / Color", true);
    }
  }

  async function saveSettings() {
    const button = document.getElementById("saveJankoTheme");
    if (!button) return;
    button.disabled = true;

    try {
      const response = await fetch("/api/founder-settings/theme", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          theme_id: selectedTheme,
          accent_id: selectedAccent
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw data;

      try {
        localStorage.setItem("boostr_system_theme_v1", JSON.stringify(data.theme));
      } catch {}
      document.dispatchEvent(new CustomEvent("boostrThemeUpdated", { detail: data.theme }));
      document.getElementById("jankoThemeStatus").textContent = "APLICADO";
      notify("Theme global actualizado");
    } catch (error) {
      notify(error?.message || error?.error || "No se pudo guardar Theme / Color", true);
    } finally {
      button.disabled = false;
    }
  }

  const observer = new MutationObserver(() => {
    buildPanel();
    ensureNav();
    bindModeReset();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  buildPanel();
  setTimeout(buildPanel, 250);
  setTimeout(buildPanel, 1000);
  addEventListener("pagehide", () => observer.disconnect(), { once: true });
})();