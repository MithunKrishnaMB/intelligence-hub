# Intelligence Hub Design Document

## 1. Document Control

- Product: Intelligence Hub
- Version: 1.0
- Last updated: 2026-04-07
- Status: Active implementation
- Audience: Engineers, reviewers, technical stakeholders, maintainers

## 2. Executive Summary

Intelligence Hub transforms raw meeting transcripts into actionable insights using a multi-layered AI pipeline. The system processes .txt and .vtt transcript files to extract core metadata, decisions, action items, and perform behavioral sentiment analysis. 

Built with a FastAPI backend and a React/Next.js frontend, it leverages Gemini 2.5 Flash for language processing and a local ChromaDB instance to enable a context-aware Retrieval-Augmented Generation (RAG) chatbot, allowing users to query specific meeting contexts.

## 3. Problem Statement

Professionals spend a significant amount of time manually reviewing meeting recordings and transcripts to compile action items, review key decisions, and recall contextual details. This manual review process leads to:

- Lost productivity and administrative overhead
- Missed action items or misunderstood context
- Lack of visibility into project momentum or team alignment
- Inability to quickly query past meeting discussions

Intelligence Hub addresses this by fully automating the post-meeting analysis and making conversational queries possible over historical meetings.

## 4. Goals and Non-Goals

### 4.1 Goals

- Ingest and store meeting transcripts securely per user
- Automatically extract meeting metadata (date, duration, speakers, comprehensive summary)
- Automatically identify and structure decisions and action items (owner, task, deadline)
- Provide chronological and speaker-level sentiment and vibe analysis
- Provide a responsive Dashboard UI to track meeting metrics and sentiment trends
- Enable a context-aware chatbot capable of answering questions (RAG) grounded strictly in meeting context

### 4.2 Non-Goals (Current Version)

- Real-time audio or video transcription (the system currently acts on pre-recorded textual transcripts)
- Enterprise Role-Based Access Control (RBAC) (currently isolated per individual user)
- Background processing queues (processing is done sequentially via synchronous endpoints)
- Semantic search across *multiple* meetings simultaneously in the chat UI (currently isolated to a specific meeting)

## 5. Scope

### In Scope

- User authentication, registration, and isolated tenant storage
- End-to-end transcript processing pipeline (chunking, processing, vector embedding)
- RAG pipeline with "zero hallucination" prompting guidelines
- Database operations for structured insights

### Out of Scope

- Audio/video content ingestion
- Integration with calendar APIs (Google Calendar, Outlook)
- External task management system integrations (Jira, Asana, Linear)

## 6. System Context and Flow

### 6.1 High-Level Flow

1. User authenticates via frontend and uploads transcript files.
2. Frontend calls `/upload/` API; the backend securely stores the raw text in MariaDB.
3. User triggers processing via `/transcripts/{id}/process`.
4. Backend executes:
   - Synchronous call to Gemini to extract metadata, actions, and decisions.
   - Synchronous call to Gemini to analyze chronological segments and speaker sentiment.
   - Synchronous text chunking and ingestion into a local ChromaDB.
5. Structured insights are saved to the SQL database.
6. User enters the detailed meeting view to interact with the Chatbot UI.
7. Queries are sent to `/chat/`, retrieving vector context from ChromaDB and forwarding to Gemini to synthesize grounded answers.

### 6.2 Architectural Pattern

- Pattern: Retrieval-Augmented Generation (RAG) coupled with batched AI extraction pipeline.
- Orchestration style: Sequential REST execution per entity.
- Delivery style: Stateful Request-Response.

## 7. Functional Requirements

### FR-1: Account Handling & Auth

- Support registration and JWT-based authentication.
- Scope all database entities and Vector queries strictly to the currently authenticated user's ID.

### FR-2: Transcript Ingestion

- Accept file payloads (.txt, .vtt) from the UI.
- Extract basic word counts and persist the raw text for processing.

### FR-3: AI Pipeline - Insight Extraction

- Utilize Gemini to extract `meeting_date`, `speakers_identified`, `duration`, and a brief `summary`.
- Identify formalized agreements as `decisions`.
- Extract `action_items` into structured `owner`, `task`, and `due_date` fields.

### FR-4: AI Pipeline - Sentiment Analysis

- Calculate an overall sentiment/health score (0-100) based on alignment and conflict.
- Extract chronological `segments` highlighting the flow of the meeting and topics discussed.
- Extract individual `speaker_sentiments` and alignment stances.

### FR-5: Conversational Search (Chatbot)

- Vectorize transcript data in small semantic overlapping chunks into ChromaDB.
- Respond to queries dynamically via RAG.
- Enforce strict out-of-context handling and source citation natively through prompt engineering.

## 8. Non-Functional Requirements

- Reliability: Proper exception handling around AI API limits and graceful failure reporting.
- Latency: Chat responses should process vector similarity search and LLM synthesis within 3-5 seconds.
- Storage: Vector storage should maintain persistence locally without heavy operational overhead.
- Portability: Easy containerization or local deployment alongside MariaDB.
- Security: Hash passwords via bcrypt; protect API endpoints with OAuth2 `Depends()`.

## 9. Component Design

## 9.1 Backend

### Framework and API Layer

- FastAPI framework providing REST endpoints and Swagger UI.
- Primary endpoints:
  - `POST /register`, `POST /login`
  - `POST /upload/`
  - `POST /transcripts/{id}/process`
  - `POST /chat/`
  - `GET /dashboard/` (Aggregated stats for the home screen)
  - `GET /transcripts/{id}/details`

### State & Storage Model

**MariaDB (Relational State):**
Tracks isolated entities via SQLAlchemy ORM.
- `User`
- `Transcript`
- `Decision`
- `ActionItem`
- `SegmentSentiment`
- `SpeakerSentiment`

**ChromaDB (Vector State):**
Maintains transient numerical embeddings representing portions of the transcript body, tagged with `transcript_id` and `filename` metadata for rapid similarity searches.

## 9.2 Agent / AI Service Design

### Insight Extractor

- Model: Gemini 2.5 Flash 
- Output contract: Strict JSON mapping for metadata, decisions array, and action_items array.
- Processing style: Single-shot completion prompt.

### Behavioral Sentiment Analyst

- Model: Gemini 2.5 Flash
- Output contract: Strict JSON mapping with fixed enumerated `vibe` types (agreement, conflict, frustration, enthusiasm, neutral).
- Provides chronological segmentation and holistic score out of 100.

### RAG Synthesizer

- Model: Gemini 2.5 Flash and `all-MiniLM-L6-v2` semantic embedder.
- Output contract: Formatted Markdown.
- Guardrails:
  - Strict zero-hallucination constraint.
  - Required inline contextual citations (e.g., `[Source: filename.txt]`).
  - Strict fallback clauses when data is missing from retrieved context chunks.

## 9.3 Frontend

- Framework: React (built with Vite)
- UI Library: Tailwind CSS
- Data transport: Standard REST `fetch` with Bearer tokens mapping to FastAPI backend.
- UX patterns:
  - Card-based dynamic dashboard lists with icon indicators for meeting sentiment.
  - Tabular displays for decisions and actions.
  - Interactive right-drawer or embedded pane for Chat interactions.

## 10. API Contract Summary

### 10.1 `POST /transcripts/{id}/process`

Request:

- Protected route requiring Bearer Token.

Response includes:

- `message` (status)
- `decisions_extracted`, `action_items_extracted` counts.

### 10.2 `POST /chat/`

Request includes:

- `question`: string
- `transcript_id`: int (Optional - bounds the vector search to a target meeting ID)

Response includes:

- `question`: string mirror
- `answer`: string (Markdown formatted AI answer)
- `sources_used`: list (Array of filenames referenced)

### 10.3 `GET /dashboard/`

Response includes:
- Aggregated array of transcripts containing summarized view of total action items, decisions, dates, calculated sentiment colors (red, yellow, emerald), and associated UI icons.

## 11. Tech Stack Chosen and Rationale

### Backend

- Python 3 + FastAPI
- SQLAlchemy + PyMySQL
- Uvicorn for serving

Why:

- FastAPI excels at building cleanly documented AI middleware APIs.
- Pydantic models complement the strict JSON output requests from Gemini beautifully.

### Vector DB

- ChromaDB (Local persistent client)

Why:

- Eradicates the need to maintain an external cloud vector database cluster (like Pinecone) for lightweight textual tracking.
- Ships with a free local default embedding function (`all-MiniLM-L6-v2`) ensuring low-latency chunk embeddings immediately upon upload without external token network costs.

### Models

- Core intelligence: Gemini 2.5 Flash

Why:

- Speed to extraction ratio is extremely high. Flash naturally excels at JSON extraction tasks and large context windows (helpful for massive transcripts) with very low latency.

## 12. Trade-offs Made

### 12.1 Synchronous AI Extraction

- Decision: Block the `/process` request while Gemini executes multiple chained extraction workflows.
- Benefit: Simplifies architecture (no Celery, no Redis, no websockets) and makes frontend flow highly predictable.
- Cost: Process is vulnerable to gateway timeouts if the transcript length balloons past a timeout window threshold.

### 12.2 Single-Document RAG Only (Current State)

- Decision: Users currently chat with individual transcripts using `where={"transcript_id": id}` constraints natively inside ChromaDB.
- Benefit: Ensures highly specific factual relevance to a single meeting.
- Cost: Prevents users from asking cross-meeting questions like "Summarize all my interactions regarding the marketing budget across the last 5 weeks."

### 12.3 Hardcoded MariaDB URI

- Decision: Local environment is tailored to a hardcoded MySQL local credential string (`root:956282@localhost`).
- Benefit: Extremely fast local developer onboarding if database specs match.
- Cost: Lacks 12-factor infrastructure portability in production without `DATABASE_URL` environment variables.

## 13. Edge Case Handling

| Edge case | Detection | Handling |
|---|---|---|
| Unsupported File Format | Extension validation on upload | Halts at 400 Bad Request explicitly detailing allowed types |
| Missing/Mangled JSON | Exception in `json.loads` | Fails gracefully triggering a 503 HTTP status recommending a retry |
| Cross-Tenant Data Access | Backend query filtering | Queries are strictly hard-locked (`models.Transcript.user_id == current_user.id`) |
| Unanswered RAG query | Gemini Output matching "I cannot answer..." | Returns a graceful rejection message to the UI based on strict system prompts |
| Missing metadata values | Pydantic / dict `.get('key', '')` | Defaults to empty strings or 0 to map cleanly to SQL inserts without throwing |

## 14. Security and Privacy Considerations

- The application uses `bcrypt` for local password hashing.
- API keys (`GEMINI_API_KEY`) are protected and isolated into a `.env` footprint that is decoupled from Git.
- Transcripts, which can contain highly sensitive PII and proprietary business logic, are transmitted over TLS to Gemini.
- Vectors are stored physically unencrypted on the host disk inside the `./chroma_data` directory.
- For production, rigorous CORS origin restriction must be established. 

## 15. Performance and Scalability

Current characteristics:

- Performance correlates linearly with Gemini API latency times and the transcript length submitted.
- Using `all-MiniLM-L6-v2` executes relatively rapidly on standard local CPUs but could throttle if 100+ documents are processed simultaneously.

Future scaling options:

- Implement BackgroundTasks or Celery workers for non-blocking processing.
- Transition ChromeDB from a local directory instance into a scalable deployment (`chromadb-server`).

## 16. Reliability and Recovery

- The system implements protective atomic rollbacks. If the AI extraction process fails mid-flight, the system actively invokes `db.delete(transcript)` to purge the half-processed transcript entry and instructs the user to retry, maintaining data integrity.

## 17. Testing Strategy

Recommended test matrix:

- Data models: Verify table cascade behaviors (e.g. purging a Transcript cleanses all related ActionItems and Vector indexes).
- Inference resilience: Simulating bad JSON payloads from Gemini to verify fail-safes.
- Vector Retrieval: Test intersection of query terms with multi-page chunks to ensure context window size holds without truncation.

## 18. Deployment and Configuration

### Required environment variables

- `GEMINI_API_KEY`: The authenticated session token to access the Google AI API.
- Local configuration requiring MariaDB running on `localhost:3306` with proper user credentials matching the hardcoded `database.py` link.

### Runtime dependencies

- Python 3 environment running `uvicorn main:app`
- Node.js environment running `npm run dev` 

## 19. Known Limitations

- Transcripts containing over ~10,000 words run risking context window optimization challenges, both in time-to-extract and vectorizing.
- Sentiment extraction relies solely on text; true behavioral tone (vocal inflection) from audio source metadata is completely lost.
- Lacks ability to share transcripts out to alternative team members natively.

## 20. Future Enhancements

- Integrate Whisper API for native audio parsing.
- Refactor the hardcoded DB URI dynamically with a `.env` variable overlay.
- Build "Cross-Meeting Chat" allowing queries across an entire workspace directory.

## 21. Conclusion

Intelligence Hub provides a highly integrated, locally-secured RAG pipeline coupled with AI agent extraction. While prioritizing rapid AI insights via Gemini 2.5 and localized vector embeddings through ChromaDB, it presents a stable foundation that reduces meeting lifecycle fatigue significantly without the overhead of heavy enterprise orchestrators.
