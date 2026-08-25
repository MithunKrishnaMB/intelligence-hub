from dotenv import load_dotenv
load_dotenv()

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Path, status
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import asyncio
import models
from database import engine, get_db
from llm_service import extract_meeting_insights, answer_question_with_context, analyze_meeting_sentiment
from vector_service import add_transcript_to_vector_db, search_transcripts
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from pdf_generator import generate_meeting_pdf

# Create the tables in MariaDB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Meeting Intelligence Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".txt", ".vtt"}

# Pydantic schemas for Auth
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user.password)
    # Include the name when creating the database record
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    # Now we return the name along with the email
    return {
        "id": current_user.id,
        "name": current_user.name, 
        "email": current_user.email
    }

@app.post("/upload/")
async def upload_transcripts(files: List[UploadFile] = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    upload_summaries = []

    for file in files:
        # Validate the file type and show a clear error message if an unsupported format is uploaded[cite: 20].
        file_extension = f".{file.filename.split('.')[-1].lower()}"
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file.filename}. Only .txt and .vtt are allowed."
            )

        # Read content
        content_bytes = await file.read()
        content_text = content_bytes.decode('utf-8', errors='ignore')
        
        # Calculate summary statistics
        word_count = len(content_text.split())
        
        # Save to MariaDB
        new_transcript = models.Transcript(
            filename=file.filename,
            content=content_text,
            word_count=word_count,
            user_id=current_user.id
        )
        db.add(new_transcript)

        # After upload, display a summary of each transcript[cite: 21].
        upload_summaries.append({
            "transcript_obj": new_transcript,
            "file_name": file.filename,
        })

    # Single commit for the entire batch instead of per-file commits
    db.commit()
    
    # Refresh and build response after the single commit
    result_summaries = []
    for item in upload_summaries:
        obj = item["transcript_obj"]
        db.refresh(obj)
        result_summaries.append({
            "transcript_id": obj.id,
            "file_name": item["file_name"],
            "detected_meeting_date": "Pending AI Extraction", # Placeholder for Day 2
            "speakers_identified": 0, # Placeholder for Day 2
            "total_word_count": obj.word_count
        })

    return {"message": "Files uploaded successfully", "summaries": result_summaries}

@app.post("/transcripts/{transcript_id}/process")
async def process_transcript(
    background_tasks: BackgroundTasks,
    transcript_id: int = Path(..., description="The ID of the transcript to process"),
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    # 1. Fetch the transcript
    transcript = db.query(models.Transcript).filter(
        models.Transcript.id == transcript_id,
        models.Transcript.user_id == current_user.id  # <-- The security lock
    ).first()
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    try:
        # 2. Call BOTH AI Services concurrently — cuts latency ~50%
        insights, sentiment_data = await asyncio.gather(
            extract_meeting_insights(transcript.content),
            analyze_meeting_sentiment(transcript.content),
        )

        # 3. Update Transcript Metadata
        # We safely extract the metadata, defaulting to empty dictionary if missing
        metadata = insights.get("metadata", {})
        transcript.meeting_date = metadata.get("meeting_date", "")
        transcript.speakers_identified = metadata.get("speakers_identified", 0)
        transcript.duration = metadata.get("duration", "")
        transcript.summary = metadata.get("summary", "")
        transcript.overall_sentiment_score = sentiment_data.get("overall_sentiment_score", 50)
        transcript.sentiment_comment = sentiment_data.get("sentiment_comment", "General discussion without strong sentiment swings.")

        # 4. Batch-insert all child records using add_all() instead of per-item add()
        child_records = []

        for dec_text in insights.get("decisions", []):
            child_records.append(models.Decision(transcript_id=transcript.id, content=dec_text))

        for item in insights.get("action_items", []):
            child_records.append(models.ActionItem(
                transcript_id=transcript.id,
                owner=item.get("owner", "Unknown"),
                task=item.get("task", "Unknown"),
                due_date=item.get("due_date", "Not specified")
            ))

        for seg in sentiment_data.get("segments", []):
            child_records.append(models.SegmentSentiment(
                transcript_id=transcript.id,
                segment_index=seg.get("segment_index", 0),
                topic=seg.get("topic", "Unknown"),
                vibe=seg.get("vibe", "neutral")
            ))

        for spk in sentiment_data.get("speakers", []):
            child_records.append(models.SpeakerSentiment(
                transcript_id=transcript.id,
                speaker=spk.get("speaker", "Unknown"),
                overall_vibe=spk.get("overall_vibe", "neutral"),
                alignment=spk.get("alignment", "")
            ))

        db.add_all(child_records)
        db.commit()

        # 7. Add to Vector DB for the Chatbot in the background
        background_tasks.add_task(add_transcript_to_vector_db, transcript.id, transcript.filename, transcript.content)

        return {
            "message": "Processing and Sentiment Analysis complete",
            "decisions_extracted": len(insights.get("decisions", [])),
            "action_items_extracted": len(insights.get("action_items", [])),
            "segments_analyzed": len(sentiment_data.get("segments", [])),
            "speakers_analyzed": len(sentiment_data.get("speakers", []))
        }
    
    except Exception as e:
        db.delete(transcript)
        db.commit()
        raise HTTPException(
            status_code=503, 
            detail="The AI service is temporarily overloaded. Please retry."
        )

class ChatRequest(BaseModel):
    question: str
    transcript_id: Optional[int] = None  # Allow frontend to specify which meeting

@app.post("/chat")
async def chat_with_transcripts(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    # Prevent users from chatting with meetings they don't own
    transcript = None
    if request.transcript_id:
        transcript = db.query(models.Transcript).filter(
            models.Transcript.id == request.transcript_id,
            models.Transcript.user_id == current_user.id
        ).first()

    if not transcript and request.transcript_id:
        raise HTTPException(status_code=404, detail="Transcript ID not found in database or unauthorized.")

    try:
        # 1. Search ChromaDB, passing the transcript_id if provided by the frontend
        search_results = search_transcripts(
            query=request.question, 
            n_results=5, 
            transcript_id=request.transcript_id
        )
        
        # 2. Package the results cleanly using zip() instead of index-based iteration
        context_chunks = []
        if search_results['documents'] and len(search_results['documents'][0]) > 0:
            docs = search_results['documents'][0]
            metadatas = search_results['metadatas'][0]
            
            context_chunks = [
                {"text": doc, "filename": meta["filename"]}
                for doc, meta in zip(docs, metadatas)
            ]

        # 3. If no chunks found, return early
        if not context_chunks:
            return {"answer": "I could not find any information regarding that in this meeting."}

        # 4. Pass the context and the question to Gemini (now async)
        answer = await answer_question_with_context(request.question, context_chunks)
        
        return {
            "question": request.question,
            "answer": answer,
            "sources_used": list({chunk["filename"] for chunk in context_chunks})  # Set comprehension for dedup
        }

    except Exception as e:
        print(f"Chatbot Exception: {e}")
        raise HTTPException(
            status_code=503, 
            detail="The AI service is temporarily overloaded. Please retry."
        )


@app.get("/dashboard/")
async def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Optimized: Single aggregated query replaces the N+1 loop.
    Previously: 1 query for transcripts + 2 COUNT queries per transcript (101 queries for 50 transcripts).
    Now: 1 query total using outerjoin + group_by.
    """
    # Subqueries for action_items and decisions counts
    actions_sub = (
        db.query(
            models.ActionItem.transcript_id,
            func.count(models.ActionItem.id).label("actions_count")
        )
        .group_by(models.ActionItem.transcript_id)
        .subquery()
    )
    decisions_sub = (
        db.query(
            models.Decision.transcript_id,
            func.count(models.Decision.id).label("decisions_count")
        )
        .group_by(models.Decision.transcript_id)
        .subquery()
    )

    # Single query joining transcript with pre-aggregated counts
    rows = (
        db.query(
            models.Transcript,
            func.coalesce(actions_sub.c.actions_count, 0).label("actions_count"),
            func.coalesce(decisions_sub.c.decisions_count, 0).label("decisions_count"),
        )
        .outerjoin(actions_sub, models.Transcript.id == actions_sub.c.transcript_id)
        .outerjoin(decisions_sub, models.Transcript.id == decisions_sub.c.transcript_id)
        .filter(models.Transcript.user_id == current_user.id)
        .order_by(models.Transcript.upload_date.desc())
        .all()
    )

    dashboard_data = []
    
    for t, actions_count, decisions_count in rows:
        # Determine UI colors and icons based on the AI's score
        score = t.overall_sentiment_score
        if score >= 70:
            sentiment_icon = "trending_up"
            sentiment_color = "text-emerald-600"
        elif score >= 40:
            sentiment_icon = "balance"
            sentiment_color = "text-yellow-600"
        else:
            sentiment_icon = "trending_down"
            sentiment_color = "text-red-600"
        
        dashboard_data.append({
            "id": str(t.id),
            "icon": "groups",
            "iconBgClass": "bg-secondary-container",
            "iconColorClass": "text-on-secondary-container",
            "title": t.filename,
            "summary": t.summary,
            "date": t.upload_date.isoformat() + "Z" if t.upload_date else None,
            "transcripts": 1,
            "actions": actions_count,
            "decisions": decisions_count,
            
            "sentiment": score,
            "sentimentIcon": sentiment_icon,
            "sentimentColorClass": sentiment_color
        })
        
    return dashboard_data

@app.get("/transcripts/{transcript_id}/details")
async def get_transcript_details(transcript_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Optimized: Uses joinedload() to eagerly load all child relationships in a single query
    instead of 5 separate queries (transcript + decisions + actions + segments + speakers).
    """
    # Single query with eager loading of all relationships
    transcript = (
        db.query(models.Transcript)
        .options(
            joinedload(models.Transcript.decisions),
            joinedload(models.Transcript.action_items),
            joinedload(models.Transcript.segments),
            joinedload(models.Transcript.speaker_sentiments),
        )
        .filter(
            models.Transcript.id == transcript_id,
            models.Transcript.user_id == current_user.id
        )
        .first()
    )
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    # Sort segments in Python (trivial for small lists) instead of a separate ORDER BY query
    sorted_segments = sorted(transcript.segments, key=lambda s: s.segment_index)

    # Format the date (handling potentially missing data)
    formatted_date = transcript.upload_date.isoformat() + "Z" if transcript.upload_date else None

    # Package and return
    return {
        "id": transcript.id,
        "filename": transcript.filename,
        "meeting_date": transcript.meeting_date,
        "upload_date": formatted_date,
        "word_count": transcript.word_count,
        "duration": transcript.duration,
        "summary": transcript.summary,
        "overall_sentiment_score": transcript.overall_sentiment_score,
        "sentiment_comment": transcript.sentiment_comment,
        "decisions": [{"id": d.id, "content": d.content} for d in transcript.decisions],
        "action_items": [{"id": a.id, "owner": a.owner, "task": a.task, "due_date": a.due_date} for a in transcript.action_items],
        "segments": [{"id": s.id, "segment_index": s.segment_index, "topic": s.topic, "vibe": s.vibe} for s in sorted_segments],
        "speakers": [{"id": sp.id, "speaker": sp.speaker, "overall_vibe": sp.overall_vibe, "alignment": sp.alignment} for sp in transcript.speaker_sentiments]
    }

@app.get("/transcripts/{transcript_id}/pdf")
async def export_transcript_pdf(transcript_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Fetch details using the existing function (this handles auth and data gathering)
    data = await get_transcript_details(transcript_id, db, current_user)
    
    # 2. Generate PDF
    pdf_buffer = generate_meeting_pdf(data)
    
    # 3. Create a safe filename using generator expression
    filename = data.get("filename", f"meeting_{transcript_id}")
    safe_filename = "".join(c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '-', '_')).rstrip()
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{safe_filename}.pdf\""}
    )

@app.delete("/transcripts/{transcript_id}")
async def delete_transcript(
    transcript_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 1. Find the transcript, ensuring it belongs to the logged-in user
    transcript = db.query(models.Transcript).filter(
        models.Transcript.id == transcript_id,
        models.Transcript.user_id == current_user.id
    ).first()

    # 2. If it doesn't exist, throw an error
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    # 3. Delete it from the database
    db.delete(transcript)
    db.commit()
    
    return {"message": "Meeting deleted successfully"}