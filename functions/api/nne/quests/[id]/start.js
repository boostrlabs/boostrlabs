import { clean, jsonError, jsonOk, now, onOptions, requireNneSession } from "../../../../_lib/nne-api.js";
import {
  getNneQuest,
  nnePeriodKey,
  parseOptions,
  shuffle
} from "../../../../_lib/nne-community.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const questId = clean(params.id, 120);
  const quest = await getNneQuest(env, questId);
  if (!quest?.id) return jsonError("nne_quest_not_found", "Esta quest no está disponible.", 404);
  if (auth.user.level < Number(quest.minimum_level || 1)) {
    return jsonError("nne_level_required", `Necesitas nivel ${quest.minimum_level} para comenzar.`, 403);
  }

  const periodKey = nnePeriodKey(quest.cadence);
  const existing = await env.DB.prepare(
    `SELECT id, status, unlock_at
     FROM nne_quest_attempts
     WHERE quest_id = ? AND user_id = ? AND period_key = ?
     LIMIT 1`
  )
    .bind(quest.id, auth.user.id, periodKey)
    .first();

  if (existing?.id) {
    if (["completed", "approved"].includes(existing.status)) {
      return jsonError("nne_quest_already_completed", "Ya completaste esta quest en este periodo.", 409);
    }
    const trivia = quest.verification_method === "trivia"
      ? await env.DB.prepare(
          "SELECT id, status, unlock_at, expires_at FROM nne_trivia_sessions WHERE attempt_id = ? LIMIT 1"
        ).bind(existing.id).first()
      : null;
    return jsonOk({
      attempt: existing,
      trivia_session: trivia || null,
      next_action: quest.verification_method === "manual"
        ? "upload_evidence"
        : quest.verification_method === "trivia"
          ? "listen_then_trivia"
          : quest.verification_method
    });
  }

  const timestamp = now();
  const attemptId = crypto.randomUUID();
  const unlockAt = quest.verification_method === "trivia"
    ? new Date(Date.now() + Number(quest.minimum_listen_seconds || 0) * 1000).toISOString()
    : null;

  const statements = [
    env.DB.prepare(
      `INSERT INTO nne_quest_attempts (
        id, quest_id, user_id, period_key, status, attempt_count, unlock_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'started', 1, ?, ?, ?)`
    ).bind(attemptId, quest.id, auth.user.id, periodKey, unlockAt, timestamp, timestamp)
  ];

  let triviaSession = null;
  if (quest.verification_method === "trivia") {
    const questionResult = await env.DB.prepare(
      `SELECT id, prompt, options_json, correct_option_id
       FROM nne_trivia_questions
       WHERE quest_id = ? AND status = 'active'
       ORDER BY sort_order`
    )
      .bind(quest.id)
      .all();
    const selected = shuffle(questionResult.results || []).slice(0, 10);
    if (selected.length === 0) {
      return jsonError("nne_trivia_unavailable", "La trivia todavía no tiene preguntas activas.", 409);
    }

    const publicQuestions = selected.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: shuffle(parseOptions(question.options_json))
    }));
    const answerKey = Object.fromEntries(
      selected.map((question) => [question.id, clean(question.correct_option_id, 80)])
    );
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    statements.push(
      env.DB.prepare(
        `INSERT INTO nne_trivia_sessions (
          id, attempt_id, user_id, quest_id, questions_json, answer_key_json,
          status, unlock_at, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'locked', ?, ?, ?)`
      ).bind(
        sessionId,
        attemptId,
        auth.user.id,
        quest.id,
        JSON.stringify(publicQuestions),
        JSON.stringify(answerKey),
        unlockAt,
        expiresAt,
        timestamp
      )
    );
    triviaSession = { id: sessionId, status: "locked", unlock_at: unlockAt, expires_at: expiresAt };
  }

  await env.DB.batch(statements);
  return jsonOk(
    {
      attempt: { id: attemptId, status: "started", unlock_at: unlockAt },
      trivia_session: triviaSession,
      song: quest.song_id
        ? {
            id: quest.song_id,
            title: quest.song_title,
            artist_name: quest.artist_name,
            listen_url: quest.listen_url,
            artwork_url: quest.artwork_url || null
          }
        : null,
      next_action: quest.verification_method === "manual"
        ? "upload_evidence"
        : quest.verification_method === "trivia"
          ? "listen_then_trivia"
          : quest.verification_method
    },
    201
  );
}
