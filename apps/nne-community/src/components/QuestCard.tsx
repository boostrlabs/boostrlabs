import { Link } from "react-router-dom";
import type { Quest } from "../types";
import { formatNne } from "../services/api";
import { VisualMedia } from "./VisualMedia";
import { questArtwork } from "../config/assets";

interface QuestCardProps {
  quest: Quest;
  onOpen: (quest: Quest) => void;
}

export function QuestCard({ quest, onOpen }: QuestCardProps) {
  const artwork = questArtwork(quest.title, quest.song?.title, quest.song?.artworkUrl);
  const label =
    quest.status === "completed"
      ? "Completada"
      : quest.status === "pending"
        ? "En revisión"
        : "Empezar";

  return (
    <article className="card quest-card">
      <div>
        <div className="quest-header">
          {artwork ? (
            <VisualMedia className="quest-art" src={artwork} alt={`Arte de ${quest.song?.title || quest.title}`} fallback={quest.icon} />
          ) : (
            <div className="quest-icon">{quest.icon}</div>
          )}
          <div className="tag">{quest.platform}</div>
        </div>
        <h3>{quest.title}</h3>
        <p>{quest.description}</p>
      </div>

      <footer>
        <strong>+{formatNne(quest.rewardCredits)} NNE</strong>
        <div>
          <Link className="text-button" to={`/chamba/${encodeURIComponent(quest.id)}`}>Smart link</Link>
          <button
            className={`primary-button ${quest.status}`}
            disabled={quest.status === "completed" || quest.status === "pending"}
            onClick={() => onOpen(quest)}
          >
            {label}
          </button>
        </div>
      </footer>
    </article>
  );
}
