from pydantic import BaseModel, Field
from typing import Literal


class QuizQuestion(BaseModel):
    question: str
    ideal_answer_summary: str = Field(
        description=(
            "2–3 sentences describing what a correct answer demonstrates. "
            "Not a model answer to copy — describes what understanding looks like "
            "so the misconception detector can reason against it."
        )
    )


class QuizSet(BaseModel):
    questions: list[QuizQuestion] = Field(
        min_length=3,
        max_length=3,
        description="Always exactly 3 questions.",
    )


class Gap(BaseModel):
    topic: str = Field(
        description="Short label for the misunderstood concept. 3–6 words."
    )
    evidence: str = Field(
        description=(
            "Exact phrase from the learner's answer revealing the gap. "
            "Direct quote only — never a paraphrase of what they wrote."
        )
    )
    correction: str = Field(
        description=(
            "1–2 sentences explaining the correct concept "
            "using vocabulary appropriate for the explanation persona."
        )
    )
    gap_type: Literal["knowledge", "communication"] = Field(
        description=(
            "knowledge = wrong or missing mental model. "
            "communication = right concept, imprecise expression."
        )
    )


class MisconceptionReport(BaseModel):
    understanding_score: int = Field(
        ge=0,
        le=100,
        description=(
            "Overall comprehension 0–100. Use the full range. "
            "Must be below 50 if any ideal_answer_summary was not demonstrated."
        ),
    )
    strengths: list[str] = Field(
        description=(
            "Concepts the learner genuinely understood. "
            "At least one item required if score is above 30."
        )
    )
    gaps: list[Gap] = Field(
        description=(
            "Identified gaps with evidence and correction. "
            "Empty list is valid only if all three ideal summaries were met."
        )
    )
    encouragement: str = Field(
        description=(
            "One specific sentence referencing something concrete from their answers. "
            "Not generic praise like 'Keep it up!'"
        )
    )