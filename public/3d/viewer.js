import * as GaussianSplats3D from 'https://esm.sh/@mkkellogg/gaussian-splats-3d@0.4.7?bundle&deps=three@0.160.0';

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
    progressBar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
  }
}

function fail(error, stage = 'viewer') {
  const message = error?.message || String(error || 'Error desconocido');
  console.error(`BOOSTR 3D ${stage} failed:`, error);
  setStatus(`${stage}: ${message}`);
  document.body.classList.add('error');
}

window.addEventListener('error', (event) => {
  if (!document.body.classList.contains('ready')) fail(event.error || event.message, 'runtime');
});
window.addEventListener('unhandledrejection', (event) => {
  if (!document.body.classList.contains('ready')) fail(event.reason, 'promise');
});

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

function assertWebGL() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!context) throw new Error('Este navegador no tiene WebGL disponible.');
}

async function loadScene(id) {
  const scene = scenes[id];
  if (!scene) return fail(new Error('Escena desconocida.'), 'scene');
  title.textContent = scene.title;
  document.title = `${scene.title} · BOOSTR 3D`;
  setStatus('Preparando motor 3D…', 1);

  try {
    assertWebGL();
    const bytes = await modelExists(scene);
    setStatus(`Cargando ${scene.title}${bytes ? ` · ${formatSize(bytes)}` : ''}…`, 5);

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

    setStatus(`Leyendo ${scene.title} desde R2…`, 8);
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
    fail(error, 'load');
  }
}

document.getElementById('fullscreen')?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    fail(error, 'fullscreen');
  }
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

loadScene(sceneId);