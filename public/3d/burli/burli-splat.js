const root = document.getElementById('viewer');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
let viewer = null;

function setStatus(text, percent = null) {
  status.textContent = text;
  if (!progress) return;
  progress.hidden = percent == null;
  if (percent != null && progressBar) progressBar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
}

function fail(error) {
  console.error('BOOSTR 3D BURLi failed:', error);
  setStatus(`No se pudo cargar BURLi: ${error?.message || error}`);
  document.body.classList.add('error');
}

async function inspectModel() {
  const response = await fetch('/api/3d-model/burli', { method: 'HEAD', cache: 'no-store' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Modelo no disponible (${response.status}).`);
  }
  return Number(response.headers.get('content-length') || 0);
}

async function load() {
  try {
    const canvas = document.createElement('canvas');
    if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) throw new Error('Este navegador no tiene WebGL disponible.');

    const bytes = await inspectModel();
    setStatus(`Cargando BURLi${bytes ? ` · ${(bytes / 1024 / 1024).toFixed(1)} MB` : ''}…`, 2);

    const GaussianSplats3D = await import('https://esm.sh/@mkkellogg/gaussian-splats-3d@0.4.7?bundle&deps=three@0.160.0');
    viewer = new GaussianSplats3D.Viewer({
      rootElement: root,
      cameraUp: [0, -1, -0.6],
      initialCameraPosition: [0, -3, 2],
      initialCameraLookAt: [0, 0, 0],
      sharedMemoryForWorkers: false,
      gpuAcceleratedSort: false,
      integerBasedSort: false,
      antialiased: true,
      useBuiltInControls: true,
      logLevel: GaussianSplats3D.LogLevel?.None
    });

    await viewer.addSplatScene('/api/3d-model/burli', {
      format: GaussianSplats3D.SceneFormat.Splat,
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: true,
      progressiveLoad: true,
      onProgress: (percent) => setStatus('Cargando BURLi…', percent)
    });

    viewer.start();
    document.body.classList.add('ready');
    setStatus('BURLi listo · arrastra para rotar · rueda o pellizca para acercar');
  } catch (error) {
    fail(error);
  }
}

document.getElementById('reset')?.addEventListener('click', () => {
  if (!viewer) return;
  viewer.camera.position.set(0, -3, 2);
  viewer.controls?.target?.set(0, 0, 0);
  viewer.controls?.update?.();
});

document.getElementById('fullscreen')?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    fail(error);
  }
});

window.addEventListener('beforeunload', () => viewer?.dispose?.());
load();
