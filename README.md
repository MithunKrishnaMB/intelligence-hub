# Meeting Intelligence Hub

## The Problem
Professionals spend countless hours manually reviewing meeting recordings and transcripts to compile action items, extract key decisions, and recall the contextual details of what was discussed. This tedious process often results in lost productivity, missed deadlines, and a lack of clear alignment on team objectives.

## The Solution
Meeting Intelligence Hub is a full-stack web application designed to completely automate post-meeting analysis. By allowing users to upload their meeting transcripts, the system leverages AI to automatically extract key metadata, generate concise summaries, and structure all action items and finalized decisions. Additionally, it offers chronological sentiment analysis of the meeting and enables a context-aware Retrieval-Augmented Generation (RAG) chatbot so users can rapidly query their past meetings for specific details without manually rereading the transcripts.

## Tech Stack
### Programming Languages
- Python
- JavaScript

### Frameworks
- **Backend:** FastAPI, SQLAlchemy
- **Frontend:** React (Vite), Tailwind CSS

### Databases
- **Relational DB:** MariaDB / MySQL
- **Vector DB:** ChromaDB (Local persistent client)

### APIs & Third-Party Tools
- **AI Models:** Google Gemini API (Gemini 2.5 Flash)
- **Embeddings:** all-MiniLM-L6-v2 (via Sentence-Transformers)

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js (v18+) & npm
- MariaDB or MySQL running locally

### 1. Database Configuration
Ensure you have a MariaDB or MySQL instance running. Create an empty database named `intelligence_hub`. 
You must also update the connection string inside `backend/database.py` (line 4) to match your local database credentials (e.g., username, password, host, port).

### 2. Backend Setup
1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the core dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Create a `.env` file in the `backend` folder and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   *(The app will automatically create all necessary tables in MariaDB upon startup).*

### 3. Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node.js dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

Once both servers are running, access the user interface in your web browser at the local host address provided by Vite (typically `http://localhost:5173`) to start using the Meeting Intelligence Hub.
