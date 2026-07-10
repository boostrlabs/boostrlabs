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
let homeView = null;

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

function finite(value) {
  return Number.isFinite(value) && Math.abs(value) < 1e9;
}

function computeBounds(centers, splatCount) {
  if (!centers || !splatCount) return null;
  const sampleTarget = 200000;
  const stride = Math.max(1, Math.floor(splatCount / sampleTarget));
  const xs = [];
  const ys = [];
  const zs = [];
  for (let i = 0; i < splatCount; i += stride) {
    const base = i * 3;
    const x = centers[base];
    const y = centers[base + 1];
    const z = centers[base + 2];
    if (finite(x) && finite(y) && finite(z)) {
      xs.push(x); ys.push(y); zs.push(z);
    }
  }
  if (!xs.length) return null;
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  zs.sort((a, b) => a - b);
  const lo = Math.floor(xs.length * 0.01);
  const hi = Math.max(lo, Math.floor(xs.length * 0.99) - 1);
  const min = [xs[lo], ys[lo], zs[lo]];
  const max = [xs[hi], ys[hi], zs[hi]];
  const center = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2
  ];
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const radius = Math.max(size[0], size[1], size[2], 0.01) * 0.72;
  return { min, max, center, size, radius };
}

function frameLoadedScene() {
  const mesh = viewer?.splatMesh;
  const splatCount = Number(mesh?.getSplatCount?.() || 0);
  const centers = mesh?.splatDataTextures?.baseData?.centers;
  if (!splatCount) throw new Error('El PLY cargó, pero produjo 0 splats renderizables.');
  const bounds = computeBounds(centers, splatCount);
  if (!bounds) throw new Error('No se pudieron calcular los límites del modelo.');

  const [cx, cy, cz] = bounds.center;
  const distance = Math.max(bounds.radius * 3.2, 1.5);
  const cameraPosition = [cx + distance * 0.35, cy - distance, cz + distance * 0.45];

  viewer.camera.position.set(...cameraPosition);
  viewer.camera.up.set(0, 0, 1);
  viewer.controls?.target?.set(cx, cy, cz);
  viewer.camera.lookAt(cx, cy, cz);
  viewer.camera.near = Math.max(distance / 10000, 0.001);
  viewer.camera.far = Math.max(distance * 1000, 1000);
  viewer.camera.updateProjectionMatrix?.();
  viewer.controls?.update?.();

  homeView = { center: bounds.center, cameraPosition, distance };
  viewer.update?.();
  viewer.render?.();
  return { splatCount, bounds };
}

function resetCamera() {
  if (!viewer || !homeView) return;
  viewer.camera.position.set(...homeView.cameraPosition);
  viewer.controls?.target?.set(...homeView.center);
  viewer.camera.lookAt(...homeView.center);
  viewer.controls?.update?.();
  viewer.update?.();
  viewer.render?.();
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
      cameraUp: [0, 0, 1],
      initialCameraPosition: [0, -10, 5],
      initialCameraLookAt: [0, 0, 0],
      sharedMemoryForWorkers: false,
      gpuAcceleratedSort: false,
      integerBasedSort: false,
      antialiased: false,
      useBuiltInControls: true,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode?.Instant,
      renderMode: GaussianSplats3D.RenderMode?.Always,
      ignoreDevicePixelRatio: false,
      logLevel: GaussianSplats3D.LogLevel?.Info
    });

    setStatus(`Leyendo ${scene.title} desde R2…`, 8);
    await viewer.addSplatScene(scene.url, {
      format: GaussianSplats3D.SceneFormat.Ply,
      splatAlphaRemovalThreshold: 0,
      showLoadingUI: true,
      progressiveLoad: false,
      onProgress: (percent, label, loaderStatus) => {
        const phase = loaderStatus === 1 ? 'Procesando' : 'Cargando';
        setStatus(`${phase} ${scene.title}${label ? ` · ${label}` : ''}…`, percent);
      }
    });

    viewer.start();
    const framed = frameLoadedScene();
    setStatus(`${framed.splatCount.toLocaleString()} splats · arrastra para rotar · rueda o pellizca para acercar`);
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

document.getElementById('reset')?.addEventListener('click', resetCamera);

window.addEventListener('beforeunload', () => {
  try { viewer?.dispose?.(); } catch {}
});

loadScene(sceneId);
