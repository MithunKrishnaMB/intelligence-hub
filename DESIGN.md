# Meeting Intelligence Hub

## Overview

Meeting Intelligence Hub is an AI-powered pipeline that turns meeting transcripts (.txt or .vtt) into actionable, structured insights and enables context-aware chat. 

It processes transcripts to extract:
- **Metadata & Summary** → Extracts meeting date, duration, speaker count and high-level summary.
- **Decisions & Action Items** → Identifies finalized agreements and tasks with owners and due dates.
- **Sentiment & Tone Analysis** → Analyzes overall meeting sentiment, chronological segments and individual speaker vibes.

The system is stateful, securing data to authenticated users and features vector-based chat and PDF exports.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn, PyJWT
- **Frontend:** React, Vite, TailwindCSS, React Router
- **Databases:** MariaDB (Relational), ChromaDB (Vector)
- **Models:**
  - LLM & Sentiment Analysis → Gemini 2.5 Flash

**Why:** Fast inference, robust structured JSON output capabilities and integrated multimodal context window.

## Architecture Decisions

- **MariaDB + ChromaDB Dual Storage** → MariaDB manages structured relational data (users, action items, decisions), while ChromaDB handles vector embeddings for fast RAG chat retrieval.
- **Asynchronous AI Processing** → `extract_meeting_insights` and `analyze_meeting_sentiment` are executed concurrently using `asyncio.gather`, cutting API latency significantly.
- **Background Task Vectorization** → ChromaDB embeddings are generated as a FastAPI `BackgroundTasks` process to return the HTTP response faster.
- **Single Aggregate Dashboard Query** → Replaced N+1 queries with a single query using outer joins and group_by for dashboard stats.
- **Eager Loading Details** → `joinedload` used for fetching transcript details, converting multiple queries into a single SQL execution.
- **Persistent HTTP Client** → Global `httpx.AsyncClient` with keep-alive connections prevents per-call TCP handshake overhead with the Gemini API.

## Reliability Strategy

- **Strict Output Constraints** → Gemini API is prompted with rigid system instructions and forced to return minified JSON objects matching exact schemas, preventing hallucination.
- **Zero Hallucination Chat Policy** → Chatbot is explicitly instructed to only answer based on retrieved context chunks and to decline if information is missing.
- **Authorized Access Only** → Transcripts, deletions and chat queries are strictly filtered by the authenticated user's ID.
- **Robust Exception Handling** → Uploaded files are verified for `.txt` and `.vtt` formats. If AI parsing fails, the partially inserted transcript is deleted to maintain database consistency.
- **Connection Pooling** → Database connection uses SQLAlchemy `pool_size` and `max_overflow` to manage concurrent load.

## Trade-offs

- **Single API Dependency** → Completely reliant on Google Gemini API; no fallback models currently implemented for failover.
- **Vector DB Local Storage** → ChromaDB writes to local disk directory (`chroma_data`), which may require volume mapping and coordination in multi-instance production environments.
- **In-Memory Uploads** → Transcripts are loaded directly into memory (`await file.read()`). Very large files could cause memory spikes, though mitigated by textual data limitations.
