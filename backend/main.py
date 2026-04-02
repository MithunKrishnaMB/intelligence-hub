from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Path
from sqlalchemy.orm import Session
from typing import List
import models
from database import engine, get_db
from llm_service import extract_meeting_insights

# Create the tables in MariaDB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Meeting Intelligence Hub API")

ALLOWED_EXTENSIONS = {".txt", ".vtt"}

@app.post("/upload/")
async def upload_transcripts(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
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
            word_count=word_count
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
    db: Session = Depends(get_db)
):
    # 1. Fetch the transcript from MariaDB
    transcript = db.query(models.Transcript).filter(models.Transcript.id == transcript_id).first()
    
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    # 2. Call the AI Service
    insights = extract_meeting_insights(transcript.content)

    # 3. Store Decisions in MariaDB
    for dec_text in insights.get("decisions", []):
        new_decision = models.Decision(
            transcript_id=transcript.id,
            content=dec_text
        )
        db.add(new_decision)

    # 4. Store Action Items in MariaDB
    for item in insights.get("action_items", []):
        new_action = models.ActionItem(
            transcript_id=transcript.id,
            owner=item.get("owner", "Unknown"),
            task=item.get("task", "Unknown"),
            due_date=item.get("due_date", "Not specified")
        )
        db.add(new_action)

    db.commit()

    return {
        "message": "Processing complete",
        "decisions_extracted": len(insights.get("decisions", [])),
        "action_items_extracted": len(insights.get("action_items", []))
    }