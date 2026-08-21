import { FormEvent, useEffect, useState } from "react";
import { economicOsService, type EconomicOsData } from "../services/economicOs";

const money = (cents:number) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD" }).format(cents / 100);

export function EconomicOsPage() {
  const [data,setData] = useState<EconomicOsData | null>(null);
  const [tab,setTab] = useState("marketplace");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const load = () => economicOsService.get().then(setData).catch((e) => setMessage(e instanceof Error ? e.message : "No pudimos cargar el marketplace."));
  useEffect(() => { void load(); }, []);

  const submit = async (event:FormEvent<HTMLFormElement>, kind:"beat"|"service"|"job") => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      if (kind === "beat") await economicOsService.submitBeat(payload);
      if (kind === "service") await economicOsService.submitService(payload);
      if (kind === "job") await economicOsService.postJob(payload);
      event.currentTarget.reset();
      setMessage(kind === "beat" ? "Beat enviado a curaduría WESTDETRO." : kind === "service" ? "Servicio enviado a revisión." : "Trabajo publicado.");
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "No pudimos guardar."); }
    finally { setBusy(false); }
  };

  const tabs = [
    ["marketplace","Marketplace"],["submit","Subir beat"],["services","Servicios"],["jobs","Jobs"],["academy","NNE Academy"],["wallet","Seller Wallet"]
  ];

  return <>
    <article className="card" style={{marginBottom:18}}>
      <div className="eyebrow">NNE ECONOMIC OS</div>
      <h2>La economía del underground, dentro de una sola plataforma.</h2>
      <p>NNE Credits se ganan trabajando y se usan dentro del ecosistema. Las ventas reales de beats y servicios generan Seller Earnings separados.</p>
    </article>
    <div className="filter-strip" style={{marginBottom:18}}>{tabs.map(([id,label]) => <button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
    {message && <div className="form-error" style={{marginBottom:16}}>{message}</div>}

    {tab === "marketplace" && <>
      <div className="section-heading"><h2>Beats</h2><span>Curados por la comunidad + WESTDETRO Certified</span></div>
      <section className="reward-grid">
        {(data?.beats || []).map((beat) => <article className="card reward-card" key={beat.id}>
          <div className="eyebrow">{beat.westdetro_status === "certified" ? "WESTDETRO CERTIFIED" : `@${beat.username}`}</div>
          <h3>{beat.title}</h3><p>{beat.producer_name}{beat.bpm ? ` · ${beat.bpm} BPM` : ""}{beat.musical_key ? ` · ${beat.musical_key}` : ""}</p>
          {beat.preview_url && <audio controls controlsList="nodownload" src={beat.preview_url} style={{width:"100%"}} />}
          <footer><strong>{beat.lease_price_cents ? `${money(beat.lease_price_cents)} lease` : "Precio pendiente"}</strong><button disabled>Checkout en preparación</button></footer>
        </article>)}
      </section>
      {!data?.beats.length && <div className="empty-state">Todavía no hay beats publicados. Los beats enviados entran primero a curaduría.</div>}
    </>}

    {tab === "submit" && <form className="card" style={{display:"grid",gap:12}} onSubmit={(e)=>void submit(e,"beat")}>
      <div className="eyebrow">Producer Portal</div><h2>Sube tu beat.</h2>
      <p>Lo revisamos. Si encaja con el universo, puede recibir el badge WESTDETRO Certified y publicarse en la comunidad.</p>
      <input className="field" name="title" required placeholder="Nombre del beat" />
      <input className="field" name="producer_name" placeholder="Producer name" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><input className="field" name="bpm" type="number" placeholder="BPM" /><input className="field" name="musical_key" placeholder="Key / escala" /></div>
      <input className="field" name="tags" placeholder="Tags: west coast, detroit, dark..." />
      <input className="field" name="preview_url" required placeholder="URL privada/preview del beat" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><input className="field" name="lease_price_usd" required type="number" min="1" step="0.01" placeholder="Lease USD" /><input className="field" name="exclusive_price_usd" type="number" min="1" step="0.01" placeholder="Exclusive USD (opcional)" /></div>
      <button className="primary-button" disabled={busy}>{busy?"Enviando…":"Enviar a curaduría"}</button>
      {!!data?.mine.beats.length && <small>Tus envíos: {data.mine.beats.map((b)=>`${b.title} · ${b.westdetro_status}`).join(" | ")}</small>}
    </form>}

    {tab === "services" && <>
      <form className="card" style={{display:"grid",gap:12,marginBottom:18}} onSubmit={(e)=>void submit(e,"service")}>
        <div className="eyebrow">Vende tu talento</div><h2>Publica un servicio.</h2>
        <input className="field" name="title" required placeholder="Ej: Mix & Master profesional" />
        <select className="field" name="category" defaultValue="mix_master"><option value="mix_master">Mix / Master</option><option value="production">Producción</option><option value="design">Diseño</option><option value="video">Video</option><option value="songwriting">Songwriting</option><option value="content">Contenido</option><option value="marketing">Marketing</option><option value="other">Otro</option></select>
        <textarea className="field" name="description" required placeholder="Qué incluye" />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><input className="field" name="price_usd" type="number" min="1" step="0.01" required placeholder="Precio USD" /><input className="field" name="delivery_days" type="number" min="1" defaultValue="7" /><input className="field" name="revisions" type="number" min="0" defaultValue="1" /></div>
        <button className="primary-button" disabled={busy}>Enviar servicio</button>
      </form>
      <section className="reward-grid">{(data?.services||[]).map((s)=><article className="card reward-card" key={s.id}><div className="eyebrow">@{s.username} · {s.category}</div><h3>{s.title}</h3><p>{s.description}</p><footer><strong>{money(s.price_cents)}</strong><button disabled>Contratar</button></footer></article>)}</section>
    </>}

    {tab === "jobs" && <>
      <form className="card" style={{display:"grid",gap:12,marginBottom:18}} onSubmit={(e)=>void submit(e,"job")}><div className="eyebrow">NNE JOB BOARD</div><h2>Necesito a alguien para…</h2><input className="field" name="title" required placeholder="Ej: editor para 3 Reels"/><input className="field" name="category" required placeholder="Categoría"/><textarea className="field" name="description" required placeholder="Describe el trabajo"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><select className="field" name="budget_type"><option value="usd">USD</option><option value="nne">NNE Credits</option><option value="mixed">Mixto</option></select><input className="field" name="budget_amount" type="number" min="0.25" step="0.25" required placeholder="Presupuesto"/></div><button className="primary-button" disabled={busy}>Publicar trabajo</button></form>
      <section className="reward-grid">{(data?.jobs||[]).map((j)=><article className="card reward-card" key={j.id}><div className="eyebrow">@{j.username} · {j.category}</div><h3>{j.title}</h3><p>{j.description}</p><footer><strong>{j.budget_type === "usd" ? money(j.budget_amount) : `${j.budget_amount/100} ${j.budget_type.toUpperCase()}`}</strong><button disabled>Aplicar</button></footer></article>)}</section>
    </>}

    {tab === "academy" && <><article className="card" style={{marginBottom:18}}><div className="eyebrow">NNE ACADEMY</div><h2>Herramientas que no compras con dinero.</h2><p>Sample packs, drum kits, proyectos, vocal chains, plugins, data y cursos. Aquí se paga únicamente con NNE Credits ganados trabajando.</p></article><section className="reward-grid">{(data?.academy||[]).map((a)=><article className="card reward-card" key={a.id}><div className="eyebrow">{a.category}</div><h3>{a.title}</h3><p>{a.description}</p><footer><strong>{a.cost_credits} NNE</strong><button disabled>Canjear</button></footer></article>)}</section>{!data?.academy.length&&<div className="empty-state">Academy lista para recibir el primer drop.</div>}</>}

    {tab === "wallet" && <section className="hero-grid"><article className="card balance-card"><div className="eyebrow">Seller Earnings disponibles</div><div className="balance">{money(data?.wallet.available_cents||0)}<span>dinero generado por ventas</span></div><p>Este balance está separado de NNE Credits y sí es elegible para cashout cuando habilitemos payouts.</p></article><article className="card"><div className="eyebrow">Cashback</div><h2>{data?.economics.event_cashback_percent || 20}% en eventos elegibles</h2><p>Una compra real elegible devuelve valor en NNE Credits. Los Credits siguen siendo de uso interno y no se compran con dinero.</p></article></section>}
  </>;
}
