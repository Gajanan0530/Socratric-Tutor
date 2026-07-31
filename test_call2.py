from llm import get_client, generate_explanation_stream, generate_quiz

CONCEPT = "backpropagation"
PERSONA = "5-year-old"

print("Testing call 2 — quiz generation")
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

# Step 2: Generate quiz from that explanation (call 2)
print("Step 2: Generating quiz from explanation...")
quiz = generate_quiz(client, explanation_text)
print(f"QuizSet received — {len(quiz.questions)} questions")
print()

# Step 3: Print each question and its ideal_answer_summary
for i, q in enumerate(quiz.questions, 1):
    print(f"Question {i}")
    print(f"  Q      : {q.question}")
    print(f"  Ideal  : {q.ideal_answer_summary}")
    print()

print("-" * 40)
print("Quiz generation : OK")