from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import models
from database import engine, get_db

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