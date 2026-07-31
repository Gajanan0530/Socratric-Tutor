import streamlit as st
from personas import PERSONAS
from llm import (
    get_client,
    validate_api_key,
    generate_explanation_stream,
    generate_quiz,
    generate_report,
)

# ── Page config ────────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Socratic Tutor",
    page_icon="🧠",
    layout="centered",
)

# ── Custom CSS ─────────────────────────────────────────────────────────────────

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif !important; }
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}

.block-container { padding-top: 2rem !important; max-width: 760px !important; }

div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #E8875A 0%, #D4724A 100%) !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    padding: 0.55rem 1.2rem !important;
    box-shadow: 0 2px 8px rgba(232,135,90,0.25) !important;
    transition: box-shadow 0.2s, transform 0.2s !important;
}
div.stButton > button[kind="primary"]:hover {
    box-shadow: 0 4px 16px rgba(232,135,90,0.35) !important;
    transform: translateY(-1px) !important;
}
div.stButton > button[kind="secondary"] {
    border-radius: 10px !important;
    border: 1.5px solid #EDE0D0 !important;
    font-weight: 500 !important;
}
div[data-testid="stTextInput"] input {
    border-radius: 10px !important;
    border: 1.5px solid #EDE0D0 !important;
    background: #FFFAF6 !important;
    font-size: 15px !important;
}
div[data-testid="stTextInput"] input:focus {
    border-color: #E8875A !important;
    box-shadow: 0 0 0 3px rgba(232,135,90,0.12) !important;
}
div[data-testid="stTextArea"] textarea {
    border-radius: 10px !important;
    border: 1.5px solid #EDE0D0 !important;
    background: #FFFAF6 !important;
    font-size: 14px !important;
    line-height: 1.65 !important;
}
div[data-testid="stTextArea"] textarea:focus {
    border-color: #E8875A !important;
    box-shadow: 0 0 0 3px rgba(232,135,90,0.12) !important;
}
div[data-testid="stSelectbox"] > div > div {
    border-radius: 10px !important;
    border: 1.5px solid #EDE0D0 !important;
}
div[data-testid="stVerticalBlockBorderWrapper"] > div {
    border-radius: 12px !important;
    border: 1.5px solid #EDE0D0 !important;
    background: #FFFAF6 !important;
}
</style>
""", unsafe_allow_html=True)

# ── Gemini client ──────────────────────────────────────────────────────────────

@st.cache_resource
def load_client():
    return get_client()

client = load_client()

# ── Startup validation ─────────────────────────────────────────────────────────

@st.cache_resource
def check_api_key():
    return validate_api_key(client)

valid, key_error = check_api_key()
if not valid:
    st.error(f"⚠️ API key problem: {key_error}")
    st.info("Fix your .env file and restart the app with `streamlit run app.py`.")
    st.stop()

# ── Session state ──────────────────────────────────────────────────────────────

if "stage" not in st.session_state:
    st.session_state.stage = "input"

# ── Persona icons ──────────────────────────────────────────────────────────────

PERSONA_ICONS = {
    "5-year-old": "🧸",
    "high schooler": "🎒",
    "skeptical PhD researcher": "🔬",
    "busy startup founder": "🚀",
    "engineer from an adjacent field": "⚙️",
}

# ── Helpers ────────────────────────────────────────────────────────────────────

def back_button(label: str, target_stage: str):
    if st.button(f"← {label}"):
        st.session_state.stage = target_stage
        st.rerun()


def reset():
    keys = [
        "concept", "persona_key", "explanation_text",
        "quiz", "report",
    ] + [f"ans_{i}" for i in range(3)]
    for k in keys:
        st.session_state.pop(k, None)
    st.session_state.stage = "input"


def show_error(context: str, error: Exception):
    msg = str(error).upper()
    if "429" in str(error) or "RESOURCE_EXHAUSTED" in msg:
        st.error(
            f"⚠️ Rate limit hit during {context}. "
            "Wait 60 seconds and try again."
        )
    elif "API_KEY" in msg or "UNAUTHENTICATED" in msg:
        st.error(
            f"⚠️ API key rejected during {context}. "
            "Check your .env file."
        )
    elif "QUOTA" in msg:
        st.error(
            "⚠️ Daily quota exceeded. "
            "Try again tomorrow at aistudio.google.com."
        )
    else:
        st.error(f"⚠️ Something went wrong during {context}: {error}")
    st.info("Use the button below to go back and try again.")


# ── Custom HTML components ─────────────────────────────────────────────────────

def render_concept_badge(concept: str, persona_key: str):
    """Concept + persona pill strip shown at the top of screens 2–5."""
    icon = PERSONA_ICONS.get(persona_key, "👤")
    st.markdown(f"""
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
        <span style="background:#FFF0E6; color:#C45E2A; font-size:13px;
                     padding:4px 12px; border-radius:20px; font-weight:500;">
            📖 {concept}
        </span>
        <span style="background:#F5F0FF; color:#5040A0; font-size:13px;
                     padding:4px 12px; border-radius:20px; font-weight:500;">
            {icon} {persona_key}
        </span>
    </div>
    """, unsafe_allow_html=True)


def render_persona_preview(persona_key: str):
    """Icon card shown below the persona dropdown on the input screen."""
    p = PERSONAS[persona_key]
    icon = PERSONA_ICONS.get(persona_key, "👤")
    st.markdown(f"""
    <div style="background:#FFF8F2; border:1.5px solid #EDE0D0;
                border-radius:12px; padding:14px 18px;
                margin-top:8px; margin-bottom:4px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <span style="font-size:28px; line-height:1;">{icon}</span>
            <span style="font-weight:600; font-size:15px; color:#2C2416;">
                {persona_key}
            </span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <span style="background:#FFF0E6; color:#C45E2A; font-size:12px;
                         padding:3px 10px; border-radius:20px; font-weight:500;">
                🎯 {p['analogy_domain']}
            </span>
            <span style="background:#F0F7FF; color:#2A5F8F; font-size:12px;
                         padding:3px 10px; border-radius:20px; font-weight:500;">
                📏 {p['length']}
            </span>
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_score_card(score: int):
    """Large score display with color-coded bar and label."""
    if score >= 80:
        color, label, emoji = "#52A97A", "Strong understanding", "🌟"
    elif score >= 50:
        color, label, emoji = "#E8A030", "Partial understanding", "📚"
    else:
        color, label, emoji = "#D95C5C", "Needs more work", "💪"

    st.markdown(f"""
    <div style="background:linear-gradient(135deg,#FFF8F2,#FFF2E8);
                border:1.5px solid #EDE0D0; border-radius:16px;
                padding:28px 24px; text-align:center; margin-bottom:24px;">
        <div style="font-size:48px; margin-bottom:6px;">{emoji}</div>
        <div style="font-size:64px; font-weight:700; color:{color};
                    line-height:1; margin-bottom:4px;">{score}</div>
        <div style="font-size:15px; color:#8B7355; margin-bottom:4px;">
            out of 100
        </div>
        <div style="font-size:13px; font-weight:500; color:{color};">
            {label}
        </div>
        <div style="background:#EDE0D0; border-radius:6px; height:8px;
                    margin:16px 0 0; overflow:hidden;">
            <div style="background:{color}; height:8px;
                        width:{score}%; border-radius:6px;"></div>
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_strength_item(text: str):
    """Single strength shown as a green card."""
    st.markdown(f"""
    <div style="display:flex; align-items:flex-start; gap:12px;
                padding:10px 14px; background:#F2FAF5;
                border:1.5px solid #A8D5B5; border-radius:10px;
                margin-bottom:8px;">
        <span style="font-size:18px; flex-shrink:0; margin-top:1px;">✅</span>
        <span style="font-size:14px; color:#2C4A35; line-height:1.55;">
            {text}
        </span>
    </div>
    """, unsafe_allow_html=True)


def render_gap_card(gap):
    """Colored left-border card with badge, evidence quote, and correction."""
    if gap.gap_type == "knowledge":
        border_color  = "#D95C5C"
        bg_color      = "#FFF5F5"
        badge_bg      = "#FDEAEA"
        badge_color   = "#B03030"
        badge_text    = "🧠 Knowledge gap"
    else:
        border_color  = "#E8A030"
        bg_color      = "#FFFBF0"
        badge_bg      = "#FEF3E0"
        badge_color   = "#915A10"
        badge_text    = "💬 Communication gap"

    st.markdown(f"""
    <div style="border-left:4px solid {border_color}; background:{bg_color};
                border-radius:0 12px 12px 0; padding:16px 18px;
                margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;
                    margin-bottom:10px; flex-wrap:wrap;">
            <span style="font-weight:600; font-size:15px; color:#2C2416;">
                {gap.topic}
            </span>
            <span style="background:{badge_bg}; color:{badge_color};
                         font-size:11px; padding:3px 10px; border-radius:20px;
                         font-weight:500;">
                {badge_text}
            </span>
        </div>
        <div style="font-size:13px; color:#8B7355; font-style:italic;
                    margin-bottom:10px;">
            From your answer: "{gap.evidence}"
        </div>
        <div style="background:white; border-radius:8px; padding:10px 14px;
                    font-size:13px; color:#2C2416; line-height:1.65;
                    border:1px solid {border_color}33;">
            {gap.correction}
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_quiz_progress(answered: int):
    """Three colored segments + count label."""
    segments = "".join(
        f'<div style="height:5px; flex:1; border-radius:3px; '
        f'background:{"#52A97A" if i < answered else "#EDE0D0"};"></div>'
        for i in range(3)
    )
    st.markdown(f"""
    <div style="display:flex; gap:6px; margin-bottom:6px;">{segments}</div>
    <div style="font-size:12px; color:#8B7355; margin-bottom:16px;">
        {answered} of 3 questions answered
    </div>
    """, unsafe_allow_html=True)


def render_encouragement(text: str):
    """Warm orange left-border encouragement card."""
    st.markdown(f"""
    <div style="background:#FFF8F2; border-left:4px solid #E8875A;
                border-radius:0 10px 10px 0; padding:14px 18px;
                margin:16px 0; font-size:14px; color:#5C4030;
                font-style:italic; line-height:1.65;">
        💬 {text}
    </div>
    """, unsafe_allow_html=True)


# ── Screen 1: Input ────────────────────────────────────────────────────────────

def render_input_screen():
    st.markdown("""
    <div style="text-align:center; padding:2rem 0 1.5rem;">
        <div style="font-size:56px; margin-bottom:12px;">🧠</div>
        <h1 style="font-size:32px; font-weight:700;
                   color:#2C2416; margin-bottom:8px;">
            Socratic Tutor
        </h1>
        <p style="font-size:16px; color:#8B7355; max-width:480px;
                  margin:0 auto; line-height:1.6;">
            Any concept. Any audience. Understand it deeply —
            then test what you actually learned.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    concept = st.text_input(
        "What concept do you want to understand?",
        placeholder=(
            "e.g. backpropagation, recursion, "
            "photosynthesis, compound interest"
        ),
    )

    persona_key = st.selectbox(
        "Explain it to me like I'm a...",
        options=list(PERSONAS.keys()),
    )

    render_persona_preview(persona_key)
    st.divider()

    if st.button(
        "Explain it →",
        disabled=not concept.strip(),
        use_container_width=True,
        type="primary",
    ):
        st.session_state.concept = concept.strip()
        st.session_state.persona_key = persona_key
        st.session_state.stage = "explaining"
        st.rerun()


# ── Screen 2: Explaining (streaming) ──────────────────────────────────────────

def render_explaining_screen():
    concept    = st.session_state.concept
    persona_key = st.session_state.persona_key

    render_concept_badge(concept, persona_key)
    st.markdown(f"### {concept}")
    st.divider()

    try:
        stream = generate_explanation_stream(client, concept, persona_key)
        full_text = st.write_stream(stream)
        st.session_state.explanation_text = full_text
        st.session_state.stage = "explained"
        st.rerun()

    except Exception as e:
        show_error("explanation", e)
        back_button("Back to input", "input")


# ── Screen 3: Explained ────────────────────────────────────────────────────────

def render_explained_screen():
    back_button("Back to input", "input")

    render_concept_badge(
        st.session_state.concept,
        st.session_state.persona_key,
    )
    st.markdown(f"### {st.session_state.concept}")
    st.divider()

    # Explanation inside a warm content card
    st.markdown(f"""
    <div style="background:#FFF8F2; border:1.5px solid #EDE0D0;
                border-radius:14px; padding:22px 24px; font-size:15px;
                line-height:1.75; color:#2C2416; margin-bottom:20px;">
        {st.session_state.explanation_text}
    </div>
    """, unsafe_allow_html=True)

    if st.button(
        "Test my understanding →",
        use_container_width=True,
        type="primary",
    ):
        with st.spinner("Writing questions from your explanation..."):
            try:
                st.session_state.quiz = generate_quiz(
                    client,
                    st.session_state.explanation_text,
                )
                st.session_state.stage = "quizzed"
                st.rerun()
            except Exception as e:
                show_error("quiz generation", e)


# ── Screen 4: Quiz ─────────────────────────────────────────────────────────────

def render_quiz_screen():
    back_button("Back to explanation", "explained")

    render_concept_badge(
        st.session_state.concept,
        st.session_state.persona_key,
    )
    st.markdown("### How well did you understand it?")
    st.caption("Answer in your own words — no perfect phrasing required.")

    with st.expander("View the explanation again", expanded=False):
        st.write(st.session_state.explanation_text)

    st.divider()

    for i, q in enumerate(st.session_state.quiz.questions):
        with st.container(border=True):
            st.markdown(f"""
            <div style="display:inline-block; background:#FFF0E6;
                        color:#C45E2A; font-size:11px; font-weight:600;
                        padding:3px 10px; border-radius:20px;
                        margin-bottom:8px; text-transform:uppercase;
                        letter-spacing:0.5px;">
                Question {i+1} of 3
            </div>
            """, unsafe_allow_html=True)
            st.markdown(f"**{q.question}**")
            st.text_area(
                label=f"ans_{i}",
                label_visibility="collapsed",
                key=f"ans_{i}",
                height=110,
                placeholder=(
                    "Write your answer here — "
                    "a sentence or two is perfectly fine."
                ),
            )

    answered = sum(
        1
        for i in range(3)
        if len(st.session_state.get(f"ans_{i}", "").strip()) >= 20
    )
    all_done = answered == 3

    st.divider()
    render_quiz_progress(answered)

    if st.button(
        "Analyse my understanding →",
        disabled=not all_done,
        use_container_width=True,
        type="primary",
    ):
        user_answers = [
            st.session_state.get(f"ans_{i}", "") for i in range(3)
        ]
        with st.spinner("Reading your answers carefully..."):
            try:
                st.session_state.report = generate_report(
                    client,
                    st.session_state.concept,
                    st.session_state.persona_key,
                    st.session_state.quiz,
                    user_answers
                )
                st.session_state.stage = "reported"
                st.rerun()
            except Exception as e:
                show_error("report generation", e)


# ── Screen 5: Report ───────────────────────────────────────────────────────────

def render_report_screen():
    report  = st.session_state.report
    concept = st.session_state.concept
    persona = st.session_state.persona_key

    render_concept_badge(concept, persona)
    st.markdown("### Your understanding report")
    st.divider()

    render_score_card(report.understanding_score)

    if report.strengths:
        st.markdown("**✨ What you understood well**")
        for s in report.strengths:
            render_strength_item(s)

    st.markdown(
        "<div style='margin-top:8px;'></div>",
        unsafe_allow_html=True,
    )

    if report.gaps:
        st.markdown("**🎯 Where to focus next**")
        for gap in report.gaps:
            render_gap_card(gap)
    else:
        st.markdown("""
        <div style="background:#F2FAF5; border:1.5px solid #A8D5B5;
                    border-radius:12px; padding:16px 20px;
                    font-size:14px; color:#2C4A35; font-weight:500;">
            🎉 No gaps detected — all three concepts demonstrated clearly.
        </div>
        """, unsafe_allow_html=True)

    render_encouragement(report.encouragement)
    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        if st.button("← Try a different persona", use_container_width=True):
            for k in ["explanation_text", "quiz", "report"] + [
                f"ans_{i}" for i in range(3)
            ]:
                st.session_state.pop(k, None)
            st.session_state.stage = "input"
            st.rerun()
    with col2:
        if st.button(
            "Try another concept →",
            use_container_width=True,
            type="primary",
        ):
            reset()
            st.rerun()


# ── Stage router ───────────────────────────────────────────────────────────────

if st.session_state.stage == "input":
    render_input_screen()
elif st.session_state.stage == "explaining":
    render_explaining_screen()
elif st.session_state.stage == "explained":
    render_explained_screen()
elif st.session_state.stage == "quizzed":
    render_quiz_screen()
elif st.session_state.stage == "reported":
    render_report_screen()
else:
    reset()
    st.rerun()