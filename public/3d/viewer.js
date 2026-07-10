import * as GaussianSplats3D from 'https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@0.4.7/build/gaussian-splats-3d.module.js';

const scenes = {
  glizzy: { title: 'GS Glizzy', url: '/api/3d-model/glizzy' },
  malta: { title: 'GS Malta', url: '/api/3d-model/malta' }
};

const root = document.getElementById('viewer');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const title = document.getElementById('sceneTitle');
const sceneId = document.body.dataset.scene || new URLSearchParams(location.search).get('scene') || '';
let viewer = null;

function setStatus(text, percent = null) {
  status.textContent = text;
  if (percent == null) {
    progress.hidden = true;
  } else {
    progress.hidden = false;
    progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
}

async function modelExists(scene) {
  const response = await fetch(scene.url, { method: 'HEAD', cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `${scene.title} no está disponible (${response.status}).`);
  }
  return Number(response.headers.get('content-length') || 0);
}

function formatSize(bytes) {
  if (!bytes) return '';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function loadScene(id) {
  const scene = scenes[id];
  if (!scene) return;
  title.textContent = scene.title;
  document.title = `${scene.title} · BOOSTR 3D`;
  setStatus('Verificando modelo…', 2);

  try {
    const bytes = await modelExists(scene);
    setStatus(`Cargando ${scene.title}${bytes ? ` · ${formatSize(bytes)}` : ''}…`, 8);

    viewer = new GaussianSplats3D.Viewer({
      rootElement: root,
      cameraUp: [0, -1, -0.6],
      initialCameraPosition: [0, -3, 2],
      initialCameraLookAt: [0, 0, 0],
      sharedMemoryForWorkers: false,
      gpuAcceleratedSort: true,
      integerBasedSort: false,
      antialiased: true,
      logLevel: GaussianSplats3D.LogLevel?.None
    });

    await viewer.addSplatScene(scene.url, {
      format: GaussianSplats3D.SceneFormat.Ply,
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: true,
      progressiveLoad: true,
      onProgress: (percent) => setStatus(`Cargando ${scene.title}…`, percent)
    });

    viewer.start();
    setStatus('Arrastra para rotar · rueda o pellizca para acercar');
    document.body.classList.add('ready');
  } catch (error) {
    console.error(error);
    setStatus(error?.message || 'No se pudo abrir el modelo.');
    document.body.classList.add('error');
  }
}

document.getElementById('fullscreen')?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {}
});

document.getElementById('reset')?.addEventListener('click', () => {
  if (!viewer) return;
  viewer.camera.position.set(0, -3, 2);
  viewer.controls?.target?.set(0, 0, 0);
  viewer.controls?.update?.();
});

window.addEventListener('beforeunload', () => {
  try { viewer?.dispose?.(); } catch {}
});

if (sceneId && scenes[sceneId]) loadScene(sceneId);
