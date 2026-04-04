from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), index=True)
    content = Column(Text)
    word_count = Column(Integer)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    meeting_date = Column(String(50), nullable=True) 
    speakers_identified = Column(Integer, default=0)
    overall_sentiment_score = Column(Integer, default=50)
    summary = Column(Text, nullable=True)
    duration = Column(String(50), nullable=True)
    sentiment_comment = Column(Text, nullable=True)

    # Establish relationships
    decisions = relationship("Decision", back_populates="transcript", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="transcript", cascade="all, delete-orphan")
    segments = relationship("SegmentSentiment", back_populates="transcript", cascade="all, delete-orphan")
    speaker_sentiments = relationship("SpeakerSentiment", back_populates="transcript", cascade="all, delete-orphan")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"))
    content = Column(Text)

    transcript = relationship("Transcript", back_populates="decisions")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"))
    owner = Column(String(255)) # Who
    task = Column(Text)         # What
    due_date = Column(String(100)) # By When

    transcript = relationship("Transcript", back_populates="action_items")

class SegmentSentiment(Base):
    __tablename__ = "segment_sentiments"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"))
    segment_index = Column(Integer) # To keep them in chronological order
    topic = Column(String(255))     # What they were discussing
    vibe = Column(String(50))       # e.g., agreement, conflict, frustration, enthusiasm

    transcript = relationship("Transcript", back_populates="segments")

class SpeakerSentiment(Base):
    __tablename__ = "speaker_sentiments"

    id = Column(Integer, primary_key=True, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"))
    speaker = Column(String(100))
    overall_vibe = Column(String(50))
    alignment = Column(Text)        # Brief summary of their stance/concerns

    transcript = relationship("Transcript", back_populates="speaker_sentiments")