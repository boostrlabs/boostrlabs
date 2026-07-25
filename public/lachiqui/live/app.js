const $ = (selector) => document.querySelector(selector);
const modelSelect = $('#modelSelect');
const scoreSelect = $('#scoreSelect');
const termSelect = $('#termSelect');
const priceInput = $('#priceInput');
const optimisticToggle = $('#optimisticToggle');
let nativeFullscreenActive = false;

function money(value){ return Math.max(0, Math.round(value)).toLocaleString('en-US'); }
function payment(principal, annualRate, months){
  const r = annualRate / 100 / 12;
  if (!r) return principal / months;
  return principal * r * Math.pow(1+r, months) / (Math.pow(1+r, months)-1);
}
function roundLive(value, optimistic){
  const step = optimistic ? 5 : 1;
  return Math.max(0, optimistic ? Math.floor(value/step)*step : Math.round(value));
}
function populateModels(){
  window.TOYOTA_MODELS.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = `${model.name} · ${model.type}`;
    modelSelect.appendChild(option);
  });
  modelSelect.value = 'rav4';
}
function getModel(){ return window.TOYOTA_MODELS.find(m => m.id === modelSelect.value); }
function getTier(){ return window.CREDIT_TIERS.find(t => t.id === scoreSelect.value); }
function calculate(){
  const model = getModel();
  const tier = getTier();
  const term = Number(termSelect.value);
  const optimistic = optimisticToggle.checked;
  const price = Math.max(10000, Number(priceInput.value) || model.msrp);

  // Live estimate assumptions: taxes/fees approximated at 8.5%; optimistic mode applies a promotional discount.
  const promoDiscount = optimistic ? Math.min(1800, price * .035) : 0;
  const estimatedOutTheDoor = (price - promoDiscount) * 1.085;
  const rateBasedDown = Math.round((price * tier.downRate) / 100) * 100;
  let down = Math.max(tier.downMinimum, rateBasedDown);
  if (optimistic && tier.id === 'good') down = 999;
  if (optimistic && tier.id === 'excellent') down = 0;

  const apr = term === 84 ? tier.apr84 : tier.apr72;
  let monthly = payment(Math.max(0, estimatedOutTheDoor - down), apr, term);
  monthly = roundLive(monthly, optimistic);

  $('#vehicleName').textContent = model.name.toUpperCase();
  $('#vehicleType').textContent = model.type;
  $('#scoreLabel').textContent = tier.label;
  $('#vehicleImage').src = `assets/cars/${model.id}.png`;
  $('#vehicleImage').alt = `Toyota ${model.name}`;
  $('#monthlyPayment').textContent = money(monthly);
  $('#downPayment').textContent = money(down);
  $('#downHeadline').textContent = tier.headline;
  $('#downCard').classList.toggle('zero-down', down === 0);
  $('#resultStage').classList.remove('flash');
  requestAnimationFrame(() => $('#resultStage').classList.add('flash'));

  // Punto de integración futuro: permite escuchar estimados sin inventar un endpoint.
  document.dispatchEvent(new CustomEvent('toyota-live:estimate', {
    detail: {
      model: model.id,
      modelName: model.name,
      scoreTier: tier.id,
      scoreLabel: tier.label,
      term,
      price,
      apr,
      down,
      monthly,
      optimistic
    }
  }));
}
function syncModelPrice(){ priceInput.value = getModel().msrp; calculate(); }
function setLiveMode(enabled){
  document.body.classList.toggle('live-mode', enabled);
  $('#fullscreenButton').setAttribute('aria-pressed', String(enabled));
}
async function toggleFullscreen(){
  const shouldEnter = !document.body.classList.contains('live-mode');
  setLiveMode(shouldEnter);

  try {
    if (shouldEnter && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else if (!shouldEnter && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    // El modo CSS sigue funcionando cuando el navegador bloquea Fullscreen API.
  }
}
populateModels();
modelSelect.addEventListener('change', syncModelPrice);
scoreSelect.addEventListener('change', calculate);
termSelect.addEventListener('change', calculate);
optimisticToggle.addEventListener('change', calculate);
$('#calculateButton').addEventListener('click', calculate);
$('#fullscreenButton').addEventListener('click', toggleFullscreen);
document.addEventListener('keydown', (event) => {
  const editing = ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName);
  if (event.key.toLowerCase() === 'f' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    toggleFullscreen();
  }
  if (event.key === 'Escape') setLiveMode(false);
  if (event.key === 'Enter') {
    event.preventDefault();
    calculate();
  }
});
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    nativeFullscreenActive = true;
  } else if (nativeFullscreenActive) {
    nativeFullscreenActive = false;
    setLiveMode(false);
  }
});
calculate();
