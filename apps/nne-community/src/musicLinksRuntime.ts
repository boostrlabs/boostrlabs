const MUSIC_LINKS: Array<{ match: string; slug: string }> = [
  { match: "sisisi", slug: "sisisi" },
  { match: "de-descargue", slug: "de-descargue" },
  { match: "caption", slug: "caption" }
];

function enhanceMusicStrip() {
  document.querySelectorAll<HTMLElement>(".music-strip article").forEach((card) => {
    if (card.dataset.smartMusicLink === "ready") return;
    const image = card.querySelector<HTMLImageElement>("img");
    const alt = (image?.alt || card.textContent || "").toLowerCase();
    const asset = (image?.getAttribute("src") || "").toLowerCase();
    const target = MUSIC_LINKS.find((item) => alt.includes(item.match.replace("-", " ")) || asset.includes(item.match));
    if (!target) return;

    const href = `/music/${target.slug}`;
    card.dataset.smartMusicLink = "ready";
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${image?.alt || "Música"} — abrir links de escucha`);
    card.style.cursor = "pointer";

    const open = () => { window.location.href = href; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

if (typeof document !== "undefined") {
  const observer = new MutationObserver(enhanceMusicStrip);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceMusicStrip, { once: true });
  else enhanceMusicStrip();
}
