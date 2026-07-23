import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const result = await env.DB.prepare(
    `SELECT id, song_id, quest_id, prompt, options_json, status, sort_order, created_at, updated_at
     FROM nne_trivia_questions
     ORDER BY quest_id, sort_order, created_at`
  ).all();
  return jsonOk({
    questions: (result.results || []).map((row) => ({
      ...row,
      options: JSON.parse(row.options_json || "[]"),
      options_json: undefined
      // correct_option_id is intentionally never selected.
    }))
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const questId = clean(payload.quest_id, 120);
  const prompt = clean(payload.prompt, 600);
  const inputOptions = Array.isArray(payload.options) ? payload.options.slice(0, 8) : [];
  const options = inputOptions
    .map((option, index) => ({
      id: clean(option?.id, 80) || String.fromCharCode(97 + index),
      text: clean(option?.text ?? option, 500)
    }))
    .filter((option) => option.text);
  const correctOptionId = clean(payload.correct_option_id, 80);
  if (!questId || !prompt || options.length < 2 || !options.some((option) => option.id === correctOptionId)) {
    return jsonError("nne_trivia_fields_invalid", "Completa la pregunta, opciones y respuesta correcta.", 400);
  }

  const quest = await env.DB.prepare(
    "SELECT id, song_id FROM nne_quests WHERE id = ? AND verification_method = 'trivia' LIMIT 1"
  ).bind(questId).first();
  if (!quest?.id) return jsonError("nne_trivia_quest_invalid", "Selecciona una quest de trivia válida.", 400);

  const id = `question_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_trivia_questions (
      id, song_id, quest_id, prompt, options_json, correct_option_id,
      explanation, status, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      quest.song_id || null,
      quest.id,
      prompt,
      JSON.stringify(options),
      correctOptionId,
      clean(payload.explanation, 1000) || null,
      payload.status === "inactive" ? "inactive" : "active",
      Math.floor(Number(payload.sort_order || 0)),
      timestamp,
      timestamp
    )
    .run();
  await writeNneAudit(env, request, auth.user.id, "trivia.created", "nne_trivia_question", id, {
    quest_id: quest.id
  });
  return jsonOk({ question: { id, quest_id: quest.id, prompt } }, 201);
}
