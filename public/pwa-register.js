(() => {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  document.documentElement.classList.toggle('boostr-standalone', isStandalone);

  function buildBanner(message, actionLabel, onAction) {
    const existing = document.getElementById('boostr-pwa-banner');
    if (existing) existing.remove();

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
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    close.addEventListener('click', () => banner.remove());
    banner.appendChild(close);

    document.body.appendChild(banner);
    return banner;
  }

  function showIosInstallHint() {
    const isiOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (!isiOS || isStandalone || sessionStorage.getItem('boostr-install-hint-seen')) return;

    window.setTimeout(() => {
      const banner = buildBanner(
        'Install BOOSTR: tap Share, then Add to Home Screen.',
        'Got it',
        () => {
          sessionStorage.setItem('boostr-install-hint-seen', '1');
          banner.remove();
        }
      );
    }, 1400);
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
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      if (registration.waiting && navigator.serviceWorker.controller) {
        buildBanner('A new BOOSTR version is ready.', 'Update BOOSTR', () => {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        });
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            buildBanner('A new BOOSTR version is ready.', 'Update BOOSTR', () => {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            });
          }
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
