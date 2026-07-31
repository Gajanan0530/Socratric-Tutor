from llm import get_client, generate_explanation_stream, generate_quiz, generate_report

CONCEPT = "backpropagation"
PERSONA = "5-year-old"

print("Testing call 3 — misconception detection")
print(f"Concept : {CONCEPT}")
print(f"Persona : {PERSONA}")
print("-" * 40)

client = get_client()

# Step 1: Generate explanation (call 1)
print("Step 1: Generating explanation...")
explanation_text = ""
for chunk in generate_explanation_stream(client, CONCEPT, PERSONA):
    explanation_text += chunk
print(f"Explanation received — {len(explanation_text)} chars")
print()

# Step 2: Generate quiz from explanation (call 2)
print("Step 2: Generating quiz...")
quiz = generate_quiz(client, explanation_text)
print(f"Quiz received — {len(quiz.questions)} questions")
print()

# Step 3: Hardcoded answers — deliberately varied quality
# Answer 1: strong — captures the core concept clearly
# Answer 2: vague — right idea but imprecisely expressed
# Answer 3: wrong — completely wrong mental model
user_answers = [
    "The computer looks at what went wrong and figures out which parts caused the mistake, then makes small adjustments so it does better next time",
    "It learns from mistakes somehow by going backwards",
    "The computer starts completely over from scratch every time it makes a mistake",
]

print("Step 3: User answers being tested")
for i, ans in enumerate(user_answers, 1):
    print(f"  Answer {i} : {ans}")
print()

# Step 4: Generate report (call 3)
print("Step 4: Generating misconception report...")
report = generate_report(client, CONCEPT, PERSONA, quiz, user_answers)
print()

# Step 5: Print the full report
print("=" * 40)
print("MISCONCEPTION REPORT")
print("=" * 40)
print(f"Understanding score : {report.understanding_score} / 100")
print()

print("Strengths:")
for s in report.strengths:
    print(f"  + {s}")
print()

if report.gaps:
    print("Gaps:")
    for g in report.gaps:
        print(f"  Topic     : {g.topic}")
        print(f"  Type      : {g.gap_type}")
        print(f"  Evidence  : {g.evidence}")
        print(f"  Correction: {g.correction}")
        print()
else:
    print("Gaps: None detected")
    print()

print(f"Encouragement : {report.encouragement}")
print("=" * 40)
print("Report generation : OK")