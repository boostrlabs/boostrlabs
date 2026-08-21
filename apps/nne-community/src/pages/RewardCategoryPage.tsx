import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import type { AppOutletContext } from "../components/AppLayout";
import { VisualMedia } from "../components/VisualMedia";
import { rewardAssets } from "../config/assets";
import { formatNne } from "../services/api";
import { rewardsService } from "../services/rewards";
import type { Reward } from "../types";

const categories = {
  beats: {
    label: "Beats",
    description: "Beats disponibles exclusivamente dentro de NNE.",
    test: (reward: Reward) => reward.id.includes("beat")
  },
  gear: {
    label: "Equipos",
    description: "Micrófonos, interfaces, cables y herramientas para crear.",
    test: (reward: Reward) => ["s1_reward_focusrite_solo_3rd", "s1_reward_at2020", "s1_reward_xlr_cable"].includes(reward.id)
  },
  ropa: {
    label: "Ropa & Lifestyle",
    description: "Ropa, sneakers y artículos físicos del catálogo.",
    test: (reward: Reward) => ["s1_reward_shirt", "s1_reward_af1_white", "s1_reward_af1_black", "s1_reward_nike_tech"].includes(reward.id)
  },
  servicios: {
    label: "Servicios",
    description: "Producción, feedback y servicios creativos.",
    test: (reward: Reward) => ["s1_reward_creator_review", "s1_reward_production"].includes(reward.id)
  },
  acceso: {
    label: "Acceso",
    description: "Experiencias digitales, contenido exclusivo y acceso anticipado.",
    test: (reward: Reward) => reward.id === "s1_reward_early" || reward.rewardType === "digital"
  }
} as const;

type CategoryKey = keyof typeof categories;

export function RewardCategoryPage() {
  const { dashboard, refreshDashboard, showToast } = useOutletContext<AppOutletContext>();
  const params = useParams();
  const key = (params.category || "beats") as CategoryKey;
  const category = categories[key] || categories.beats;
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [busyId, setBusyId] = useState("");

  const load = () => rewardsService.list().then((result) => setRewards(result.rewards.filter(category.test)));
  useEffect(() => { void load(); }, [key]);

  const redeem = async (reward: Reward) => {
    setBusyId(reward.id);
    try {
      await rewardsService.redeem(reward.id);
      await Promise.all([load(), refreshDashboard()]);
      showToast(`${reward.name} solicitado.`);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "No pudimos completar el canje.");
    } finally { setBusyId(""); }
  };

  return (
    <>
      <article className="card" style={{ marginBottom: 18 }}>
        <div className="eyebrow">Catálogo NNE · {category.label}</div>
        <h2>{category.label}</h2>
        <p>{category.description}</p>
        {key === "beats" && <small>Los previews se escucharán dentro de NNE. El acceso final se entrega únicamente después del canje y bajo los términos de la licencia.</small>}
      </article>

      <div className="filter-strip" aria-label="Categorías del catálogo" style={{ marginBottom: 18 }}>
        <Link className="text-button" to="/rewards">Todo</Link>
        {(Object.keys(categories) as CategoryKey[]).map((categoryKey) => (
          <Link key={categoryKey} className={categoryKey === key ? "active" : ""} to={`/rewards/${categoryKey}`}>
            {categories[categoryKey].label}
          </Link>
        ))}
      </div>

      <div className="section-heading"><h2>{category.label}</h2><span className="balance-pill">{formatNne(dashboard.user.credits)} Credits</span></div>
      <section className="reward-grid">
        {rewards.map((reward) => {
          const levelLocked = dashboard.user.level < reward.minimumLevel;
          const creditLocked = dashboard.user.credits < reward.costCredits;
          const locked = levelLocked || creditLocked || reward.remaining === 0;
          const assets = rewardAssets(reward.id, reward.imageUrl);
          return <article className={`card reward-card ${locked ? "locked" : ""}`} key={reward.id}>
            <div className={`reward-visuals ${assets.length > 1 ? "has-variants" : ""}`}>
              {(assets.length ? assets : [null]).map((asset, index) => (
                <VisualMedia className="reward-art" src={asset} alt={`${reward.name}${assets.length > 1 ? index === 0 ? " gris" : " negro" : ""}`} fallback={reward.icon} key={asset || "fallback"} />
              ))}
            </div>
            <h3>{reward.name}</h3><p>{reward.description}</p>
            <footer><strong className="reward-price">{formatNne(reward.costCredits)} Credits</strong><button disabled={locked || busyId === reward.id} onClick={() => void redeem(reward)}>{levelLocked ? `Nivel ${reward.minimumLevel}` : creditLocked ? "Sin balance" : busyId === reward.id ? "Procesando…" : "Canjear"}</button></footer>
          </article>;
        })}
      </section>
      {!rewards.length && <div className="empty-state">Todavía no hay artículos publicados en esta categoría.</div>}
    </>
  );
}
