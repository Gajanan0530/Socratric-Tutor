from typing import TypedDict


class PersonaConfig(TypedDict):
    tone: str
    vocab_ceiling: str
    prior_knowledge: str
    analogy_domain: str
    length: str
    avoid: str


PERSONAS: dict[str, PersonaConfig] = {
    "5-year-old": {
        "tone": "playful, warm, uses repetition and gentle questions",
        "vocab_ceiling": (
            "words a 5-year-old would know — "
            "no multi-syllable technical terms"
        ),
        "prior_knowledge": (
            "no background in math, science, or technology "
            "beyond everyday experience"
        ),
        "analogy_domain": "toys, animals, snacks, playground games",
        "length": "120–150 words",
        "avoid": (
            "numbers above 100, abstract statistics, "
            "time spans longer than 'a day'"
        ),
    },
    "high schooler": {
        "tone": "casual but respectful, relatable, not condescending",
        "vocab_ceiling": (
            "everyday English plus basic high-school science/math terms "
            "(variable, force, percentage are fine; "
            "stochastic, eigenvector are not)"
        ),
        "prior_knowledge": (
            "basic algebra and general science literacy, "
            "nothing beyond a typical 10th-grade curriculum"
        ),
        "analogy_domain": "school life, sports, video games, social media",
        "length": "150–200 words",
        "avoid": (
            "baby-ish tone or analogies so simplified "
            "they would feel condescending to a teenager"
        ),
    },
    "skeptical PhD researcher": {
        "tone": "precise, terse, intellectually rigorous",
        "vocab_ceiling": "full technical and field-specific vocabulary permitted",
        "prior_knowledge": (
            "graduate-level familiarity with the broader field, "
            "not necessarily this exact subfield"
        ),
        "analogy_domain": (
            "adjacent research fields or canonical results "
            "in math, CS, or physics"
        ),
        "length": "200–250 words, density over hand-holding",
        "avoid": (
            "stating any claim without a caveat on its scope or limitations; "
            "re-explaining prerequisites this audience already has"
        ),
    },
    "busy startup founder": {
        "tone": "direct, outcome-oriented, no fluff",
        "vocab_ceiling": (
            "business and general tech vocabulary fine; "
            "avoid deep academic jargon"
        ),
        "prior_knowledge": (
            "strong business intuition, weak technical background"
        ),
        "analogy_domain": "product, business strategy, hiring, fundraising",
        "length": "under 100 words, lead with the so-what",
        "avoid": (
            "burying the practical implication at the end — "
            "state why it matters in the first sentence"
        ),
    },
    "engineer from an adjacent field": {
        "tone": "peer-to-peer, collegial",
        "vocab_ceiling": (
            "full general engineering vocabulary; "
            "define ML-specific jargon on first use only"
        ),
        "prior_knowledge": (
            "strong programming and systems background, "
            "zero ML background"
        ),
        "analogy_domain": (
            "software engineering — "
            "caching, indexing, compilers, distributed systems"
        ),
        "length": "180–220 words",
        "avoid": (
            "explaining basic programming concepts like loops or functions "
            "— condescending to this audience"
        ),
    },
}