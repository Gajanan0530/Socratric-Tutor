# 🧠 Socratric Tutor

A personalized explanation and comprehension-testing system, powered by Gemini. Pick a persona, get an explanation tailored to it, then prove you actually understood it — not just that you read it.

**Live app:** https://socratric-tutor.vercel.app
*(Note: the backend runs on Render's free tier and spins down after 15 minutes of inactivity — the first request after idle can take 30–50 seconds to respond.)*

---

## What it does

1. Pick a concept — anything from `backpropagation` to `simple interest`
2. Pick a persona — 5-year-old, high schooler, PhD researcher, startup founder, or adjacent-field engineer
3. Get a streamed, persona-tailored explanation
4. Answer 3 comprehension questions generated *from that specific explanation* — not generic questions about the topic
5. Get a diagnostic report: a score, what you got right, and specific gaps — each labeled as a **knowledge gap** (wrong mental model) or a **communication gap** (right idea, imprecise wording), with the exact quote from your answer that revealed it

## Architecture

socratric-tutor/
├── backend/ FastAPI · Python · Gemini API
│ ├── main.py 4 routes + CORS + SSE streaming
│ ├── llm.py Gemini client + 3 call functions
│ ├── models.py Pydantic schemas (QuizSet, MisconceptionReport)
│ ├── personas.py 5 persona configs (prompt-facing)
│ ├── prompts.py System instructions for all 3 calls
│ └── requirements.txt
│
└── frontend/ React · Vite
├── src/api.js The only file that knows the backend exists
├── src/App.jsx State + stage router
├── src/screens/ 5 screens: Input, Explaining, Explained, Quiz, Report
└── src/components/ Header, StepNav (shared across screens)


**Request flow:**

React (Vercel) → FastAPI (Render) → Gemini API
fetch/SSE llm.py google-genai SDK


The API key lives only in Render's environment variables. The browser never sees it.

## The three-call pipeline

**Call 1 — Explanation.** Streamed via Server-Sent Events. The persona is injected as the `system_instruction`; the concept is the `contents`. Each persona is structured config (tone, vocabulary ceiling, analogy domain, length, and an explicit `avoid` list) rather than a single freeform prompt — this is what makes five personas produce five genuinely different explanations instead of five variations on the same one.

**Call 2 — Quiz.** Takes the *explanation text itself* as input, not the raw concept — so the questions test comprehension of what was actually said, not general topic knowledge. Returns structured JSON (`response_schema=QuizSet`) with 3 questions, each carrying a hidden `ideal_answer_summary` that describes what understanding looks like, never shown to the user.

**Call 3 — Misconception report.** Compares the learner's answers against those hidden summaries and classifies each gap as `knowledge` (wrong mental model — acting on this answer leads to a wrong conclusion) or `communication` (right idea, imprecise expression). Every gap cites an exact quote from the learner's own answer as evidence.

## Local development

**Backend:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows
pip install -r requirements.txt
# copy .env.example to .env and add your GEMINI_API_KEY
python -m uvicorn main:app --reload --port 8000
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `localhost:5173`, backend on `localhost:8000`. `frontend/src/api.js` defaults to `localhost:8000` when `VITE_API_URL` isn't set.

## Deployment

- **Frontend** → Vercel. Root directory `frontend`, build command `npm run build`, output `dist`. Environment variable: `VITE_API_URL` pointing at the Render backend URL.
- **Backend** → Render. Root directory `backend`, build command `pip install -r requirements.txt`, start command `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`. Environment variables: `GEMINI_API_KEY` and `CORS_ORIGIN` (set to the exact Vercel production URL).

## Known limitations

- **Cold starts.** Render's free tier sleeps after 15 minutes of inactivity.
- **Model deprecation risk.** Gemini model IDs get retired on an aggressive schedule. `backend/llm.py` has a single `MODEL` constant — if requests start failing with a `404 NOT_FOUND … no longer available` error, check Render's logs for the exact message and update that one line.
- **No persistence.** Nothing is saved between sessions — XP, streaks, and history reset on refresh. This was an intentional scope decision, not an oversight.

## Skills this project demonstrates

Prompt engineering as structured config rather than freeform strings · chained LLM calls with deliberate context isolation between them · structured output via Pydantic schemas (`response_schema`, `response.parsed`) · Server-Sent Events for token streaming across a frontend/backend boundary · React state management without a routing library · a full incident response (exposed API key → revoked → rotated → git history cleaned) · debugging via reading actual stack traces and CORS headers rather than guessing.