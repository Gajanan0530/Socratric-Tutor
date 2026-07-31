import os
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

from models import QuizSet, MisconceptionReport
from prompts import (
    build_explanation_prompt,
    build_report_contents,
    QUIZ_SYSTEM_PROMPT,
    REPORT_SYSTEM_PROMPT,
)

load_dotenv()

MODEL = "gemini-2.5-flash"


def get_client() -> genai.Client:
    """
    Create and return a Gemini client.
    Reads GEMINI_API_KEY from the .env file.
    Raises a clear error if the key is missing.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY not found. "
            "Make sure your .env file exists and contains the key."
        )
    return genai.Client(api_key=api_key)


# ── NEW: Rate limit detection ──────────────────────────────────────────────────

def _is_rate_limit(error: Exception) -> bool:
    """
    Return True if the error is a rate limit or quota exceeded error.
    Checks the error string for known indicators across SDK versions.
    """
    msg = str(error).upper()
    return (
        "429" in str(error)
        or "RESOURCE_EXHAUSTED" in msg
        or "QUOTA_EXCEEDED" in msg
    )


# ── NEW: Retry wrapper ─────────────────────────────────────────────────────────

def _retry(func, *args, **kwargs):
    """
    Call func(*args, **kwargs) with exponential backoff on rate limit errors.
    Sequence: immediate → wait 2s → wait 4s → wait 8s → raise.
    Any non-rate-limit error is raised immediately without retrying.
    """
    delays = [2, 4, 8]
    for delay in delays:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if _is_rate_limit(e):
                time.sleep(delay)
            else:
                raise
    # Final attempt — if this fails, the error propagates to the caller
    return func(*args, **kwargs)


# ── NEW: API key validation ────────────────────────────────────────────────────

def validate_api_key(client: genai.Client) -> tuple[bool, str]:
    """
    Make a minimal API call to confirm the key is valid at startup.
    Returns (True, "") on success.
    Returns (False, human_readable_message) on failure.
    """
    try:
        client.models.generate_content(
            model=MODEL,
            contents="hi",
            config=types.GenerateContentConfig(max_output_tokens=1),
        )
        return True, ""
    except Exception as e:
        msg = str(e).upper()
        if "API_KEY" in msg or "UNAUTHENTICATED" in msg or "INVALID_ARGUMENT" in msg:
            return False, (
                "Your API key appears to be invalid. "
                "Check your .env file and make sure the key is correct."
            )
        if _is_rate_limit(e):
            return False, (
                "Rate limit hit on startup. "
                "Wait a minute and refresh the page."
            )
        return False, f"Could not connect to Gemini: {e}"


# ── Call 1: Streaming explanation ─────────────────────────────────────────────

def generate_explanation_stream(
    client: genai.Client,
    concept: str,
    persona_key: str,
):
    """
    Stream an explanation of `concept` tailored to `persona_key`.
    Retries stream creation on rate limit errors before yielding any chunks.
    """
    def _make_stream():
        return client.models.generate_content_stream(
            model=MODEL,
            contents=f"Explain this concept: {concept}",
            config=types.GenerateContentConfig(
                system_instruction=build_explanation_prompt(persona_key),
            ),
        )

    # _retry handles the stream creation — once we have a stream, yield from it
    stream = _retry(_make_stream)
    for chunk in stream:
        if chunk.text:
            yield chunk.text


# ── Call 2: Quiz generation ────────────────────────────────────────────────────

def generate_quiz(
    client: genai.Client,
    explanation_text: str,
) -> QuizSet:
    """
    Generate 3 comprehension questions grounded in `explanation_text`.
    Returns a typed QuizSet via response.parsed.
    """
    def _call():
        return client.models.generate_content(
            model=MODEL,
            contents=(
                f"Generate a quiz based on this explanation:\n\n{explanation_text}"
            ),
            config=types.GenerateContentConfig(
                system_instruction=QUIZ_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=QuizSet,
            ),
        )

    response = _retry(_call)

    if response.parsed is not None:
        return response.parsed

    if response.text:
        try:
            data = json.loads(response.text)
            return QuizSet.model_validate(data)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(
                f"Quiz generation returned unparseable output: {exc}\n"
                f"Raw response: {response.text[:300]}"
            ) from exc

    raise ValueError(
        "Quiz generation returned no output. "
        "Check that min_length=3 and max_length=3 constraints are met."
    )


# ── Call 3: Misconception detection ───────────────────────────────────────────

def generate_report(
    client: genai.Client,
    concept: str,
    persona_key: str,
    quiz: QuizSet,
    user_answers: list[str],
) -> MisconceptionReport:
    """
    Diagnose comprehension gaps from the learner's quiz answers.
    Returns a typed MisconceptionReport via response.parsed.
    """
    contents = build_report_contents(
        concept, persona_key, quiz, user_answers
    )

    def _call():
        return client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=REPORT_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=MisconceptionReport,
            ),
        )

    response = _retry(_call)

    if response.parsed is not None:
        return response.parsed

    if response.text:
        try:
            data = json.loads(response.text)
            return MisconceptionReport.model_validate(data)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(
                f"Report generation returned unparseable output: {exc}\n"
                f"Raw response: {response.text[:300]}"
            ) from exc

    raise ValueError(
        "Report generation returned no output. "
        "Check that all Gap fields match the schema exactly."
    )