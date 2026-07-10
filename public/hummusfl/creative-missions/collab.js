const missionAssets = {
  VISUAL_BOOT_01: ['Logo principal actual', 'Logo alternativo', 'Fotos del restaurante para validar colores'],
  VISUAL_BOOT_02: ['Logo alternativo actual', 'Logo principal como referencia'],
  ASSET_SCAN_03: ['Fotos de Yelp', 'Fotos de Google Reviews', 'Current assets'],
  FOOD_CUT_04: ['Foto candidata seleccionada', 'Fotos reales del mismo plato', 'Menú actual para verificar ingredientes'],
  FOOD_SYSTEM_05: ['Primer asset de plato terminado', 'Fotos reales de Hummus'],
  MENU_SCAN_06: ['Capturas del menú actual', 'Productos y precios actuales'],
  MENU_COVER_07: ['Fotos reales de la categoría', 'Logo actual', 'Paleta en progreso'],
  PALETTE_08: ['Logo principal', 'Logo alternativo', 'Interior y fotos de comida'],
  TYPE_09: ['Logo actual', 'Menú actual', 'Paleta elegida'],
  PHOTO_CURATE_10: ['Biblioteca Yelp', 'Biblioteca Google', 'Facebook assets', 'Current branding'],
  HERO_11: ['Mejores fotos horizontales', 'Mejores fotos verticales', 'Logo actual'],
  SMARTLINK_12: ['Logo', 'Hero candidata', 'Menú', 'Dirección y datos del restaurante'],
  QR_FRAME_13: ['Logo', 'Paleta', 'Hero o textura de marca'],
  QR_REVIEW_14: ['Logo', 'Fotos de ambiente', 'Reviews reales como referencia'],
  PROMO_15: ['Fotos de comida', 'Logo', 'Productos y precios reales'],
  SOCIAL_16: ['Logo', 'Fotos curadas', 'Branding anterior'],
  REEL_17: ['Videos existentes en redes', 'Logo', 'Fotos para portada'],
  PRODUCT_CARD_18: ['Asset transparente del plato', 'Nombre y precio del menú'],
  ASSET_LIBRARY_19: ['Todos los assets terminados hasta ahora'],
  FILE_NAMES_20: ['Carpeta actual de Hummus', 'Assets ya exportados'],
  IDEA_PACKAGING_21: ['Logo', 'Paleta', 'Patterns o texturas'],
  IDEA_PATTERN_22: ['Logo alternativo', 'Formas presentes en el branding'],
  IDEA_SAUCES_23: ['Fotos reales de salsas', 'Envases actuales si aparecen'],
  IDEA_BUILD_24: ['Menú actual', 'Categorías y extras reales'],
  IDEA_WILD_25: ['Todo el archivo visual de Hummus']
};

const API = '/api/hummus-missions';
const records = new Map();
let mountedCode = '';
let observer;

const q = (selector) => document.querySelector(selector);
const escapeText = (value) => String(value || '');

function formatDate(value) {
  if (!value) return '';
  try { return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return value; }
}

function getCurrentCode() {
  return q('#cardCode')?.textContent?.trim() || '';
}

function renderResources(code) {
  const host = q('#microSteps');
  if (!host) return;
  let panel = q('#missionResources');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'missionResources';
    panel.className = 'mission-resources';
    host.insertAdjacentElement('afterend', panel);
  }
  const assets = missionAssets[code] || ['Raw data y assets actuales de Hummus'];
  panel.innerHTML = `
    <span class="resource-label">ASSETS QUE YA TE OFRECEMOS</span>
    <h3 class="resource-title">No tienes que empezar de cero.</h3>
    <div class="resource-chips">${assets.map((asset) => `<span class="resource-chip">${asset}</span>`).join('')}</div>
  `;
}

function mountSubmission(code) {
  const promptBox = q('#promptBox');
  if (!promptBox) return;
  let panel = q('#missionSubmit');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'missionSubmit';
    panel.className = 'mission-submit';
    promptBox.insertAdjacentElement('afterend', panel);
  }
  panel.innerHTML = `
    <span class="submit-label">TU RESULTADO / TU NOTA</span>
    <h3 class="resource-title">Déjalo aquí para que quede guardado en Hummus OS.</h3>
    <textarea id="missionNote" placeholder="Puedes pegar un texto, explicar lo que hiciste, dejar una idea o anotar qué falta..."></textarea>
    <div class="upload-row">
      <label class="file-label" id="fileLabel">Subir imagen terminada<input id="missionFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label>
      <button class="shared-save" id="sharedSave" type="button">Guardar</button>
    </div>
    <div class="sync-state" id="syncState">Sin cambios nuevos.</div>
    <div class="saved-output" id="savedOutput">
      <span class="submit-label">ÚLTIMO RESULTADO GUARDADO</span>
      <p id="savedNoteText"></p>
      <img class="saved-image" id="savedImage" alt="Asset guardado para esta misión" />
      <div class="saved-meta"><span id="savedFileName"></span><span id="savedAt"></span></div>
    </div>
  `;

  q('#missionFile').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    q('#fileLabel').firstChild.textContent = file ? `Imagen: ${file.name}` : 'Subir imagen terminada';
  });
  q('#sharedSave').addEventListener('click', saveCurrent);
  hydrateForm(code);
}

function hydrateForm(code) {
  const row = records.get(code);
  const note = q('#missionNote');
  const output = q('#savedOutput');
  const image = q('#savedImage');
  if (!note || !output || !image) return;
  note.value = row?.note || '';
  q('#savedNoteText').textContent = row?.note || '';
  q('#savedFileName').textContent = row?.asset_name || '';
  q('#savedAt').textContent = row?.updated_at ? `Guardado ${formatDate(row.updated_at)}` : '';
  if (row?.asset_url) {
    image.src = `${row.asset_url}&v=${encodeURIComponent(row.updated_at || '')}`;
    image.classList.add('is-visible');
  } else {
    image.removeAttribute('src');
    image.classList.remove('is-visible');
  }
  output.classList.toggle('is-visible', Boolean(row?.note || row?.asset_url));
  q('#syncState').textContent = row ? 'Este contenido está sincronizado y visible desde otros dispositivos.' : 'Todavía no hay un resultado compartido para esta idea.';
  q('#syncState').classList.remove('error');
}

async function saveCurrent() {
  const code = getCurrentCode();
  if (!code) return;
  const button = q('#sharedSave');
  const state = q('#syncState');
  const file = q('#missionFile')?.files?.[0];
  if (file && file.size > 8 * 1024 * 1024) {
    state.textContent = 'La imagen pesa más de 8 MB. Comprímela y vuelve a intentar.';
    state.classList.add('error');
    return;
  }
  const form = new FormData();
  form.append('mission_code', code);
  form.append('note', q('#missionNote')?.value || '');
  form.append('completed', q('#completeBtn')?.getAttribute('aria-pressed') === 'true' ? 'true' : 'false');
  if (file) form.append('asset', file);
  button.disabled = true;
  button.textContent = 'Guardando...';
  state.textContent = 'Sincronizando con BOOSTR...';
  state.classList.remove('error');
  try {
    const response = await fetch(API, { method: 'POST', body: form });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'save_failed');
    records.set(code, data.row);
    hydrateForm(code);
    q('#missionFile').value = '';
    q('#fileLabel').firstChild.textContent = 'Subir otra imagen o reemplazarla';
    state.textContent = 'Guardado. Janko puede verlo desde el mismo link.';
  } catch (error) {
    state.textContent = 'No se pudo guardar todavía. Revisa la conexión y vuelve a intentar.';
    state.classList.add('error');
  } finally {
    button.disabled = false;
    button.textContent = 'Guardar';
  }
}

function refreshMission() {
  const code = getCurrentCode();
  if (!code || code === mountedCode) return;
  mountedCode = code;
  renderResources(code);
  mountSubmission(code);
}

async function loadRecords() {
  try {
    const response = await fetch(API, { cache: 'no-store' });
    const data = await response.json();
    if (response.ok && data.ok) data.rows.forEach((row) => records.set(row.mission_code, row));
  } catch {}
  refreshMission();
}

window.addEventListener('DOMContentLoaded', () => {
  observer = new MutationObserver(refreshMission);
  const codeNode = q('#cardCode');
  if (codeNode) observer.observe(codeNode, { childList: true, characterData: true, subtree: true });
  loadRecords();
});