r"""Mini NotebookLM — API smoke tests (for main_new.py with auth)

Run after starting the backend:
    .venv\Scripts\python.exe -m uvicorn main_new:app --reload --port 5000

Endpoints requiring an LLM API key (ask, summarize, concept-map, voice-overview)
will return 500 with a Gemini/OpenAI API key error when GEMINI_API_KEY or
OPENAI_API_KEY is not set to a valid value in .env.
"""

import requests
import json

BASE = "http://localhost:5000"
HEADERS = {"X-User-Profile": "testuser"}

TEST_TEXT = """\
Machine learning is a subfield of computer science that uses data and
algorithms to imitate the way humans learn and solve problems. The term was
coined by IBM employee Arthur Samuel in 1962. Machine learning is closely
related to (and often confused with) computational statistics. Machine
learning is a form of artificial intelligence (AI). Deep learning is a subset
of machine learning that uses neural networks with many layers.
"""

FILE_NAME = "test_ml.txt"


def sep(title):
    print("\n" + "=" * 55)
    print(f"  {title}")
    print("=" * 55)


def main():
    # -- 0. Health check --
    sep("0. GET /health")
    r = requests.get(f"{BASE}/health", headers=HEADERS, timeout=10)
    print(f"Status : {r.status_code}")
    print(f"Body   : {r.json()}")

    # -- 1. Upload --
    sep("1. POST /upload - test_ml.txt")
    files = {"file": (FILE_NAME, TEST_TEXT.encode("utf-8"), "text/plain")}
    r = requests.post(f"{BASE}/upload", headers=HEADERS, files=files, timeout=120)
    print(f"Status : {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Chunks indexed: {d.get('chunks_indexed')}")
        print(f"File size     : {d.get('file_size_bytes')}")
    else:
        print(f"Error: {r.text[:200]}")
        return

    # -- 2. List files --
    sep("2. GET /files")
    r = requests.get(f"{BASE}/files", headers=HEADERS, timeout=10)
    print(f"Status : {r.status_code}")
    d = r.json()
    print(f"Total  : {d.get('total')}")
    for f in d.get("files", []):
        print(f"  - {f['file_name']} ({f['size_bytes']} bytes)")

    # -- 3. Ask (vector search + LLM) --
    sep("3. POST /ask - What is machine learning?")
    r = requests.post(
        f"{BASE}/ask",
        headers=HEADERS,
        json={"question": "What is machine learning?", "session_id": "test-session"},
        timeout=60,
    )
    print(f"Status : {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Answer : {d['answer'][:300]}")
        print(f"Sources: {len(d['sources'])} chunk(s)")
        for s in d["sources"]:
            print(f"  - source={s['source']}, chunk={s['chunk_index']}")
    else:
        detail = r.json().get("detail", "")
        if "API key" in detail or "Gemini" in detail or "OpenAI" in detail:
            print("-> Vector search RETRIEVAL succeeded. Failed only at LLM call.")
            print("   (Set a valid GEMINI_API_KEY or OPENAI_API_KEY in .env)")
        else:
            print(f"Error: {detail[:200]}")

    # -- 4. Follow-up (session memory) --
    sep("4. POST /ask - follow-up (session memory test)")
    r = requests.post(
        f"{BASE}/ask",
        headers=HEADERS,
        json={
            "question": "What did you just tell me about?",
            "session_id": "test-session",
        },
        timeout=60,
    )
    print(f"Status : {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Answer : {d['answer'][:300]}")
    else:
        print("(LLM API key required - see note above)")

    # -- 5. Session history --
    sep("5. GET /session/test-session")
    r = requests.get(f"{BASE}/session/test-session", headers=HEADERS, timeout=10)
    print(f"Status : {r.status_code}")
    d = r.json()
    print(f"Messages in history: {d['count']}")

    # -- 6. Summarize --
    sep("6. POST /summarize - test_ml.txt")
    r = requests.post(
        f"{BASE}/summarize",
        headers=HEADERS,
        json={"file_name": FILE_NAME},
        timeout=60,
    )
    print(f"Status : {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Summary:\n{d['summary'][:400]}")
    else:
        print("(LLM API key required)")

    # -- 7. Concept map (mermaid) --
    sep("7. POST /concept-map - mermaid format")
    r = requests.post(
        f"{BASE}/concept-map",
        headers=HEADERS,
        json={"file_name": FILE_NAME, "output_format": "mermaid"},
        timeout=60,
    )
    print(f"Status : {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Format : {d['output_format']}")
        print(f"Map:\n{d['concept_map'][:500]}")
    else:
        print("(LLM API key required)")

    # -- 8. Voice overview --
    sep("8. POST /voice-overview - test_ml.txt")
    r = requests.post(
        f"{BASE}/voice-overview",
        headers=HEADERS,
        json={"file_name": FILE_NAME, "language": "en"},
        timeout=60,
    )
    print(f"Status : {r.status_code}")
    if r.status_code == 200:
        d = r.json()
        print(f"Audio file   : {d.get('audio_file')}")
        print(f"Download URL : {d.get('download_url')}")
        print(f"Summary text : {d.get('summary_text', '')[:200]}")
        if d.get("audio_file"):
            audio_name = d["audio_file"]
            sep(f"9. GET /voice-overview/{audio_name}")
            r2 = requests.get(f"{BASE}/voice-overview/{audio_name}", headers=HEADERS, timeout=10)
            print(f"Status       : {r2.status_code}")
            print(f"Size (bytes) : {len(r2.content)}")
    else:
        print("(LLM API key required)")

    # -- 10. Delete test file --
    sep(f"10. DELETE /files/{FILE_NAME}")
    r = requests.delete(f"{BASE}/files/{FILE_NAME}", headers=HEADERS, timeout=10)
    print(f"Status : {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    print("\n\nAll tests complete!")


if __name__ == "__main__":
    main()
