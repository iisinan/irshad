import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, func, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

VariantJSON = JSON().with_variant(JSON, "sqlite") # SQLAlchemy natively handles JSON in SQLite

class BusinessScreening(Base):
    __tablename__ = "business_screenings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, index=True) # Usually we'd map this but for simplicity we rely on ticker
    ticker = Column(String, index=True, nullable=False)
    
    business_summary = Column(Text, nullable=True)
    current_core_business = Column(Text, nullable=True)
    detected_business_activities = Column(JSON, nullable=True, default=list)
    detected_prohibited_activities = Column(JSON, nullable=True, default=list)
    supporting_evidence = Column(JSON, nullable=True, default=list)
    source_urls = Column(JSON, nullable=True, default=list)
    source_publication_dates = Column(JSON, nullable=True, default=list)
    ai_explanation = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.0)
    business_compliance_status = Column(String, nullable=True)
    last_analysed_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
