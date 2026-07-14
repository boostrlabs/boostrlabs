const root = document.getElementById('viewer');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const modelUrl = document.body.dataset.modelUrl;
const modelTitle = document.body.dataset.modelTitle || 'Modelo 3D';
let resetView = null;
let runtime = null;

function setStatus(text, percent = null) {
  status.textContent = text;
  if (progress) progress.hidden = percent == null;
  if (progressBar && percent != null) progressBar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
}

function fail(error) {
  console.error('BOOSTR Doll Viewer failed:', error);
  setStatus(`load: ${error?.message || error}`);
  document.body.classList.add('error');
}

async function load() {
  try {
    const THREE = await import('https://esm.sh/three@0.172.0');
    const { OrbitControls } = await import('https://esm.sh/three@0.172.0/examples/jsm/controls/OrbitControls.js');
    const { GLTFLoader } = await import('https://esm.sh/three@0.172.0/examples/jsm/loaders/GLTFLoader.js');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, root.clientWidth / root.clientHeight, 0.01, 10000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 7, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd8ff, 1.2);
    fill.position.set(-4, 3, 2);
    scene.add(fill);

    setStatus(`Descargando ${modelTitle}…`, 10);
    const response = await fetch(`${modelUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se pudo descargar ${modelTitle} (${response.status}).`);
    const buffer = await response.arrayBuffer();
    setStatus(`Procesando ${modelTitle}…`, 85);

    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => loader.parse(buffer, '', resolve, reject));
    scene.add(gltf.scene);

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const distance = maxDim * 2.2;
    controls.target.copy(center);
    camera.position.set(center.x + distance * 0.32, center.y + distance * 0.18, center.z + distance);
    controls.minDistance = maxDim * 0.7;
    controls.maxDistance = maxDim * 6;
    controls.update();

    resetView = () => {
      controls.target.copy(center);
      camera.position.set(center.x + distance * 0.32, center.y + distance * 0.18, center.z + distance);
      controls.update();
    };

    const resize = () => {
      camera.aspect = root.clientWidth / root.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(root.clientWidth, root.clientHeight);
    };
    window.addEventListener('resize', resize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    runtime = { dispose() { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); controls.dispose(); renderer.dispose(); } };
    document.body.classList.add('ready');
    setStatus(`${modelTitle} listo · arrastra para rotar · pellizca para acercar`);
  } catch (error) {
    fail(error);
  }
}

document.getElementById('reset')?.addEventListener('click', () => resetView?.());
document.getElementById('fullscreen')?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) { fail(error); }
});
window.addEventListener('beforeunload', () => runtime?.dispose?.());
load();
