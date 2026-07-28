(() => {
  const copy = {
    es: {
      eyebrow:"OFERTA ESPECIAL DE TIKTOK",yourToyota:"TU TOYOTA",pricePass:"PASE DE PRECIO",monthlyFrom:"PAGO MENSUAL DESDE",downLabel:"ENTRADA DESDE",qualified:"PARA CLIENTES QUE CALIFIQUEN",freezeTitle:"CONGELA TU PRECIO POR 72 HORAS",freezeCopy:"Genera tu pase y preséntalo al equipo de La Chiqui antes de que expire",formTitle:"RESERVA TU PRECIO",formSubtitle:"Recibe tu pase QR de $499 válido por 72 horas",firstName:"Nombre",lastName:"Apellido",contactHelper:"Completa por lo menos uno: teléfono o email",phone:"Teléfono",or:"O",score:"Score de crédito aproximado",select:"Selecciona",under640:"Menos de 640",unknown:"No lo sé",consent:"Acepto que Toyota of Hollywood y el equipo de La Chiqui me contacten sobre esta solicitud por llamada, mensaje de texto o email. El consentimiento no es condición de compra",back:"ATRÁS",continue:"CONTINUAR",submit:"GENERAR MI PASE",howTitle:"TU PRECIO EN 3 PASOS",how1:"Completa tus datos",how2:"Recibe tu QR al instante",how3:"Visita al equipo de La Chiqui en 72 horas",termsTitle:"Términos importantes de la promoción",terms:"Pago estimado desde $499 al mes por 72 meses con $1,000 de entrada, basado en precio promocional de vehículo elegible y financiamiento para clientes con crédito aprobado. Impuestos, título, registro, productos, opciones y cargos del dealer no incluidos. El pago real puede variar según vehículo, precio final, historial de crédito y aprobación. Sujeto a inventario y aprobación final. No todos califican. El pase identifica una solicitud promocional y no constituye aprobación, contrato ni reserva de vehículo. Los términos pueden cambiar sin previo aviso. Consulte al dealer para detalles finales por escrito",congrats:"¡FELICIDADES!",passCreated:"CONGELASTE TU PAGO",perMonth:"AL MES",passInstructions:"Muestra este QR al equipo de La Chiqui cuando llegues",expiresIn:"TU PASE EXPIRA EN",save:"GUARDAR MI QR",passNote:"Válido por 72 horas · sujeto a aprobación e inventario",step:"Paso {n} de 3",required:"Completa los campos requeridos",contact:"Ingresa un teléfono o un email válido",consentError:"Debes aceptar el consentimiento para continuar",failed:"No pudimos crear tu pase · inténtalo nuevamente",sending:"CREANDO TU PASE..."
    },
    en: {
      eyebrow:"SPECIAL TIKTOK OFFER",yourToyota:"YOUR TOYOTA",pricePass:"PRICE PASS",monthlyFrom:"MONTHLY PAYMENT FROM",downLabel:"DOWN PAYMENT FROM",qualified:"FOR QUALIFIED CUSTOMERS",freezeTitle:"LOCK YOUR PRICE FOR 72 HOURS",freezeCopy:"Generate your pass and show it to La Chiqui's team before it expires",formTitle:"LOCK YOUR PRICE",formSubtitle:"Get your $499 QR price pass, valid for 72 hours",firstName:"First name",lastName:"Last name",contactHelper:"Complete at least one: phone or email",phone:"Phone",or:"OR",score:"Approximate credit score",select:"Select",under640:"Under 640",unknown:"I don't know",consent:"I agree that Toyota of Hollywood and La Chiqui's team may contact me about this request by call, text or email. Consent is not a condition of purchase",back:"BACK",continue:"CONTINUE",submit:"GENERATE MY PASS",howTitle:"YOUR PRICE IN 3 STEPS",how1:"Complete your information",how2:"Get your QR instantly",how3:"Visit La Chiqui's team within 72 hours",termsTitle:"Important offer terms",terms:"Estimated payment from $499 per month for 72 months with $1,000 down, based on promotional pricing for an eligible vehicle and financing for approved-credit customers. Taxes, title, registration, products, options and dealer charges are not included. Actual payment may vary by vehicle, final price, credit history and approval. Subject to inventory and final approval. Not all applicants qualify. The pass identifies a promotional request and is not an approval, contract or vehicle reservation. Terms may change without notice. See dealer for final written details",congrats:"CONGRATULATIONS!",passCreated:"YOU LOCKED YOUR PAYMENT",perMonth:"PER MONTH",passInstructions:"Show this QR to La Chiqui's team when you arrive",expiresIn:"YOUR PASS EXPIRES IN",save:"SAVE MY QR",passNote:"Valid for 72 hours · subject to approval and inventory",step:"Step {n} of 3",required:"Complete the required fields",contact:"Enter a valid phone number or email",consentError:"You must accept the consent to continue",failed:"We couldn't create your pass · please try again",sending:"CREATING YOUR PASS..."
    }
  };
  copy.es.offerTerms = "$1,000 DE ENTRADA · 72 MESES · 6.99% APR ESTIMADO";
  copy.en.offerTerms = "$1,000 DOWN · 72 MONTHS · 6.99% ESTIMATED APR";
  let lang = "es";
  let step = 1;
  let timer;
  const form = document.querySelector("#lead-form");
  const error = document.querySelector("#form-error");
  const next = document.querySelector("#next-button");
  const back = document.querySelector("#back-button");
  const submit = document.querySelector("#submit-button");

  const t = key => copy[lang][key] || key;
  const setLanguage = value => {
    lang = value;
    document.documentElement.lang = value;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const value = copy[lang][el.dataset.i18n];
      if (value) el.textContent = value;
    });
    document.querySelectorAll(".lang").forEach(button => button.classList.toggle("active", button.dataset.lang === lang));
    showStep();
  };
  const showError = message => { error.textContent = message; error.hidden = false; };
  const clearError = () => { error.hidden = true; error.textContent = ""; };
  const showStep = () => {
    document.querySelectorAll(".form-step").forEach(el => el.classList.toggle("active", Number(el.dataset.step) === step));
    document.querySelector("#step-label").textContent = t("step").replace("{n}", step);
    document.querySelector("#progress-label").textContent = `${Math.round(step / 3 * 100)}%`;
    document.querySelector("#progress-bar").style.width = `${step / 3 * 100}%`;
    back.hidden = step === 1;
    next.hidden = step === 3;
    submit.hidden = step !== 3;
    clearError();
  };
  const validStep = () => {
    if (step === 1) {
      const first = form.elements.first_name.value.trim();
      const last = form.elements.last_name.value.trim();
      if (!first || !last) { showError(t("required")); return false; }
    }
    if (step === 2) {
      const phone = form.elements.phone.value.replace(/\D/g, "");
      const email = form.elements.email.value.trim();
      const emailOkay = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!(phone.length >= 10 || emailOkay)) { showError(t("contact")); return false; }
    }
    return true;
  };
  const advance = () => { if (validStep()) { step = Math.min(3, step + 1); showStep(); document.querySelector(".form-card").scrollIntoView({behavior:"smooth",block:"start"}); } };
  next.addEventListener("click", advance);
  back.addEventListener("click", () => { step = Math.max(1, step - 1); showStep(); });
  form.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") return;
    event.preventDefault();
    if (step < 3) advance();
  });
  document.querySelectorAll(".lang").forEach(button => button.addEventListener("click", () => setLanguage(button.dataset.lang)));

  const utms = () => {
    const q = new URLSearchParams(location.search);
    return {source:q.get("source") || "tiktok-camry-499",utm_source:q.get("utm_source") || "tiktok",utm_medium:q.get("utm_medium") || "paid_social",utm_campaign:q.get("utm_campaign") || "camry-499",utm_content:q.get("utm_content") || "",utm_term:q.get("utm_term") || ""};
  };
  const startCountdown = expiresAt => {
    clearInterval(timer);
    const paint = () => {
      const remaining = Math.max(0, Date.parse(expiresAt) - Date.now());
      const total = Math.floor(remaining / 1000);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor(total % 3600 / 60);
      const seconds = total % 60;
      document.querySelector("#pass-countdown").textContent = [hours,minutes,seconds].map(v => String(v).padStart(2,"0")).join(":");
    };
    paint(); timer = setInterval(paint, 1000);
  };
  const showPass = data => {
    const modal = document.querySelector("#pass-modal");
    const qr = document.querySelector("#qr-code");
    qr.src = data.qrImageUrl;
    document.querySelector("#pass-code").textContent = data.code;
    document.body.style.overflow = "hidden";
    modal.hidden = false;
    startCountdown(data.expiresAt);
    window.dataLayer?.push({event:"generate_lead",campaign:"camry_499_tiktok"});
  };
  form.addEventListener("submit", async event => {
    event.preventDefault(); clearError();
    if (!form.elements.score.value) { showError(t("required")); return; }
    if (!form.elements.consent.checked) { showError(t("consentError")); return; }
    submit.disabled = true; submit.textContent = t("sending");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.consent = form.elements.consent.checked;
    payload.page_url = location.href;
    Object.assign(payload, utms());
    try {
      const response = await fetch("/api/toyota/camry-lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "request_failed");
      showPass(data);
    } catch { showError(t("failed")); }
    finally { submit.disabled = false; submit.textContent = t("submit"); }
  });
  document.querySelector("#close-modal").addEventListener("click", () => { document.querySelector("#pass-modal").hidden = true; document.body.style.overflow = ""; clearInterval(timer); });
  document.querySelector(".modal-backdrop").addEventListener("click", () => document.querySelector("#close-modal").click());
  document.querySelector("#save-qr").addEventListener("click", async () => {
    const source = document.querySelector("#qr-code").src;
    if (!source) return;
    const response = await fetch(source);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${document.querySelector("#pass-code").textContent || "camry-price-pass"}.svg`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  setLanguage("es");
})();
