const scenes = {
  glizzy: { title: 'GS Glizzy', url: '/api/3d-model/glizzy', format: 'ply' },
  malta: { title: 'GS Malta', url: '/api/3d-model/malta', format: 'ply' },
  'johanka-ply': { title: 'Johanka 3D · PLY', url: '/api/3d-model/johanka-ply', format: 'ply' },
  'johanka-luma': { title: 'Johanka 3D · Luma', url: '/api/3d-model/johanka-luma', format: 'luma' }
};

const root = document.getElementById('viewer');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const title = document.getElementById('sceneTitle');
const sceneId = document.body.dataset.scene || new URLSearchParams(location.search).get('scene') || '';
let runtime = null;
let resetView = null;

function setStatus(text, percent = null) {
  status.textContent = text;
  progress.hidden = percent == null;
  if (percent != null) progressBar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
}

function fail(error, stage = 'viewer') {
  const message = error?.message || String(error || 'Error desconocido');
  console.error(`BOOSTR 3D ${stage} failed:`, error);
  setStatus(`${stage}: ${message}`);
  document.body.classList.add('error');
}

async function inspectModel(scene) {
  const response = await fetch(scene.url, { method: 'HEAD', cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `${scene.title} no está disponible (${response.status}).`);
  }
  return {
    bytes: Number(response.headers.get('content-length') || 0),
    format: response.headers.get('x-boostr-format') || scene.format
  };
}

function formatSize(bytes) {
  return bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '';
}

function assertWebGL() {
  const canvas = document.createElement('canvas');
  if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) throw new Error('Este navegador no tiene WebGL disponible.');
}

async function loadPly(scene) {
  const GaussianSplats3D = await import('https://esm.sh/@mkkellogg/gaussian-splats-3d@0.4.7?bundle&deps=three@0.160.0');
  const viewer = new GaussianSplats3D.Viewer({
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

  await viewer.addSplatScene(scene.url, {
    format: GaussianSplats3D.SceneFormat.Ply,
    splatAlphaRemovalThreshold: 5,
    showLoadingUI: true,
    progressiveLoad: true,
    onProgress: (percent) => setStatus(`Cargando ${scene.title}…`, percent)
  });
  viewer.start();
  runtime = { dispose: () => viewer.dispose?.() };
  resetView = () => {
    viewer.camera.position.set(0, -3, 2);
    viewer.controls?.target?.set(0, 0, 0);
    viewer.controls?.update?.();
  };
  setStatus('Modelo listo · arrastra para rotar · rueda o pellizca para acercar');
}

async function createThreeBase() {
  const THREE = await import('https://esm.sh/three@0.172.0');
  const { OrbitControls } = await import('https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(root.clientWidth, root.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  root.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, root.clientWidth / root.clientHeight, 0.01, 10000);
  camera.position.set(0, 1.2, 3.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  const onResize = () => {
    camera.aspect = root.clientWidth / root.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(root.clientWidth, root.clientHeight);
  };
  window.addEventListener('resize', onResize);
  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
  return { THREE, renderer, scene, camera, controls, dispose() { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); } };
}

async function loadLuma(sceneConfig) {
  const base = await createThreeBase();
  const { LumaSplatsThree } = await import('https://esm.sh/@lumaai/luma-web@0.1.14?bundle&deps=three@0.172.0');
  const splats = new LumaSplatsThree({ source: sceneConfig.url });
  base.scene.add(splats);
  base.camera.position.set(0, 0.7, 3);
  base.controls.target.set(0, 0, 0);
  runtime = {
    dispose() {
      try { splats.dispose?.(); } catch {}
      base.scene.remove(splats);
      base.dispose();
    }
  };
  resetView = () => {
    base.camera.position.set(0, 0.7, 3);
    base.controls.target.set(0, 0, 0);
    base.controls.update();
  };
  setStatus('Luma listo · arrastra para rotar · rueda o pellizca para acercar');
}

async function loadGltf(sceneConfig) {
  const base = await createThreeBase();
  const { GLTFLoader } = await import('https://esm.sh/three@0.172.0/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(sceneConfig.url, (event) => {
    if (event.total) setStatus(`Cargando ${sceneConfig.title}…`, (event.loaded / event.total) * 100);
  });
  base.scene.add(gltf.scene);
  base.scene.add(new base.THREE.HemisphereLight(0xffffff, 0x222222, 2));
  const directional = new base.THREE.DirectionalLight(0xffffff, 3);
  directional.position.set(4, 6, 5);
  base.scene.add(directional);
  const box = new base.THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new base.THREE.Vector3());
  const size = box.getSize(new base.THREE.Vector3());
  const distance = Math.max(size.length(), 1) * 1.3;
  base.controls.target.copy(center);
  base.camera.position.set(center.x + distance * 0.4, center.y + distance * 0.3, center.z + distance);
  base.controls.update();
  runtime = {
    dispose() {
      gltf.scene.traverse((object) => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          Object.values(material).forEach((value) => value?.isTexture && value.dispose?.());
          material.dispose?.();
        });
      });
      base.dispose();
    }
  };
  resetView = () => {
    base.controls.target.copy(center);
    base.camera.position.set(center.x + distance * 0.4, center.y + distance * 0.3, center.z + distance);
    base.controls.update();
  };
  setStatus('Modelo PBR listo · arrastra para rotar · rueda o pellizca para acercar');
}

async function loadScene(id) {
  const scene = scenes[id];
  if (!scene) return fail(new Error('Escena desconocida.'), 'scene');
  title.textContent = scene.title;
  document.title = `${scene.title} · BOOSTR 3D`;
  try {
    assertWebGL();
    const metadata = await inspectModel(scene);
    const format = String(metadata.format || scene.format).toLowerCase();
    setStatus(`Cargando ${scene.title}${metadata.bytes ? ` · ${formatSize(metadata.bytes)}` : ''}…`, 2);
    if (format === 'ply') await loadPly(scene);
    else if (format === 'luma') await loadLuma(scene);
    else if (format === 'glb' || format === 'gltf') await loadGltf(scene);
    else throw new Error(`Formato no soportado: ${format}`);
    document.body.classList.add('ready');
  } catch (error) {
    fail(error, 'load');
  }
}

document.getElementById('fullscreen')?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) { fail(error, 'fullscreen'); }
});
document.getElementById('reset')?.addEventListener('click', () => resetView?.());
window.addEventListener('beforeunload', () => runtime?.dispose?.());
loadScene(sceneId);
