# Meeting Intelligence Hub

## Live Demo

- [Website Link](https://intelligence-hub-eta.vercel.app/)

## The Problem

Organizations generate large volumes of meeting transcripts, but extracting actionable insights, decisions and sentiments from these text files is time-consuming. Without an automated way to process transcripts, crucial action items get lost, sentiment trends are missed and retrieving specific details from past meetings requires tedious manual searching.

## The Solution

Meeting Intelligence Hub is an AI-powered platform that processes meeting transcripts to extract structured insights. It leverages a backend pipeline to automatically identify decisions, action items, meeting segments and speaker sentiments. It also features a conversational AI chatbot that uses vector search to precisely answer questions based solely on the meeting context. The application provides a React-based dashboard for visualization and PDF export functionality.

## Tech Stack

- Programming languages: Python, JavaScript, HTML, CSS
- Frontend frameworks and UI: React, Vite, Tailwind CSS, React Router DOM, Lucide React
- Backend frameworks and orchestration: FastAPI, Uvicorn, SQLAlchemy
- AI and model runtimes: Google Gemini API (gemini-2.5-flash)
- Databases: MariaDB (via PyMySQL) for relational data, ChromaDB for vector storage
- APIs and third-party tools: python-multipart (uploads), PyJWT/Bcrypt (auth), ReportLab (PDF generation)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your_repo_url>
cd intelligence-hub
```

### 2. Backend setup (Python)

```bash
cd backend
python -m venv venv
```

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env` and set your variables:

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/intelligence_hub
```
Make sure MariaDB is running locally and the `intelligence_hub` database is created.

### 3. Frontend setup (React via Vite)

```bash
cd ../frontend
npm install
```

### 4. Run the project locally

Start backend (Terminal 1):

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Start frontend (Terminal 2):

```bash
cd frontend
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
