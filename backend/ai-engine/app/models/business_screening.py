import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, func, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class BusinessScreening(Base):
    __tablename__ = "business_screenings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True) # Usually we'd map this but for simplicity we rely on ticker
    ticker = Column(String, index=True, nullable=False)
    
    business_summary = Column(Text, nullable=True)
    current_core_business = Column(Text, nullable=True)
    detected_business_activities = Column(JSONB, nullable=True, default=list)
    detected_prohibited_activities = Column(JSONB, nullable=True, default=list)
    supporting_evidence = Column(JSONB, nullable=True, default=list)
    source_urls = Column(JSONB, nullable=True, default=list)
    source_publication_dates = Column(JSONB, nullable=True, default=list)
    ai_explanation = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.0)
    business_compliance_status = Column(String, nullable=True)
    last_analysed_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
