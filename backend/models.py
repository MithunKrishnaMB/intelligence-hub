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

    # Establish relationships
    decisions = relationship("Decision", back_populates="transcript", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="transcript", cascade="all, delete-orphan")

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