import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from llm import get_client, generate_explanation_stream, generate_quiz, generate_report
from models import QuizSet, QuizQuestion as QuizQuestionModel
from personas import PERSONAS

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Socratic Tutor API")

# CORS: allow the Vite dev server locally and the Vercel URL in production.
# Set CORS_ORIGIN env var on Render once the Vercel URL is known.
_origins = ["http://localhost:5173", "http://localhost:3000"]
if os.getenv("CORS_ORIGIN"):
    _origins.append(os.getenv("CORS_ORIGIN"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini client — created once at startup, reused across all requests
client = get_client()

# ── Persona display metadata ───────────────────────────────────────────────────
# personas.py holds prompt config only.
# Icon, subtitle, and accent colour for the frontend card live here.

PERSONA_META: dict[str, dict] = {
    "5-year-old":                     {"icon": "🧸", "sub": "Everyday analogies",       "col": "#F4A261"},
    "high schooler":                  {"icon": "🎒", "sub": "Sports & games",            "col": "#52B788"},
    "skeptical PhD researcher":       {"icon": "🔬", "sub": "Adjacent technical fields", "col": "#9B8FD4"},
    "busy startup founder":           {"icon": "🚀", "sub": "Product strategy",          "col": "#E9C46A"},
    "engineer from an adjacent field":{"icon": "⚙️", "sub": "Systems & code",           "col": "#4ECDC4"},
}

# ── Request models ─────────────────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    concept: str
    persona_key: str


class QuizRequest(BaseModel):
    explanation_text: str


class QuizQuestionIn(BaseModel):
    question: str
    ideal_answer_summary: str


class ReportRequest(BaseModel):
    concept: str
    persona_key: str
    questions: list[QuizQuestionIn]
    user_answers: list[str]


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/api/personas")
def get_personas():
    """Return the persona list for the frontend selector."""
    return {
        "personas": [
            {
                "key": key,
                **PERSONA_META.get(key, {"icon": "", "sub": "", "col": "#888"}),
            }
            for key in PERSONAS
        ]
    }


@app.post("/api/explain")
def explain(req: ExplainRequest):
    """
    Stream the explanation as Server-Sent Events.
    Each chunk:  data: {"text": "..."}
    Final event: data: [DONE]
    """
    def event_stream():
        try:
            for chunk in generate_explanation_stream(
                client, req.concept, req.persona_key
            ):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Prevents Render's nginx from buffering SSE
        },
    )


@app.post("/api/quiz")
def quiz(req: QuizRequest):
    """Generate 3 comprehension questions grounded in the explanation text."""
    quiz_set = generate_quiz(client, req.explanation_text)
    return {
        "questions": [
            {
                "question": q.question,
                "ideal_answer_summary": q.ideal_answer_summary,
            }
            for q in quiz_set.questions
        ]
    }


@app.post("/api/report")
def report(req: ReportRequest):
    """Analyse the learner's answers and return a full misconception report."""
    quiz_set = QuizSet(
        questions=[
            QuizQuestionModel(
                question=q.question,
                ideal_answer_summary=q.ideal_answer_summary,
            )
            for q in req.questions
        ]
    )

    result = generate_report(
        client,
        req.concept,
        req.persona_key,
        quiz_set,
        req.user_answers,
    )

    return {
        "understanding_score": result.understanding_score,
        "strengths": result.strengths,
        "gaps": [
            {
                "topic": g.topic,
                "type": g.gap_type,
                "evidence": g.evidence,
                "correction": g.correction,
            }
            for g in result.gaps
        ],
        "encouragement": result.encouragement,
    }