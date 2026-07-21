const translations = {
  es: {
    draft:"BORRADOR · NO PUBLICAR HASTA APROBACIÓN FINAL DE TÉRMINOS",kicker:"TOYOTA OF HOLLYWOOD × LA CHIQUI",reservedBadge:"PRECIO RESERVADO",julyOnly:"SOLO JULIO",headline:"TACOMA SR5 2026<br><span>CERO MILLAS</span>",freezeQuestion:"¿NEGOCIAR TU PAGO MENSUAL EN 2026? ¿CON TANTA TECNOLOGÍA?",freezeAnswer:"INNECESARIO · RESERVA Y <span>CONGELA</span> EL PAGO DE TU TACOMA YA",perMonth:"AL MES",leaseLabel:"LEASE",heroTerms:"$2,000 DE ENTRADA · 36 MESES · 10,000 MILLAS/AÑO",realUnit:"UNIDAD REAL · TOYOTA OF HOLLYWOOD",financeAlt:"O FINANCIA DESDE",perMonthShort:"/MES",financeTerms:"$2,000 DE ENTRADA · 72 MESES · 5.99% APR",countdownLabel:"NO PIERDAS TU $299 · LA OFERTA TERMINA EN",days:"días",hours:"horas",minutes:"min",seconds:"seg",formKicker:"TOYOTA OF HOLLYWOOD × LA CHIQUI",hoursCopy:"Abierto todos los días · 8:30 a. m. a 12:00 a. m.",formTitle:"RESERVA TU PRECIO",formIntro:"Completa tus datos y recibe un QR con tu pago de $299 congelado por 72 horas",firstName:"Nombre",lastName:"Apellido",continue:"CONTINUAR",contactHint:"Escribe tu teléfono o tu email · solo uno es obligatorio",contactRequired:"Escribe tu teléfono o tu email para continuar",phone:"Teléfono",email:"Email",back:"ATRÁS",score:"Score estimado",choose:"Selecciona una opción",noHistory:"Sin historial de crédito",notSure:"No estoy seguro",consent:"Acepto ser contactado por Toyota of Hollywood y el equipo de Adriana Quintero sobre esta promoción. Mi pase QR no constituye aprobación de crédito ni reserva un vehículo.",submit:"RESERVAR MI PRECIO",legalLead:"OFERTA SUJETA A APROBACIÓN DE CRÉDITO · NO TODOS CALIFICAN · IMPUESTOS Y CARGOS NO INCLUIDOS",legalSummary:"Términos de la oferta",passKicker:"TU PRECIO CONGELADO",passTitle:"¡FELICIDADES!",passCopy:"Lograste congelar tu pago mensual en",passDuration:"Tu precio congelado estará disponible durante 72 horas",passUrgency:"VE CON EL TEAM LA CHIQUI ANTES DE QUE TERMINE",savePass:"GUARDAR MI QR",passNote:"Válido por 72 horas · no representa aprobación ni reserva de vehículo",step:"Paso",of:"de",required:"Completa los campos requeridos para continuar",sending:"CREANDO…",error:"No pudimos crear tu pase · inténtalo nuevamente",expired:"OFERTA FINALIZADA"
  },
  en: {
    draft:"DRAFT · DO NOT PUBLISH UNTIL FINAL TERMS ARE APPROVED",kicker:"TOYOTA OF HOLLYWOOD × LA CHIQUI",reservedBadge:"RESERVED PRICE",julyOnly:"JULY ONLY",headline:"2026 TACOMA SR5<br><span>ZERO MILES</span>",freezeQuestion:"NEGOTIATE YOUR MONTHLY PAYMENT IN 2026? WITH THIS MUCH TECHNOLOGY?",freezeAnswer:"UNNECESSARY · RESERVE AND <span>FREEZE</span> YOUR TACOMA PAYMENT NOW",perMonth:"PER MONTH",leaseLabel:"LEASE",heroTerms:"$2,000 DOWN · 36 MONTHS · 10,000 MILES/YEAR",realUnit:"ACTUAL UNIT · TOYOTA OF HOLLYWOOD",financeAlt:"OR FINANCE FROM",perMonthShort:"/MO",financeTerms:"$2,000 DOWN · 72 MONTHS · 5.99% APR",countdownLabel:"DON'T MISS YOUR $299 · OFFER ENDS IN",days:"days",hours:"hours",minutes:"min",seconds:"sec",formKicker:"TOYOTA OF HOLLYWOOD × LA CHIQUI",hoursCopy:"Open daily · 8:30 a.m. to 12:00 a.m.",formTitle:"RESERVE YOUR PRICE",formIntro:"Complete your information and receive a QR that freezes your $299 payment for 72 hours",firstName:"First name",lastName:"Last name",continue:"CONTINUE",contactHint:"Enter your phone or email · only one is required",contactRequired:"Enter your phone or email to continue",phone:"Phone",email:"Email",back:"BACK",score:"Estimated credit score",choose:"Choose an option",noHistory:"No credit history",notSure:"I'm not sure",consent:"I agree to be contacted by Toyota of Hollywood and Adriana Quintero's team about this promotion. My QR pass is not a credit approval and does not reserve a vehicle.",submit:"RESERVE MY PRICE",legalLead:"OFFER SUBJECT TO CREDIT APPROVAL · NOT ALL CUSTOMERS QUALIFY · TAXES AND FEES NOT INCLUDED",legalSummary:"Offer terms",passKicker:"YOUR FROZEN PRICE",passTitle:"CONGRATULATIONS!",passCopy:"You froze your monthly payment at",passDuration:"Your frozen price will be available for 72 hours",passUrgency:"GO TO TEAM LA CHIQUI BEFORE THE TIMER ENDS",savePass:"SAVE MY QR",passNote:"Valid for 72 hours · not a credit approval or vehicle reservation",step:"Step",of:"of",required:"Complete the required fields to continue",sending:"CREATING…",error:"We could not create your pass · please try again",expired:"OFFER ENDED"
  }
};

let language = localStorage.getItem("toh-language") === "en" ? "en" : "es";
let step = 1;
let lastPass = null;
let passCountdownTimer = null;
const form = document.getElementById("leadForm");
const errorBox = document.getElementById("formError");

function setLanguage(nextLanguage) {
  language = nextLanguage;
  localStorage.setItem("toh-language", language);
  document.documentElement.lang = language;
  document.querySelectorAll("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === language));
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translations[language][element.dataset.i18n];
    if (value) element.textContent = value;
  });
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const value = translations[language][element.dataset.i18nHtml];
    if (value) element.innerHTML = value;
  });
  document.querySelectorAll("[data-lang-block]").forEach((element) => { element.hidden = element.dataset.langBlock !== language; });
  updateProgress();
}

function updateProgress() {
  document.querySelectorAll(".form-step").forEach((element) => element.classList.toggle("active", Number(element.dataset.step) === step));
  const percent = Math.round((step / 3) * 100);
  document.getElementById("progressText").textContent = `${translations[language].step} ${step} ${translations[language].of} 3`;
  document.getElementById("progressPct").textContent = `${percent}%`;
  document.getElementById("progressBar").style.width = `${percent}%`;
  errorBox.classList.remove("show");
}

function currentStepIsValid() {
  const currentStep = document.querySelector(`.form-step[data-step="${step}"]`);
  if (step === 2) {
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    phone.setCustomValidity("");
    if (!phone.value.trim() && !email.value.trim()) {
      phone.setCustomValidity(translations[language].contactRequired);
      phone.reportValidity();
      errorBox.textContent = translations[language].contactRequired;
      errorBox.classList.add("show");
      return false;
    }
  }
  const fields = [...currentStep.querySelectorAll("input[required],select[required],input[type=email]")];
  const invalid = fields.find((field) => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    errorBox.textContent = translations[language].required;
    errorBox.classList.add("show");
    return false;
  }
  return true;
}

function advanceStep() {
  if (!currentStepIsValid()) return;
  step = Math.min(3, step + 1);
  updateProgress();
  document.querySelector(`.form-step[data-step="${step}"] input:not([type=hidden]),.form-step[data-step="${step}"] select`)?.focus();
}

function updatePassCountdown() {
  if (!lastPass?.expiresAt) return;
  const remaining = Math.max(0, Date.parse(lastPass.expiresAt) - Date.now());
  const totalHours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  document.getElementById("passHours").textContent = String(totalHours).padStart(2, "0");
  document.getElementById("passMinutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("passSeconds").textContent = String(seconds).padStart(2, "0");
  if (remaining === 0 && passCountdownTimer) {
    clearInterval(passCountdownTimer);
    passCountdownTimer = null;
  }
}

function startPassCountdown() {
  if (passCountdownTimer) clearInterval(passCountdownTimer);
  updatePassCountdown();
  passCountdownTimer = setInterval(updatePassCountdown, 1000);
}

function updateCountdown() {
  const end = Date.parse("2026-07-31T23:59:59-04:00");
  const remaining = Math.max(0, end - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
  if (remaining === 0) {
    document.querySelectorAll(".primary-cta,.nav-cta,.submit").forEach((element) => {
      element.textContent = translations[language].expired;
      element.setAttribute("aria-disabled", "true");
      if (element.tagName === "BUTTON") element.disabled = true;
    });
  }
}

document.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
document.querySelectorAll(".next").forEach((button) => button.addEventListener("click", advanceStep));
document.querySelectorAll(".back").forEach((button) => button.addEventListener("click", () => { step = Math.max(1, step - 1); updateProgress(); }));

form.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing || event.target.tagName === "BUTTON") return;
  event.preventDefault();
  if (step < 3) advanceStep();
  else form.requestSubmit();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentStepIsValid()) return;
  const submit = form.querySelector(".submit");
  submit.disabled = true;
  submit.textContent = translations[language].sending;
  errorBox.classList.remove("show");

  const data = new FormData(form);
  const params = new URLSearchParams(location.search);
  const payload = {
    first_name: data.get("first_name"),
    last_name: data.get("last_name"),
    phone: data.get("phone"),
    email: data.get("email"),
    score: data.get("score"),
    consent: data.get("consent") === "on",
    company: data.get("company"),
    source: params.get("source") || params.get("utm_source") || "toyota-lachiqui",
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
    page_url: location.href
  };

  try {
    const response = await fetch("/api/toyota/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "request_failed");
    lastPass = result;
    document.getElementById("qrImage").src = result.qrImageUrl;
    document.getElementById("passCode").textContent = result.code;
    const formatted = new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", { dateStyle:"medium", timeStyle:"short", timeZone:"America/New_York" }).format(new Date(result.expiresAt));
    document.getElementById("expiryText").textContent = language === "es" ? `Expira: ${formatted}` : `Expires: ${formatted}`;
    document.getElementById("passModal").classList.add("open");
    startPassCountdown();
    form.reset();
    step = 1;
    updateProgress();
  } catch {
    errorBox.textContent = translations[language].error;
    errorBox.classList.add("show");
  } finally {
    submit.disabled = false;
    submit.textContent = translations[language].submit;
  }
});

document.getElementById("closeModal").addEventListener("click", () => document.getElementById("passModal").classList.remove("open"));
document.getElementById("passModal").addEventListener("click", (event) => { if (event.target.id === "passModal") event.currentTarget.classList.remove("open"); });
document.getElementById("savePass").addEventListener("click", async () => {
  if (!lastPass) return;
  const response = await fetch(lastPass.qrImageUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${lastPass.code}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

setLanguage(language);
updateCountdown();
setInterval(updateCountdown, 1000);
