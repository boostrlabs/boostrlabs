import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

type BeatRow = { id:string; title:string; bpm:number|null; musical_key:string|null; tags:string|null; preview_url:string|null; lease_price_cents:number|null; exclusive_price_cents:number|null; status:string; westdetro_certified:number; review_note:string|null; username:string };
type AdminEconomyData = { beats:BeatRow[]; services:Array<Record<string,unknown>>; jobs:Array<Record<string,unknown>> };

const usd = (cents:number|null) => cents == null ? "—" : new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);

export function AdminEconomyPage() {
  const [data,setData] = useState<AdminEconomyData>({beats:[],services:[],jobs:[]});
  const [message,setMessage] = useState("");
  const load = () => apiRequest<AdminEconomyData>("/admin/economy").then(setData).catch((e)=>setMessage(e instanceof Error?e.message:"No pudimos cargar curaduría."));
  useEffect(()=>{ void load(); },[]);

  const review = async (beatId:string, action:string) => {
    setMessage("");
    try {
      await apiRequest("/admin/economy",{method:"POST",body:JSON.stringify({beat_id:beatId,action})});
      setMessage(action === "certify_publish" ? "Beat certificado y publicado." : action === "publish" ? "Beat publicado en marketplace." : action === "reject" ? "Beat rechazado." : "Beat marcado en revisión.");
      await load();
    } catch(e) { setMessage(e instanceof Error?e.message:"No pudimos actualizar el beat."); }
  };

  return <>
    <article className="card" style={{marginBottom:18}}><div className="eyebrow">WESTDETRO CURATION</div><h2>Marketplace de beats.</h2><p>Revisa submissions, publica beats generales o marca los que realmente pertenecen al universo como WESTDETRO Certified.</p></article>
    {message && <div className="form-success" style={{marginBottom:14}}>{message}</div>}
    <section style={{display:"grid",gap:14}}>
      {data.beats.map((beat)=><article className="card" key={beat.id} style={{display:"grid",gap:10}}>
        <div><div className="eyebrow">@{beat.username} · {beat.status}{beat.westdetro_certified?" · WESTDETRO CERTIFIED":""}</div><h3>{beat.title}</h3><p>{beat.bpm?`${beat.bpm} BPM · `:""}{beat.musical_key||"Key pendiente"}{beat.tags?` · ${beat.tags}`:""}</p></div>
        {beat.preview_url && <audio controls controlsList="nodownload" src={beat.preview_url} style={{width:"100%"}} />}
        <div className="referral-benefits"><span>Lease: {usd(beat.lease_price_cents)}</span><span>Exclusive: {usd(beat.exclusive_price_cents)}</span></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="primary-button" onClick={()=>void review(beat.id,"certify_publish")}>WESTDETRO Certified + publicar</button>
          <button className="text-button" onClick={()=>void review(beat.id,"publish")}>Publicar sin badge</button>
          <button className="text-button" onClick={()=>void review(beat.id,"reviewing")}>En revisión</button>
          <button className="text-button" onClick={()=>void review(beat.id,"reject")}>Rechazar</button>
        </div>
      </article>)}
      {!data.beats.length && <div className="empty-state">No hay beats enviados todavía.</div>}
    </section>
  </>;
}
