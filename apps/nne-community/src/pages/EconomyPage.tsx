import { FormEvent, useEffect, useState } from "react";
import { apiRequest, formatNne } from "../services/api";

type EconomyData = {
  seller_balance_cents: number;
  nne_credits: number;
  beats: Array<{id:string;title:string;bpm:number|null;musical_key:string|null;lease_price_cents:number|null;exclusive_price_cents:number|null;westdetro_certified:number;username:string}>;
  services: Array<{id:string;category:string;title:string;description:string;price_cents:number;turnaround_days:number|null;username:string}>;
  academy: Array<{id:string;title:string;description:string;category:string;cost_nne:number}>;
  jobs: Array<{id:string;title:string;description:string;category:string;compensation_type:string;budget_cents:number|null;budget_nne:number|null;username:string}>;
};

const usd = (cents: number | null | undefined) => cents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function EconomyPage() {
  const [data, setData] = useState<EconomyData | null>(null);
  const [tab, setTab] = useState("beats");
  const [message, setMessage] = useState("");
  const load = () => apiRequest<EconomyData>("/economy/overview").then(setData);
  useEffect(() => { void load(); }, []);

  const submitBeat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiRequest("/economy/beats", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) });
    event.currentTarget.reset();
    setMessage("Beat enviado a revisión WESTDETRO.");
    await load();
  };

  const submitService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiRequest("/economy/services", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) });
    event.currentTarget.reset();
    setMessage("Servicio publicado.");
    await load();
  };

  const submitJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiRequest("/economy/jobs", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) });
    event.currentTarget.reset();
    setMessage("Trabajo publicado.");
    await load();
  };

  if (!data) return <div className="empty-state">Cargando economía NNE…</div>;

  const tabs = [
    ["beats","Beats"], ["services","Servicios"], ["academy","Academy"], ["jobs","Jobs"], ["wallet","Seller Wallet"]
  ];

  return <>
    <article className="card" style={{ marginBottom: 18 }}>
      <div className="eyebrow">NNE ECONOMIC OS</div>
      <h2>Trabaja con NNE. Vende tu talento en dinero real.</h2>
      <p>NNE Credits no se compran ni hacen cashout. Los ingresos por ventas reales de beats y servicios viven en un balance separado para vendedores.</p>
      <div className="referral-benefits"><span>{formatNne(data.nne_credits)} NNE disponibles</span><span>{usd(data.seller_balance_cents)} Seller Balance</span></div>
    </article>
    {message && <div className="form-success" style={{ marginBottom: 14 }}>{message}</div>}
    <div className="filter-strip" style={{ marginBottom: 18 }}>{tabs.map(([id,label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>

    {tab === "beats" && <>
      <article className="card" style={{ marginBottom: 18 }}><div className="eyebrow">Productores</div><h2>Sube tu beat.</h2><p>Todos los beats pasan por revisión. Los seleccionados reciben WESTDETRO Certified y pueden entrar al catálogo curado.</p>
        <form className="form-grid" onSubmit={(e) => void submitBeat(e)}>
          <input className="field" name="title" placeholder="Título del beat" required />
          <input className="field" name="bpm" type="number" min="40" max="260" placeholder="BPM" />
          <input className="field" name="musical_key" placeholder="Tonalidad · ej. F# minor" />
          <input className="field" name="tags" placeholder="Tags · detroit, west coast, dark…" />
          <input className="field" name="preview_url" placeholder="URL privada/pública del preview" />
          <input className="field" name="lease_price_usd" type="number" min="1" step="0.01" placeholder="Lease USD" />
          <input className="field" name="exclusive_price_usd" type="number" min="1" step="0.01" placeholder="Exclusive USD" />
          <button className="primary-button" type="submit">Enviar a revisión</button>
        </form>
      </article>
      <section className="reward-grid">{data.beats.map(beat => <article className="card reward-card" key={beat.id}><div className="eyebrow">{beat.westdetro_certified ? "WESTDETRO CERTIFIED" : "Marketplace"}</div><h3>{beat.title}</h3><p>@{beat.username}{beat.bpm ? ` · ${beat.bpm} BPM` : ""}{beat.musical_key ? ` · ${beat.musical_key}` : ""}</p><footer><strong>{beat.lease_price_cents ? `${usd(beat.lease_price_cents)} lease` : usd(beat.exclusive_price_cents)}</strong></footer></article>)}</section>
    </>}

    {tab === "services" && <>
      <article className="card" style={{ marginBottom: 18 }}><div className="eyebrow">Marketplace de talento</div><h2>Vende un servicio.</h2>
        <form className="form-grid" onSubmit={(e) => void submitService(e)}>
          <select className="field" name="category"><option value="production">Producción</option><option value="mix_master">Mix / Master</option><option value="design">Diseño</option><option value="video">Video</option><option value="songwriting">Songwriting</option><option value="marketing">Marketing</option><option value="other">Otro</option></select>
          <input className="field" name="title" placeholder="Nombre del servicio" required />
          <textarea className="field" name="description" placeholder="Qué entregas" required />
          <input className="field" name="price_usd" type="number" min="1" step="0.01" placeholder="Precio USD" required />
          <input className="field" name="turnaround_days" type="number" min="1" max="90" placeholder="Días de entrega" />
          <button className="primary-button" type="submit">Publicar servicio</button>
        </form>
      </article>
      <section className="reward-grid">{data.services.map(service => <article className="card reward-card" key={service.id}><div className="eyebrow">{service.category}</div><h3>{service.title}</h3><p>{service.description}</p><small>@{service.username}</small><footer><strong>{usd(service.price_cents)}</strong></footer></article>)}</section>
    </>}

    {tab === "academy" && <section className="reward-grid">{data.academy.map(item => <article className="card reward-card" key={item.id}><div className="eyebrow">NNE ACADEMY · {item.category}</div><h3>{item.title}</h3><p>{item.description}</p><footer><strong>{formatNne(item.cost_nne)} NNE</strong><button disabled={data.nne_credits < item.cost_nne}> {data.nne_credits < item.cost_nne ? "Farmea más NNE" : "Canjear"}</button></footer></article>)}</section>}

    {tab === "jobs" && <>
      <article className="card" style={{ marginBottom: 18 }}><div className="eyebrow">NNE JOB BOARD</div><h2>Publica una oportunidad.</h2>
        <form className="form-grid" onSubmit={(e) => void submitJob(e)}>
          <input className="field" name="title" placeholder="Qué necesitas" required />
          <input className="field" name="category" placeholder="Categoría · video, diseño, producción…" required />
          <textarea className="field" name="description" placeholder="Brief" required />
          <select className="field" name="compensation_type"><option value="usd">USD</option><option value="nne">NNE</option><option value="mixed">USD + NNE</option></select>
          <input className="field" name="budget_usd" type="number" min="0" step="0.01" placeholder="Presupuesto USD" />
          <input className="field" name="budget_nne" type="number" min="0" step="0.25" placeholder="Presupuesto NNE" />
          <button className="primary-button" type="submit">Publicar trabajo</button>
        </form>
      </article>
      <section className="reward-grid">{data.jobs.map(job => <article className="card reward-card" key={job.id}><div className="eyebrow">{job.category}</div><h3>{job.title}</h3><p>{job.description}</p><small>@{job.username}</small><footer><strong>{job.budget_cents ? usd(job.budget_cents) : ""}{job.budget_cents && job.budget_nne ? " + " : ""}{job.budget_nne ? `${formatNne(job.budget_nne)} NNE` : ""}</strong></footer></article>)}</section>
    </>}

    {tab === "wallet" && <article className="card"><div className="eyebrow">SELLER WALLET</div><h2>{usd(data.seller_balance_cents)}</h2><p>Este balance representa únicamente ingresos por ventas reales. No mezcla NNE Credits. Cashout se habilita cuando Stripe Connect/payouts quede conectado al vendedor.</p><button className="primary-button" disabled>Configurar payout · próximamente</button></article>}
  </>;
}
