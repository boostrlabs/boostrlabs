const translations = {
  es: {
    draft:"BORRADOR · NO PUBLICAR HASTA APROBACIÓN FINAL DE TÉRMINOS",navCta:"RESERVAR MI CITA",kicker:"OFERTA DE JULIO · EQUIPO DE LA CHIQUI",headline:"TU TACOMA.<br><span>TU MOMENTO.</span>",heroCopy:"Solicita tu cita y recibe un pase QR personalizado, válido por 72 horas, para presentar esta promoción con el equipo de Adriana Quintero.",countdownLabel:"LA PROMOCIÓN TERMINA EN",days:"días",hours:"horas",minutes:"min",seconds:"seg",heroCta:"RESERVAR MI CITA",heroNote:"La solicitud no reserva una unidad ni garantiza aprobación. Sujeto a inventario y calificación.",monthly:"PAGO MENSUAL",perMonth:"por mes",due:"TOTAL AL FIRMAR",atSigning:"al firmar",leaseLine:"Oferta de lease: 36 pagos mensuales. Para clientes Tier 1+ que califiquen.",vehicleDetail:"SR5 · 2026 · NUEVA · 0 MILLAS",stepsTitle:"ASÍ DE FÁCIL",step1Title:"Completa tus datos",step1Copy:"Toma menos de un minuto.",step2Title:"Guarda tu pase QR",step2Copy:"Se genera al instante y dura 72 horas.",step3Title:"Confirma tu cita",step3Copy:"El equipo de La Chiqui te contactará para coordinar tu visita.",formKicker:"TOYOTA OF HOLLYWOOD × LA CHIQUI",formSideTitle:"SOLICITA TU CITA",formSideCopy:"Completa el formulario. Si calificas para los términos anunciados, el equipo te ayudará a confirmar disponibilidad y próximos pasos.",hoursCopy:"Abierto todos los días · 8:30 a. m. – 12:00 a. m.",formSmall:"TU PASE PERSONALIZADO",formTitle:"RESERVA TU CITA",formIntro:"Recibe un QR válido por 72 horas para presentar la promoción.",firstName:"Nombre",lastName:"Apellido",continue:"CONTINUAR",phone:"Teléfono",email:"Email",back:"ATRÁS",score:"Score estimado",choose:"Selecciona una opción",noHistory:"Sin historial de crédito",notSure:"No estoy seguro",consent:"Acepto ser contactado por Toyota of Hollywood y el equipo de Adriana Quintero sobre esta promoción. Mi pase QR no constituye aprobación de crédito ni reserva un vehículo.",submit:"CREAR MI PASE",legalSummary:"Ver términos importantes de la promoción",passKicker:"TU PASE PROMOCIONAL",passTitle:"PASE CREADO",passCopy:"Muéstralo al equipo de La Chiqui cuando llegues.",savePass:"GUARDAR MI QR",passNote:"Válido por 72 horas. No representa aprobación ni reserva de vehículo.",step:"Paso",of:"de",required:"Completa los campos requeridos para continuar.",sending:"CREANDO…",error:"No pudimos crear tu pase. Inténtalo nuevamente.",expired:"OFERTA FINALIZADA"
  },
  en: {
    draft:"DRAFT · DO NOT PUBLISH UNTIL FINAL TERMS ARE APPROVED",navCta:"BOOK MY APPOINTMENT",kicker:"JULY OFFER · LA CHIQUI TEAM",headline:"YOUR TACOMA.<br><span>YOUR MOMENT.</span>",heroCopy:"Request your appointment and receive a personalized QR pass, valid for 72 hours, to present this promotion to Adriana Quintero's team.",countdownLabel:"THE PROMOTION ENDS IN",days:"days",hours:"hours",minutes:"min",seconds:"sec",heroCta:"BOOK MY APPOINTMENT",heroNote:"This request does not reserve a vehicle or guarantee approval. Subject to inventory and qualification.",monthly:"MONTHLY PAYMENT",perMonth:"per month",due:"TOTAL DUE",atSigning:"at signing",leaseLine:"Lease offer: 36 monthly payments. For qualifying Tier 1+ customers.",vehicleDetail:"SR5 · 2026 · NEW · 0 MILES",stepsTitle:"HOW IT WORKS",step1Title:"Enter your information",step1Copy:"It takes less than one minute.",step2Title:"Save your QR pass",step2Copy:"It is created instantly and lasts 72 hours.",step3Title:"Confirm your appointment",step3Copy:"La Chiqui's team will contact you to coordinate your visit.",formKicker:"TOYOTA OF HOLLYWOOD × LA CHIQUI",formSideTitle:"REQUEST YOUR APPOINTMENT",formSideCopy:"Complete the form. If you qualify for the advertised terms, the team will help confirm availability and next steps.",hoursCopy:"Open daily · 8:30 a.m. – 12:00 a.m.",formSmall:"YOUR PERSONALIZED PASS",formTitle:"BOOK YOUR APPOINTMENT",formIntro:"Receive a QR pass valid for 72 hours to present the promotion.",firstName:"First name",lastName:"Last name",continue:"CONTINUE",phone:"Phone",email:"Email",back:"BACK",score:"Estimated credit score",choose:"Choose an option",noHistory:"No credit history",notSure:"I'm not sure",consent:"I agree to be contacted by Toyota of Hollywood and Adriana Quintero's team about this promotion. My QR pass is not a credit approval and does not reserve a vehicle.",submit:"CREATE MY PASS",legalSummary:"View important promotion terms",passKicker:"YOUR PROMOTIONAL PASS",passTitle:"PASS CREATED",passCopy:"Show it to La Chiqui's team when you arrive.",savePass:"SAVE MY QR",passNote:"Valid for 72 hours. This is not an approval or vehicle reservation.",step:"Step",of:"of",required:"Complete the required fields to continue.",sending:"CREATING…",error:"We could not create your pass. Please try again.",expired:"OFFER ENDED"
  }
};

let language = localStorage.getItem("toh-language") === "en" ? "en" : "es";
let step = 1;
let lastPass = null;
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
  const fields = [...document.querySelector(`.form-step[data-step="${step}"]`).querySelectorAll("input[required],select[required]")];
  const invalid = fields.find((field) => !field.checkValidity());
  if (invalid) {
    invalid.reportValidity();
    errorBox.textContent = translations[language].required;
    errorBox.classList.add("show");
    return false;
  }
  return true;
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
document.querySelectorAll(".next").forEach((button) => button.addEventListener("click", () => { if (currentStepIsValid()) { step = Math.min(3, step + 1); updateProgress(); } }));
document.querySelectorAll(".back").forEach((button) => button.addEventListener("click", () => { step = Math.max(1, step - 1); updateProgress(); }));

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
