import { useEffect, useMemo, useState } from "react";
import type { Quest } from "../types";

interface QuestModalProps {
  quest: Quest | null;
  onClose: () => void;
  onSubmitEvidence: (questId: string) => void;
  onPassTrivia: (questId: string) => void;
}

export function QuestModal({
  quest,
  onClose,
  onSubmitEvidence,
  onPassTrivia
}: QuestModalProps) {
  const [phase, setPhase] = useState<"intro" | "timer" | "trivia" | "result">("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!quest) return;
    setPhase("intro");
    setAnswers({});
    setScore(0);
    setSecondsLeft(quest.minimumListenSeconds ?? 0);
  }, [quest]);

  useEffect(() => {
    if (phase !== "timer" || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft]);

  useEffect(() => {
    if (phase === "timer" && secondsLeft === 0) {
      setPhase("trivia");
    }
  }, [phase, secondsLeft]);

  const isListeningQuest = quest?.type === "listening-trivia";

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  if (!quest) return null;

  function startListeningQuest() {
    if (!quest) return;
    if (quest.songUrl) {
      window.open(quest.songUrl, "_blank", "noopener,noreferrer");
    }
    setPhase("timer");
  }

  function submitTrivia() {
    if (!quest) return;
    const questions = quest.trivia ?? [];
    const correct = questions.reduce((count, question) => {
      return answers[question.id] === question.correctOptionIndex ? count + 1 : count;
    }, 0);
    const percentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    setScore(percentage);
    setPhase("result");

    if (percentage >= (quest.passPercentage ?? 75)) {
      onPassTrivia(quest.id);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <div className="eyebrow">Quest</div>
            <h2>{quest.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>×</button>
        </header>

        {!isListeningQuest && (
          <>
            <p>{quest.description}</p>
            <label className="upload-zone">
              <strong>Subir screenshot</strong>
              <span>PNG, JPG o WEBP · máximo 10 MB</span>
              <input type="file" accept="image/*" />
            </label>
            <button
              className="primary-button full"
              onClick={() => onSubmitEvidence(quest.id)}
            >
              Enviar evidencia
            </button>
          </>
        )}

        {isListeningQuest && phase === "intro" && (
          <>
            <p>{quest.description}</p>
            <div className="quest-rules">
              <div><span>01</span> Abre la canción desde el enlace oficial.</div>
              <div><span>02</span> Espera el tiempo mínimo antes de responder.</div>
              <div><span>03</span> Supera la trivia con {quest.passPercentage}% o más.</div>
            </div>
            <button className="primary-button full" onClick={startListeningQuest}>
              Abrir canción y comenzar
            </button>
          </>
        )}

        {isListeningQuest && phase === "timer" && (
          <div className="listening-timer">
            <div className="eyebrow">Listening mode</div>
            <strong>{secondsLeft}s</strong>
            <p>La trivia se desbloqueará cuando termine el contador.</p>
          </div>
        )}

        {isListeningQuest && phase === "trivia" && (
          <>
            <div className="quiz-progress">
              {answeredCount} / {quest.trivia?.length ?? 0} respondidas
            </div>

            <div className="quiz-list">
              {quest.trivia?.map((question, questionIndex) => (
                <article className="quiz-question" key={question.id}>
                  <strong>{questionIndex + 1}. {question.prompt}</strong>
                  <div className="quiz-options">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={option}
                        className={
                          answers[question.id] === optionIndex
                            ? "quiz-option selected"
                            : "quiz-option"
                        }
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: optionIndex
                          }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <button
              className="primary-button full"
              disabled={answeredCount !== (quest.trivia?.length ?? 0)}
              onClick={submitTrivia}
            >
              Enviar respuestas
            </button>
          </>
        )}

        {isListeningQuest && phase === "result" && (
          <div className="quiz-result">
            <div className="eyebrow">Resultado</div>
            <strong>{score}%</strong>
            <h3>
              {score >= (quest.passPercentage ?? 75)
                ? "Quest completada."
                : "Todavía no."}
            </h3>
            <p>
              {score >= (quest.passPercentage ?? 75)
                ? `Ganaste ${quest.rewardCredits} NNE Credits.`
                : "Escucha nuevamente y vuelve a intentarlo más tarde."}
            </p>
            <button className="primary-button full" onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
