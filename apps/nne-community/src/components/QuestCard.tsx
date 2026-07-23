import type { Quest } from "../types";

interface QuestCardProps {
  quest: Quest;
  onOpen: (quest: Quest) => void;
}

export function QuestCard({ quest, onOpen }: QuestCardProps) {
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
          <div className="quest-icon">{quest.icon}</div>
          <div className="tag">{quest.platform}</div>
        </div>
        <h3>{quest.title}</h3>
        <p>{quest.description}</p>
      </div>

      <footer>
        <strong>+{quest.rewardCredits} Credits</strong>
        <button
          className={`primary-button ${quest.status}`}
          disabled={quest.status === "completed" || quest.status === "pending"}
          onClick={() => onOpen(quest)}
        >
          {label}
        </button>
      </footer>
    </article>
  );
}
