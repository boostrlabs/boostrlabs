(() => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isSpanish = (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('es');
  document.documentElement.classList.toggle('boostr-standalone', isStandalone);

  function copy(es, en) { return isSpanish ? es : en; }

  function buildBanner(message, actionLabel, onAction) {
    document.getElementById('boostr-pwa-banner')?.remove();
    const banner = document.createElement('section');
    banner.id = 'boostr-pwa-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');

    const text = document.createElement('span');
    text.textContent = message;
    banner.appendChild(text);

    if (actionLabel && onAction) {
      const action = document.createElement('button');
      action.type = 'button';
      action.textContent = actionLabel;
      action.addEventListener('click', onAction);
      banner.appendChild(action);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'boostr-pwa-close';
    close.setAttribute('aria-label', copy('Cerrar', 'Dismiss'));
    close.textContent = '×';
    close.addEventListener('click', () => banner.remove());
    banner.appendChild(close);
    document.body.appendChild(banner);
    return banner;
  }

  function showIosInstallHint() {
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isiOS || isStandalone || sessionStorage.getItem('boostr-install-hint-seen')) return;
    window.setTimeout(() => {
      const banner = buildBanner(
        copy('Instala BOOSTR: toca Compartir y luego Agregar a pantalla de inicio.', 'Install BOOSTR: tap Share, then Add to Home Screen.'),
        copy('Entendido', 'Got it'),
        () => {
          sessionStorage.setItem('boostr-install-hint-seen', '1');
          banner.remove();
        }
      );
    }, 1600);
  }

  if (!('serviceWorker' in navigator)) {
    showIosInstallHint();
    return;
  }

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' });
      const offerUpdate = () => buildBanner(
        copy('Hay una nueva versión de BOOSTR disponible.', 'A new BOOSTR version is ready.'),
        copy('Actualizar BOOSTR', 'Update BOOSTR'),
        () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      );

      if (registration.waiting && navigator.serviceWorker.controller) offerUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate();
        });
      });
      await registration.update();
    } catch (error) {
      console.warn('BOOSTR PWA registration failed:', error);
    } finally {
      showIosInstallHint();
    }
  });
})();
