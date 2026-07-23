import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../services/api";
import { questsService } from "../services/quests";
import { triviaService } from "../services/trivia";
import type { Quest, TriviaQuestion } from "../types";

interface QuestModalProps {
  quest: Quest | null;
  referralCode: string | null;
  onClose: () => void;
  onChanged: (message: string) => Promise<void>;
}

type Phase = "intro" | "timer" | "trivia" | "result";

export function QuestModal({ quest, referralCode, onClose, onChanged }: QuestModalProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unlockAt, setUnlockAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhase("intro");
    setFile(null);
    setNote("");
    setSessionId(null);
    setUnlockAt(null);
    setQuestions([]);
    setAnswers({});
    setScore(0);
    setPassed(false);
    setError("");
  }, [quest]);

  useEffect(() => {
    if (phase !== "timer" || !unlockAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(unlockAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && sessionId) {
        setBusy(true);
        triviaService.get(sessionId)
          .then((result) => {
            setQuestions(result.questions);
            setPhase("trivia");
          })
          .catch((caught) => setError(caught instanceof Error ? caught.message : "No pudimos abrir la trivia."))
          .finally(() => setBusy(false));
      }
    };
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [phase, sessionId, unlockAt]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  if (!quest) return null;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(async () => {
    const result = await questsService.start(quest.id);
    if (quest.verificationMethod === "trivia" && result.trivia_session) {
      setSessionId(result.trivia_session.id);
      setUnlockAt(result.trivia_session.unlock_at);
      setSecondsLeft(Math.max(0, Math.ceil(
        (new Date(result.trivia_session.unlock_at).getTime() - Date.now()) / 1000
      )));
      if (quest.song?.listenUrl) window.open(quest.song.listenUrl, "_blank", "noopener,noreferrer");
      setPhase("timer");
    }
  });

  const uploadEvidence = () => run(async () => {
    if (!file) throw new Error("Selecciona una imagen antes de enviar.");
    if (!quest.attempt) await questsService.start(quest.id);
    await questsService.submitEvidence(quest.id, file, note);
    await onChanged("Evidencia enviada a revisión.");
    onClose();
  });

  const submitTrivia = () => run(async () => {
    if (!sessionId) throw new Error("La sesión de trivia no está disponible.");
    const result = await triviaService.submit(sessionId, answers);
    setScore(result.score);
    setPassed(result.passed);
    setPhase("result");
    if (result.passed) await onChanged(`+${result.reward_credits} NNE Credits.`);
  });

  const copyReferral = () => run(async () => {
    if (!referralCode) throw new Error("Tu enlace todavía no está disponible.");
    const url = `${window.location.origin}${import.meta.env.BASE_URL}signup?ref=${encodeURIComponent(referralCode)}`;
    await navigator.clipboard.writeText(url);
    await onChanged("Enlace de invitación copiado.");
  });

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div><div className="eyebrow">Quest</div><h2>{quest.title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        {error && <div className="form-error">{error}</div>}

        {quest.verificationMethod === "manual" && (
          <>
            <p>{quest.description}</p>
            <label className="upload-zone">
              <strong>{file ? file.name : "Subir screenshot"}</strong>
              <span>PNG, JPG o WEBP · máximo 10 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <textarea
              className="field"
              placeholder="Nota opcional para el equipo NNE"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button className="primary-button full" disabled={busy || !file} onClick={uploadEvidence}>
              {busy ? "Enviando…" : "Enviar evidencia"}
            </button>
          </>
        )}

        {quest.verificationMethod === "referral" && (
          <>
            <p>{quest.description}</p>
            <div className="referral-code">{referralCode || "Preparando enlace…"}</div>
            <button className="primary-button full" disabled={busy || !referralCode} onClick={copyReferral}>
              Copiar enlace personal
            </button>
          </>
        )}

        {quest.verificationMethod === "trivia" && phase === "intro" && (
          <>
            <p>{quest.description}</p>
            <div className="quest-rules">
              <div><span>01</span> Abre la canción desde el enlace oficial.</div>
              <div><span>02</span> Escucha al menos {quest.minimumListenSeconds} segundos.</div>
              <div><span>03</span> Supera la trivia con {quest.passPercentage}% o más.</div>
            </div>
            <button className="primary-button full" disabled={busy} onClick={start}>
              {busy ? "Preparando…" : "Abrir canción y comenzar"}
            </button>
          </>
        )}

        {quest.verificationMethod === "trivia" && phase === "timer" && (
          <div className="listening-timer">
            <div className="eyebrow">Listening mode</div>
            <strong>{secondsLeft}s</strong>
            <p>{busy ? "Cargando trivia…" : "La trivia se desbloquea al terminar el contador."}</p>
          </div>
        )}

        {quest.verificationMethod === "trivia" && phase === "trivia" && (
          <>
            <div className="quiz-progress">{answeredCount} / {questions.length} respondidas</div>
            <div className="quiz-list">
              {questions.map((question, questionIndex) => (
                <article className="quiz-question" key={question.id}>
                  <strong>{questionIndex + 1}. {question.prompt}</strong>
                  <div className="quiz-options">
                    {question.options.map((option) => (
                      <button
                        key={option.id}
                        className={answers[question.id] === option.id ? "quiz-option selected" : "quiz-option"}
                        onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <button
              className="primary-button full"
              disabled={busy || answeredCount !== questions.length}
              onClick={submitTrivia}
            >
              {busy ? "Calificando…" : "Enviar respuestas"}
            </button>
          </>
        )}

        {quest.verificationMethod === "trivia" && phase === "result" && (
          <div className="quiz-result">
            <div className="eyebrow">Resultado</div>
            <strong>{score}%</strong>
            <h3>{passed ? "Quest completada." : "Todavía no."}</h3>
            <p>{passed ? `Ganaste ${quest.rewardCredits} NNE Credits.` : "Escucha nuevamente y vuelve a intentarlo mañana."}</p>
            <button className="primary-button full" onClick={onClose}>Cerrar</button>
          </div>
        )}
      </section>
    </div>
  );
}
