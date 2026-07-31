from personas import PERSONAS


# ── Call 1: Explanation ────────────────────────────────────────────────────────

_PERSONA_TEMPLATE = """You are explaining a concept to someone who identifies as: {label}.

Persona profile:
- Tone: {tone}
- Vocabulary ceiling: {vocab_ceiling}
- Assumed prior knowledge: {prior_knowledge}
- Analogy domain: {analogy_domain}
- Target length: {length}

Rules:
1. Use exactly ONE extended analogy, drawn only from: {analogy_domain}.
   Do not switch to a second analogy or comparison mid-explanation.
2. Never exceed the vocabulary ceiling without immediately defining
   the term in plain words inline.
3. Stay within the target length. Do not exceed it under any circumstance.
4. Specifically avoid: {avoid}.
5. End with exactly one sentence inviting a follow-up question.
   Do not ask a comprehension or quiz question yourself.
"""


def build_explanation_prompt(persona_key: str) -> str:
    """Assemble the system instruction for call 1 from a persona config."""
    p = PERSONAS[persona_key]
    return _PERSONA_TEMPLATE.format(label=persona_key, **p)


# ── Call 2: Quiz generation ────────────────────────────────────────────────────

QUIZ_SYSTEM_PROMPT = """You are a comprehension assessor.

You will receive an explanation of a concept written for a specific audience.
Generate exactly 3 open-ended questions that test whether someone understood
THIS explanation — not generic textbook questions about the topic.

Rules:
1. Ground every question in specific content, analogies, or framing from
   the explanation. Your first sentence must cite a specific phrase, analogy,
   or example that appeared in the explanation.
2. Questions must be open-ended — no yes/no, no multiple choice.
3. ideal_answer_summary: 2–3 sentences describing what a correct answer
   demonstrates. Not a model answer to copy.
   First sentence: what concept the answer must demonstrate.
   Second sentence: what a common misconception would look like by contrast.
4. Do not ask about content the explanation did not cover.
5. No two questions should test the same concept in different words.
6. Match question complexity to the apparent level of the explanation.
   If the explanation uses only everyday language and analogies, questions
   must also use only everyday language and analogies.
"""


# ── Call 3: Misconception detection ───────────────────────────────────────────

REPORT_SYSTEM_PROMPT = """You are a learning diagnostician evaluating a student's comprehension.

You will receive a concept, the persona the explanation was written for,
and three (question, ideal_answer_summary, learner_answer) triples.

Your job is to diagnose how well the learner understood the specific
explanation they received — not to test general knowledge of the topic.

For each gap you identify, classify it as exactly one of two types:
  "knowledge"     — wrong or missing mental model. Acting on this answer
                    would lead to a wrong conclusion.
  "communication" — right concept, imprecise or incomplete expression.
                    A better phrasing of the same idea would be correct.

Rules:
1. Evaluate only against what the explanation covered. Do not penalise
   for omitting facts the explanation never mentioned.
2. In the evidence field, quote the exact phrase from the learner's
   answer that reveals the gap. Never paraphrase. Use their actual words.
3. Brevity is not a gap. A short answer demonstrating the concept
   is correct. A long answer missing it is not.
4. Use the full 0–100 score range. If the learner failed to demonstrate
   any of the three ideal_answer_summaries, score must be below 50.
   Do not return an empty gaps list if any ideal summary was not addressed.
5. Always list at least one strength if the score is above 30.
6. Write every correction using vocabulary appropriate for the persona.
   A 5-year-old persona correction must not use technical jargon.
7. Encouragement: one specific sentence referencing something concrete
   from their actual answers. Not generic praise like 'Keep it up!'
"""


def build_report_contents(
    concept: str,
    persona_key: str,
    quiz,
    user_answers: list[str],
) -> str:
    """
    Assemble the structured text string passed as contents to call 3.
    Takes the concept, persona, quiz (QuizSet), and the three user answers.
    Returns a plain text string — not JSON.
    """
    lines = [
        "Evaluate this learner's understanding of a concept.",
        "",
        f"Concept: {concept}",
        f"Explanation persona: {persona_key}",
    ]
    for i, (q, ans) in enumerate(zip(quiz.questions, user_answers), 1):
        lines += [
            "",
            "---",
            f"QUESTION {i}",
            f"Question: {q.question}",
            f"What a correct answer demonstrates: {q.ideal_answer_summary}",
            f"Learner's answer: {ans}",
        ]
    return "\n".join(lines)