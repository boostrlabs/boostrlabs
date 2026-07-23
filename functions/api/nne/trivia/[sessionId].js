import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneSession,
  writeNneAudit
} from "../../../_lib/nne-api.js";
import { completeNneQuest, getNneQuest } from "../../../_lib/nne-community.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const session = await env.DB.prepare(
    `SELECT id, attempt_id, quest_id, questions_json, status, unlock_at, expires_at, score
     FROM nne_trivia_sessions
     WHERE id = ? AND user_id = ?
     LIMIT 1`
  )
    .bind(clean(params.sessionId, 120), auth.user.id)
    .first();
  if (!session?.id) return jsonError("nne_trivia_not_found", "No encontramos esa trivia.", 404);

  const current = Date.now();
  if (new Date(session.expires_at).getTime() <= current && !["passed", "failed"].includes(session.status)) {
    await env.DB.prepare("UPDATE nne_trivia_sessions SET status = 'expired' WHERE id = ?")
      .bind(session.id)
      .run();
    return jsonError("nne_trivia_expired", "La trivia expiró. Intenta la quest nuevamente.", 410);
  }
  if (new Date(session.unlock_at).getTime() > current) {
    return jsonOk({
      trivia_session: {
        id: session.id,
        status: "locked",
        unlock_at: session.unlock_at,
        expires_at: session.expires_at
      }
    });
  }

  if (session.status === "locked") {
    await env.DB.prepare("UPDATE nne_trivia_sessions SET status = 'open' WHERE id = ? AND status = 'locked'")
      .bind(session.id)
      .run();
  }

  let questions = [];
  try {
    questions = JSON.parse(session.questions_json);
  } catch {
    return jsonError("nne_trivia_corrupt", "La trivia no pudo cargarse.", 500);
  }

  return jsonOk({
    trivia_session: {
      id: session.id,
      status: session.status === "locked" ? "open" : session.status,
      unlock_at: session.unlock_at,
      expires_at: session.expires_at,
      score: session.score == null ? null : Number(session.score)
    },
    // questions_json is created server-side without correct_option_id.
    questions: ["open", "locked"].includes(session.status) ? questions : []
  });
}

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const session = await env.DB.prepare(
    `SELECT id, attempt_id, quest_id, questions_json, answer_key_json,
            status, unlock_at, expires_at
     FROM nne_trivia_sessions
     WHERE id = ? AND user_id = ?
     LIMIT 1`
  )
    .bind(clean(params.sessionId, 120), auth.user.id)
    .first();
  if (!session?.id) return jsonError("nne_trivia_not_found", "No encontramos esa trivia.", 404);
  if (["passed", "failed", "expired"].includes(session.status)) {
    return jsonError("nne_trivia_closed", "Esta trivia ya fue entregada.", 409);
  }

  const current = Date.now();
  if (new Date(session.unlock_at).getTime() > current) {
    return jsonError("nne_listen_time_required", "Completa el tiempo de escucha antes de responder.", 409, {
      unlock_at: session.unlock_at
    });
  }
  if (new Date(session.expires_at).getTime() <= current) {
    await env.DB.prepare("UPDATE nne_trivia_sessions SET status = 'expired' WHERE id = ?")
      .bind(session.id)
      .run();
    return jsonError("nne_trivia_expired", "La trivia expiró. Intenta la quest nuevamente.", 410);
  }

  const rawAnswers = parsed.payload?.answers;
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    return jsonError("nne_answers_required", "Responde todas las preguntas.", 400, { fields: ["answers"] });
  }

  let questions;
  let answerKey;
  try {
    questions = JSON.parse(session.questions_json);
    answerKey = JSON.parse(session.answer_key_json);
  } catch {
    return jsonError("nne_trivia_corrupt", "La trivia no pudo calificarse.", 500);
  }

  const answers = {};
  let correct = 0;
  for (const question of questions) {
    const answer = clean(rawAnswers[question.id], 80);
    const validOptionIds = new Set((question.options || []).map((option) => option.id));
    if (!answer || !validOptionIds.has(answer)) {
      return jsonError("nne_incomplete_trivia", "Responde todas las preguntas antes de entregar.", 400);
    }
    answers[question.id] = answer;
    if (answer === answerKey[question.id]) correct += 1;
  }

  const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
  const quest = await getNneQuest(env, session.quest_id);
  if (!quest?.id) return jsonError("nne_quest_not_found", "La quest ya no está disponible.", 409);
  const passed = score >= Number(quest.pass_percentage || 75);
  const timestamp = now();
  const sessionUpdate = env.DB.prepare(
    `UPDATE nne_trivia_sessions
     SET status = ?, answers_json = ?, score = ?, submitted_at = ?
     WHERE id = ? AND status IN ('locked', 'open')`
  ).bind(passed ? "passed" : "failed", JSON.stringify(answers), score, timestamp, session.id);

  if (passed) {
    await completeNneQuest(env, {
      attemptId: session.attempt_id,
      userId: auth.user.id,
      quest,
      score,
      leadingStatements: [sessionUpdate]
    });
  } else {
    await env.DB.batch([
      sessionUpdate,
      env.DB.prepare(
        `UPDATE nne_quest_attempts
         SET status = 'failed', score = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
      ).bind(score, timestamp, session.attempt_id, auth.user.id)
    ]);
  }

  await writeNneAudit(env, request, auth.user.id, "trivia.submitted", "nne_trivia_session", session.id, {
    quest_id: quest.id,
    score,
    passed
  });

  return jsonOk({
    result: {
      passed,
      score,
      correct,
      total: questions.length,
      reward_credits: passed ? Number(quest.reward_credits) : 0
    }
  });
}
