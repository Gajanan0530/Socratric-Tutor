from llm import get_client, generate_explanation_stream

# Fixed inputs — same every run so the test is predictable
CONCEPT = "backpropagation"
PERSONA = "5-year-old"

print(f"Testing call 1 — explanation streaming")
print(f"Concept : {CONCEPT}")
print(f"Persona : {PERSONA}")
print("-" * 40)

client = get_client()

full_text = ""
for chunk in generate_explanation_stream(client, CONCEPT, PERSONA):
    print(chunk, end="", flush=True)
    full_text += chunk

print("\n" + "-" * 40)
print(f"Total characters received : {len(full_text)}")
print(f"Streaming : OK")