from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), index=True)
    content = Column(Text)
    word_count = Column(Integer)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    # We will populate these later with AI extraction
    meeting_date = Column(String(50), nullable=True) 
    speakers_identified = Column(Integer, default=0)