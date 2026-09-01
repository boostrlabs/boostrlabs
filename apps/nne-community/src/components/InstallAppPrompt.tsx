import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "nne-pwa-install-dismissed";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isInstalled() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);
    const revealIos = window.setTimeout(() => {
      if (ios) setVisible(true);
    }, 1800);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      window.setTimeout(() => setVisible(true), 1000);
    };
    const handleInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
      localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(revealIos);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
    setShowIosHelp(false);
  };

  const install = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setInstallEvent(null);
  };

  if (!visible || (!isIos && !installEvent)) return null;

  return (
    <>
      <aside className="install-app-banner" aria-label="Instalar NNE × WESTDETRO">
        <img src={`${import.meta.env.BASE_URL}icons/nne-icon-v2-192.png`} alt="" />
        <div>
          <strong>Ten NNE en tu teléfono</strong>
          <span>Entra más rápido a tus chambas y rewards.</span>
        </div>
        <button className="install-app-action" type="button" onClick={install}>Agregar</button>
        <button className="install-app-close" type="button" onClick={dismiss} aria-label="Cerrar">×</button>
      </aside>

      {showIosHelp && (
        <div className="install-help-backdrop" role="presentation" onClick={() => setShowIosHelp(false)}>
          <section className="install-help-card" role="dialog" aria-modal="true" aria-labelledby="install-help-title" onClick={(event) => event.stopPropagation()}>
            <img src={`${import.meta.env.BASE_URL}icons/nne-icon-v2-192.png`} alt="NNE" />
            <p className="eyebrow">INSTALAR EN IPHONE</p>
            <h2 id="install-help-title">Agrégala a tu inicio.</h2>
            <ol>
              <li>Toca <strong>Compartir</strong> en Safari.</li>
              <li>Elige <strong>Agregar a pantalla de inicio</strong>.</li>
              <li>Confirma tocando <strong>Agregar</strong>.</li>
            </ol>
            <button className="primary-button" type="button" onClick={() => setShowIosHelp(false)}>Entendido</button>
          </section>
        </div>
      )}
    </>
  );
}
