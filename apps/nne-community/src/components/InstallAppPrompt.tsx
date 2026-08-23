import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const ios = typeof navigator !== "undefined" && isIos();

  useEffect(() => {
    if (isStandalone()) return;
    const dismissedAt = Number(localStorage.getItem("nne_install_prompt_dismissed_at") || 0);
    if (Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 3) return;

    const timer = window.setTimeout(() => setVisible(true), 1800);
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!visible || isStandalone()) return null;

  const dismiss = () => {
    localStorage.setItem("nne_install_prompt_dismissed_at", String(Date.now()));
    setVisible(false);
    setShowHelp(false);
  };

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setInstallEvent(null);
      return;
    }
    setShowHelp(true);
  };

  return (
    <>
      <aside className="install-app-prompt" role="dialog" aria-label="Instalar NNE">
        <img src="/assets/brand/nne-app-icon.svg" alt="NNE" />
        <div>
          <strong>Agrega NNE a tu celular</strong>
          <span>Úsala como una app, sin buscar el link cada vez.</span>
        </div>
        <button className="primary-button" onClick={() => void install()}>{installEvent ? "Instalar" : "Cómo"}</button>
        <button className="install-dismiss" aria-label="Cerrar" onClick={dismiss}>×</button>
      </aside>

      {showHelp && (
        <div className="install-help-backdrop" onClick={() => setShowHelp(false)}>
          <section className="card install-help" onClick={(event) => event.stopPropagation()}>
            <div className="eyebrow">NNE EN TU HOME SCREEN</div>
            <h2>{ios ? "Instálala en iPhone." : "Instálala como app."}</h2>
            {ios ? (
              <ol>
                <li>Abre NNE en <strong>Safari</strong>.</li>
                <li>Toca el botón <strong>Compartir</strong> en la barra de Safari.</li>
                <li>Busca <strong>Agregar a pantalla de inicio</strong>.</li>
                <li>Toca <strong>Agregar</strong>. NNE aparecerá junto a tus apps.</li>
              </ol>
            ) : (
              <ol>
                <li>Abre el menú de tu navegador.</li>
                <li>Busca <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</li>
                <li>Confirma la instalación.</li>
              </ol>
            )}
            <p>Al abrirla desde el icono funciona en modo standalone y conserva el login del navegador cuando la plataforma lo permite.</p>
            <button className="primary-button full" onClick={() => setShowHelp(false)}>Listo</button>
          </section>
        </div>
      )}
    </>
  );
}
