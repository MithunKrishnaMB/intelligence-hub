from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Path, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models
from database import engine, get_db
from llm_service import extract_meeting_insights, answer_question_with_context, analyze_meeting_sentiment
from vector_service import add_transcript_to_vector_db, search_transcripts
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from auth import get_password_hash, verify_password, create_access_token, get_current_user

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
        db.commit()
        db.refresh(new_transcript)

        # After upload, display a summary of each transcript[cite: 21].
        upload_summaries.append({
            "transcript_id": new_transcript.id,
            "file_name": new_transcript.filename,
            "detected_meeting_date": "Pending AI Extraction", # Placeholder for Day 2
            "speakers_identified": 0, # Placeholder for Day 2
            "total_word_count": new_transcript.word_count
        })

    return {"message": "Files uploaded successfully", "summaries": upload_summaries}

@app.post("/transcripts/{transcript_id}/process")
async def process_transcript(
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

    # 2. Call the AI Services
    insights = extract_meeting_insights(transcript.content)
    sentiment_data = analyze_meeting_sentiment(transcript.content)

    # 3. Update Transcript Metadata
    # We safely extract the metadata, defaulting to empty dictionary if missing
    metadata = insights.get("metadata", {})
    transcript.meeting_date = metadata.get("meeting_date", "")
    transcript.speakers_identified = metadata.get("speakers_identified", 0)
    transcript.duration = metadata.get("duration", "")
    transcript.summary = metadata.get("summary", "")
    transcript.overall_sentiment_score = sentiment_data.get("overall_sentiment_score", 50)
    transcript.sentiment_comment = sentiment_data.get("sentiment_comment", "General discussion without strong sentiment swings.")

    # 4. Store Decisions & Action Items
    for dec_text in insights.get("decisions", []):
        db.add(models.Decision(transcript_id=transcript.id, content=dec_text))

    for item in insights.get("action_items", []):
        db.add(models.ActionItem(
            transcript_id=transcript.id,
            owner=item.get("owner", "Unknown"),
            task=item.get("task", "Unknown"),
            due_date=item.get("due_date", "Not specified")
        ))

    # 5. Store Sentiment Segments
    for seg in sentiment_data.get("segments", []):
        db.add(models.SegmentSentiment(
            transcript_id=transcript.id,
            segment_index=seg.get("segment_index", 0),
            topic=seg.get("topic", "Unknown"),
            vibe=seg.get("vibe", "neutral")
        ))

    # 6. Store Speaker Sentiments
    for spk in sentiment_data.get("speakers", []):
        db.add(models.SpeakerSentiment(
            transcript_id=transcript.id,
            speaker=spk.get("speaker", "Unknown"),
            overall_vibe=spk.get("overall_vibe", "neutral"),
            alignment=spk.get("alignment", "")
        ))

    db.commit()

    # 7. Add to Vector DB for the Chatbot
    add_transcript_to_vector_db(transcript.id, transcript.filename, transcript.content)

    return {
        "message": "Processing and Sentiment Analysis complete",
        "decisions_extracted": len(insights.get("decisions", [])),
        "action_items_extracted": len(insights.get("action_items", [])),
        "segments_analyzed": len(sentiment_data.get("segments", [])),
        "speakers_analyzed": len(sentiment_data.get("speakers", []))
    }

class ChatRequest(BaseModel):
    question: str
    transcript_id: Optional[int] = None  # Allow frontend to specify which meeting

@app.post("/chat/")
async def chat_with_transcripts(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    
    # Prevent users from chatting with meetings they don't own
    if request.transcript_id:
        transcript = db.query(models.Transcript).filter(
            models.Transcript.id == request.transcript_id,
            models.Transcript.user_id == current_user.id
        ).first()

        if not transcript:
            raise HTTPException(status_code=404, detail="Unauthorized to chat with this meeting")

    # 1. Search ChromaDB, passing the transcript_id if provided by the frontend
    search_results = search_transcripts(
        query=request.question, 
        n_results=5, 
        transcript_id=request.transcript_id
    )
    
    # 2. Package the results cleanly
    context_chunks = []
    if search_results['documents'] and len(search_results['documents'][0]) > 0:
        docs = search_results['documents'][0]
        metadatas = search_results['metadatas'][0]
        
        for i in range(len(docs)):
            context_chunks.append({
                "text": docs[i],
                "filename": metadatas[i]["filename"]
            })

    # 3. If no chunks found, return early
    if not context_chunks:
        return {"answer": "I could not find any information regarding that in this meeting."}

    # 4. Pass the context and the question to Gemini
    answer = answer_question_with_context(request.question, context_chunks)
    
    return {
        "question": request.question,
        "answer": answer,
        "sources_used": list(set([chunk["filename"] for chunk in context_chunks])) # Deduplicate sources
    }

@app.get("/dashboard/")
async def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Only fetch transcripts belonging to THIS user
    transcripts = db.query(models.Transcript).filter(
        models.Transcript.user_id == current_user.id
    ).order_by(models.Transcript.upload_date.desc()).all()
    
    dashboard_data = []
    
    for t in transcripts:
        # Count action items and decisions for this specific transcript
        actions_count = db.query(models.ActionItem).filter(models.ActionItem.transcript_id == t.id).count()
        decisions_count = db.query(models.Decision).filter(models.Decision.transcript_id == t.id).count()
        
        # Format the date
        formatted_date = t.upload_date.isoformat() + "Z" if t.upload_date else None

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
    # 1. Fetch the main transcript record
    transcript = db.query(models.Transcript).filter(
        models.Transcript.id == transcript_id,
        models.Transcript.user_id == current_user.id
    ).first()
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    # 2. Fetch all related data
    decisions = db.query(models.Decision).filter(models.Decision.transcript_id == transcript_id).all()
    actions = db.query(models.ActionItem).filter(models.ActionItem.transcript_id == transcript_id).all()
    segments = db.query(models.SegmentSentiment).filter(models.SegmentSentiment.transcript_id == transcript_id).order_by(models.SegmentSentiment.segment_index).all()
    speakers = db.query(models.SpeakerSentiment).filter(models.SpeakerSentiment.transcript_id == transcript_id).all()

    # 3. Format the date (handling potentially missing data)
    formatted_date = transcript.upload_date.isoformat() + "Z" if transcript.upload_date else None

    # 4. Package and return
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
        "decisions": [{"id": d.id, "content": d.content} for d in decisions],
        "action_items": [{"id": a.id, "owner": a.owner, "task": a.task, "due_date": a.due_date} for a in actions],
        "segments": [{"id": s.id, "segment_index": s.segment_index, "topic": s.topic, "vibe": s.vibe} for s in segments],
        "speakers": [{"id": sp.id, "speaker": sp.speaker, "overall_vibe": sp.overall_vibe, "alignment": sp.alignment} for sp in speakers]
    }