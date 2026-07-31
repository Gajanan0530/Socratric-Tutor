// ── Base URL ───────────────────────────────────────────────────────────────────
// In development: defaults to localhost:8000 where uvicorn is running.
// In production: set VITE_API_URL in Vercel's environment variables
// to point to your Render backend URL.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── 1. Fetch personas ──────────────────────────────────────────────────────────
// Called once when the app loads. Returns the list of personas for the selector.
export async function fetchPersonas() {
  const res = await fetch(`${BASE}/api/personas`);
  if (!res.ok) throw new Error(`Failed to fetch personas: ${res.status}`);
  return res.json(); // { personas: [{key, icon, sub, col}] }
}

// ── 2. Stream explanation ──────────────────────────────────────────────────────
// Calls /api/explain and reads the SSE stream chunk by chunk.
// onChunk(text) is called for each piece of text as it arrives.
// onDone() is called when the stream ends.
// onError(message) is called if the server sends an error chunk.
export async function streamExplain(concept, personaKey, onChunk, onDone, onError) {
  const res = await fetch(`${BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, persona_key: personaKey }),
  });

  if (!res.ok) {
    throw new Error(`Explain request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  // Read the stream chunk by chunk until [DONE]
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode the binary chunk into a string and split into SSE lines
    const raw = decoder.decode(value, { stream: true });
    const lines = raw.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const payload = line.slice(6).trim(); // strip "data: " prefix

      if (payload === '[DONE]') {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(payload);
        if (parsed.text) onChunk(parsed.text);
        if (parsed.error) onError?.(parsed.error);
      } catch {
        // Malformed JSON in a chunk — skip silently
      }
    }
  }

  // Stream ended without an explicit [DONE] — still call onDone
  onDone();
}

// ── 3. Generate quiz ───────────────────────────────────────────────────────────
// Sends the explanation text to the backend and gets back 3 questions.
// ideal_answer_summary is included in the response but never shown in the UI —
// it travels silently in state to be passed to fetchReport.
export async function fetchQuiz(explanationText) {
  const res = await fetch(`${BASE}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ explanation_text: explanationText }),
  });
  if (!res.ok) throw new Error(`Quiz request failed: ${res.status}`);
  return res.json(); // { questions: [{question, ideal_answer_summary}] }
}

// ── 4. Generate report ─────────────────────────────────────────────────────────
// Sends the full quiz (with ideal_answer_summary) and the learner's answers.
// Returns the full misconception report.
export async function fetchReport(concept, personaKey, questions, userAnswers) {
  const res = await fetch(`${BASE}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concept,
      persona_key: personaKey,
      questions,        // [{question, ideal_answer_summary}]
      user_answers: userAnswers, // ["answer1", "answer2", "answer3"]
    }),
  });
  if (!res.ok) throw new Error(`Report request failed: ${res.status}`);
  return res.json(); // {understanding_score, strengths, gaps, encouragement}
}