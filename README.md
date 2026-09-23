# Mini NotebookLM 🗒️

A lightweight, production-ready **RAG (Retrieval-Augmented Generation)** backend — a simplified take on Google NotebookLM. Upload documents, chat with them, get summaries.

---

## ⚡ Quick Start

### 1. Clone & enter the directory
```bash
cd mini-notebooklm
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up your API key
```bash
# Copy the example env file
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux

# Edit .env and add your Gemini or OpenAI API key
```

### 5. Run the server
```bash
python main_new.py
```
Or use the provided batch script:
```bash
run.bat
```

Server starts at: **http://localhost:5000**
Interactive API docs: **http://localhost:5000/docs**

> **Note:** All endpoints require an `X-User-Profile` header (your username)
> for per-user document isolation. The frontend sends this automatically
> after login.

### 6. (Optional) Run the frontend
```bash
cd mini-notebooklm-frontend
npm install
npm run dev
```
Frontend starts at: **http://localhost:5173**

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server status check *(requires `X-User-Profile` header)* |
| `POST` | `/upload` | Upload a document (PDF/TXT/DOCX/PPTX) *(requires header)* |
| `POST` | `/ask` | Ask a question about your docs *(requires header)* |
| `POST` | `/summarize` | Summarize uploaded document(s) *(requires header)* |
| `GET` | `/files` | List all uploaded files *(requires header)* |
| `DELETE` | `/files/{name}` | Delete an uploaded file *(requires header)* |
| `GET` | `/session/{id}` | Get chat history for a session |
| `DELETE` | `/session/{id}` | Clear session history |
| `POST` | `/voice-overview` | Generate a spoken audio overview *(requires header)* |
| `POST` | `/concept-map` | Generate a concept map from documents *(requires header)* |
| `POST` | `/youtube-videos` | Find YouTube videos related to your docs *(requires header)* |
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login an existing user |

---

## 📁 Project Structure

```
mini-notebooklm/
├── main_new.py            # Backend (FastAPI + RAG + ChromaDB)
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variable template
├── .env                   # Your local config (not committed)
├── run.bat                # Windows start script
├── test_api.py            # API smoke tests
├── users.json             # User credentials (bcrypt hashes)
├── uploads/               # Auto-created: uploaded files (per-user)
├── chroma_db/             # Auto-created: vector database
├── voice_overviews/       # Auto-created: generated audio overviews
├── render.yaml            # Deploy config (Render.com)
└── mini-notebooklm-frontend/  # React + Vite frontend
    ├── package.json
    ├── vite.config.js
    └── src/
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `gemini` | `gemini` or `openai` |
| `GEMINI_API_KEY` | — | Your Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model to use |
| `OPENAI_API_KEY` | — | Your OpenAI API key (if `LLM_PROVIDER=openai`) |
| `YOUTUBE_API_KEY` | — | YouTube Data API v3 key |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | HuggingFace embedding model (runs locally) |
| `CHUNK_SIZE` | `800` | Characters per text chunk |
| `CHUNK_OVERLAP` | `100` | Overlap between chunks |
| `TOP_K_CHUNKS` | `8` | Chunks retrieved per query |
| `MAX_HISTORY` | `10` | Max messages kept per session |
| `LLM_MAX_OUTPUT_TOKENS` | `3072` | Max output tokens for LLM |
| `PORT` | `5000` | Server port |
